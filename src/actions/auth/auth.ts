// /actions/auth/auth.ts (Server Actions)

"use server"

import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
// Importez ces fonctions de vos fichiers de logique spécifiques
import { deleteVerificationTokenByEmail, generateVerificationToken, getVerificationTokenByEmail } from './verification-token';
import { send2FACode, sendCode } from '../email'; // Assurez-vous d'avoir une fonction d'envoi de code de base
import { createTowFactorConfermation } from './tow-factor-confermation';
import { getTranslations } from 'next-intl/server';
import { verifySession } from '../permissions';

// --- Types pour la Réponse ---
type AuthResponse = {
    status: number;
    data: any;
};

// --- Schémas de Validation ---

const RegisterSchema = (u: any) => z.object({
    firstname: z.string({ required_error: u("firstnamerequired") }),
    lastname: z.string({ required_error: u("lastnamerequired") }),
    username: z.string({ required_error: u("usernamerequired") })
        .min(3, { message: u("username6") })
        .max(20, { message: u("username20") }),
    email: z.string({ required_error: u("emailrequired") }).email({ message: u("emailinvalid") }),
    password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
    passwordConfirm: z.string({ required_error: u("confirmpasswordrequired") }).min(6, { message: u("password6") }),
}).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: u("confirmpasswordnotmatch"),
});

const LoginSchema = (u: any) => z.object({
    email: z.string({ required_error: u("emailrequired") }), // Permet l'email ou le username
    password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
    code: z.string().optional(),
});

const ConfirmationSchema = z.object({
    code: z.string(),
});


// ----------------------------------------------------------------------
// Fonctions d'Authentification (Auth Actions)
// ----------------------------------------------------------------------

/**
 * Gère l'inscription d'un nouvel utilisateur.
 */
export async function registerUser(data: any): Promise<AuthResponse> {
    const u = await getTranslations('Users');
    const result = RegisterSchema(u).safeParse(data);

    if (!result.success) {
        return { status: 400, data: result.error.errors };
    }
    const { username, email, password, firstname, lastname } = result.data;

    try {
        const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUserByUsername) {
            return { status: 400, data: { message: u('usernameexists') || 'Username already exists' } };
        }

        const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            return { status: 400, data: { message: u('emailexists') || 'Email already exists' } };
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                firstname,
                lastname,
                username,
                email,
                password: passwordHash,
            },
        });
        
        // Envoi du code de vérification juste après l'inscription (non bloquant)
        await SendVerificationCode(email);
        
        return { status: 201, data: newUser };
    } catch (error) {
        console.error("Registration error:", error);
        return { status: 500, data: { message: 'An error occurred during registration' } };
    }
}

/**
 * Gère la connexion de l'utilisateur avec gestion du 2FA et de la vérification d'email.
 */
export async function loginUser(data: any): Promise<AuthResponse> {
    const u = await getTranslations("Users");
    const s = await getTranslations("System");

    const result = LoginSchema(u).safeParse(data);
    if (!result.success) {
        return { status: 400, data: result.error.errors };
    }
    const { email, password, code } = result.data;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: email }, { username: email }],
                AND: [{ deleted_at: null }],
            }
        });

        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return { status: 401, data: { message: u('invalidcredentials') || 'Invalid credentials' } };
        }

        if (user.email_verified === null) {
            // Email non vérifié, renvoyer un flag pour la redirection
            return { status: 403, data: { message: u('emailnotverified') || 'You must verify your email', emailNotVerified: true } };
        }

        // --- Logique 2FA ---
        if (user.is_two_factor_enabled && user.email) {
            if (!code) {
                // Étape 1: 2FA requis, envoi du code et demande de confirmation
                const tokenResponse = await generateVerificationToken(user.email);
                await send2FACode({ email: user.email, code: tokenResponse.data.token });
                return { status: 202, data: { twoFactorConfermation: true, message: s('2fa_code_sent') } }; // 202 Accepted
            } else {
                // Étape 2: Vérification du code 2FA
                const token = await getVerificationTokenByEmail(user.email);
                
                if (token.status !== 200 || !token.data || token.data.token !== code || new Date(token.data.expiredAt) < new Date()) {
                    return { status: 401, data: { message: s('invalid_or_expired_code') || 'Invalid or expired code' } };
                }
                
                await deleteVerificationTokenByEmail(user.email);
                await createTowFactorConfermation(user.id); 
            }
        }

        // --- Connexion finale ---
        await signIn("credentials", { email: user.email, password, redirect: false });
        return { status: 200, data: user };

    } catch (error) {
        console.error("Login error:", error);
        // Gestion des erreurs de NextAuth ou autres erreurs inattendues
        return { status: 500, data: { message: 'An unexpected error occurred during login' } };
    }
}

/**
 * Confirme l'inscription en vérifiant le code envoyé par email.
 */
export async function confermationRegister(data: any, email: string): Promise<AuthResponse> {
    const result = ConfirmationSchema.safeParse(data);

    if (!result.success) {
        return { status: 400, data: result.error.errors };
    }
    const { code } = result.data;

    try {
        const user = await prisma.user.findFirst({
            where: { email, deleted_at: null }
        });

        if (!user) {
            return { status: 404, data: { message: 'User not found' } };
        }

        const token = await getVerificationTokenByEmail(email);
        if (token.status !== 200 || !token.data || token.data.token !== code || new Date(token.data.expiredAt) < new Date()) {
            return { status: 400, data: { message: 'Invalid or expired code' } };
        }
        
        await deleteVerificationTokenByEmail(email);
        await prisma.user.update({
            where: { id: user.id },
            data: { email_verified: new Date() }
        });

        return { status: 200, data: { message: 'Email confirmed successfully' } };

    } catch (error) {
        console.error("Confirmation error:", error);
        return { status: 500, data: { message: 'An error occurred during confirmation' } };
    }
}

// ----------------------------------------------------------------------
// Fonctions de Code de Vérification
// ----------------------------------------------------------------------

/**
 * Envoie un code de vérification pour la confirmation d'email ou autre usage non 2FA.
 */
export const SendVerificationCode = async (email: string): Promise<AuthResponse> => {
    const s = await getTranslations('System');
    
    try {
        const tokenExisting = await getVerificationTokenByEmail(email);
        // Si un token existe et a été créé il y a moins d'une minute, empêcher le renvoi
        if (tokenExisting.status === 200 && tokenExisting.data) {
            const oneMinuteAgo = new Date(Date.now() - 1000 * 60); 
            if (new Date(tokenExisting.data.createdAt) > oneMinuteAgo) {
                return { status: 429, data: { message: s("mustwait1minutes") } }; // 429 Too Many Requests
            }
            await deleteVerificationTokenByEmail(email);
        }

        // Création d'un nouveau token (expiration par défaut, e.g., 1 heure)
        const token = await generateVerificationToken(email, 1); 
        await sendCode({ email, code: token.data.token });
        return { status: 200, data: { message: 'Code sent successfully' } };
    } catch (error) {
        console.error("Error sending verification code:", error);
        return { status: 500, data: { message: 'An error occurred while sending the code' } };
    }
};

/**
 * Envoie un code de vérification pour l'authentification à deux facteurs (2FA).
 */
export const SendVerificationCode2FA = async (email: string): Promise<AuthResponse> => {
    const s = await getTranslations('System');
    
    try {
        const tokenExisting = await getVerificationTokenByEmail(email);
        // Si un token existe et a été créé il y a moins d'une minute, empêcher le renvoi
        if (tokenExisting.status === 200 && tokenExisting.data) {
            const oneMinuteAgo = new Date(Date.now() - 1000 * 60);
            if (new Date(tokenExisting.data.createdAt) > oneMinuteAgo) {
                return { status: 429, data: { message: s("mustwait1minutes") } };
            }
             await deleteVerificationTokenByEmail(email);
        }
        
        // Création d'un nouveau token (expiration plus courte pour 2FA)
        const token = await generateVerificationToken(email, 1); // Utilisation de '1' heure comme exemple
        await send2FACode({ email, code: token.data.token });
        return { status: 200, data: { message: 'Code sent successfully' } };
    } catch (error) {
        console.error("Error sending 2FA code:", error);
        return { status: 500, data: { message: 'An error occurred while sending the 2FA code' } };
    }
};

// ----------------------------------------------------------------------
// Fonction de Déconnexion
// ----------------------------------------------------------------------

/**
 * Gère la déconnexion de l'utilisateur et met à jour l'état de la session dans la BDD.
 */
export async function logoutUser(): Promise<AuthResponse> {
    try {
        const session = await verifySession(); // Fonction pour vérifier la session actuelle
        
        if (session.status === 200 && session.data && session.data.session && session.data.session.id) {
            await prisma.session.update({
                where: { id: session.data.session.id },
                data: { active: false }
            });
        }
        
        await signOut({ redirect: false });
        return { status: 200, data: { message: 'Logout successful' } };
    } catch (error) {
        console.error("An error occurred in logout:", error);
        return { status: 500, data: { message: 'An error occurred during logout' } };
    }
}