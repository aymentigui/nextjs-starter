"use server"
import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { deleteVerificationTokenByEmail, generateVerificationToken, getVerificationTokenByEmail } from './verification-token';
import { send2FACode, sendCode, sendEmail } from '../email';
import { createTowFactorConfermation } from './tow-factor-confermation';
import { getTranslations } from 'next-intl/server';
import { verifySession } from '../permissions';



export async function registerUser(data: any): Promise<{ status: number, data: any }> {
    const u = await getTranslations('Users');
    const registerSchema = z.object({
        firstname: z
            .string({ required_error: u("firstnamerequired") }),
        lastname: z
            .string({ required_error: u("lastnamerequired") }),
        username: z
            .string({ required_error: u("usernamerequired") })
            .min(3, { message: u("username6") })
            .max(20, { message: u("username20") }),
        email: z.string({ required_error: u("emailrequired") }).email({ message: u("emailinvalid") }),
        password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
        passwordConfirm: z.string({ required_error: u("confirmpasswordrequired") }).min(6, { message: u("password6") }),
    }).refine((data) => data.password === data.passwordConfirm, {
        path: ["passwordConfirm"],
        message: u("confirmpasswordnotmatch"),
    });

    const result = registerSchema.safeParse(data);

    if (!result.success) {
        //console.log(result.error.errors);
        return { status: 400, data: result.error.errors };
    }
    const { username, email, password, firstname, lastname } = result.data;


    try {
        const existingUserByUsername = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUserByUsername) {
            //console.log('Username already exists');
            return { status: 400, data: { message: 'Username already exists' } };
        }

        const existingUserByEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUserByEmail) {
            //console.log('Email already exists');
            return { status: 400, data: { message: 'Email already exists' } };
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                firstname,
                lastname,
                username,
                email,
                password: passwordHash, // Note: In a real application, make sure to hash the password before storing it
            },
        });
        //console.log('User created successfully');
        return { status: 201, data: newUser };
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            return { status: 500, data: { message: error.message } };
        }
        console.error("An error occurred");
        return { status: 500, data: { message: 'An error occurred' } };
    }
}

export async function loginUser(data: any): Promise<{ status: number, data: any,  }> {

    const u = await getTranslations("Users")

    const LoginSchema = z.object({
        email: z.string({ required_error: u("emailrequired") }).email({ message: u("emailinvalid") }),
        password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
        code: z.string().optional(),
    });

    const result = LoginSchema.safeParse(data);

    if (!result.success) {
        return { status: 400, data: result.error.errors };
    }
    const { email, password, code } = result.data;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }
                ],
                AND: [
                    { deleted_at: null },
                ]
            }
        })

        if (!user) {
            return { status: 400, data: { message: 'User not found' } };
        }

        if (!user.password) {
            return { status: 400, data: { message: 'You must connect with your provider' } };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { status: 400, data: { message: 'Invalid password' } };
        }

        if(user.email_verified===null){
            return { status: 400, data: { message: 'You must verify your email', emailNotVerified: true } };
        }

        if (user.is_two_factor_enabled && user.email) {
            if (!code) {
                const token = await generateVerificationToken(user.email);
                send2FACode({ email: user.email, code: token.data.token });
                return { status: 200, data: { twoFactorConfermation: true } };
            } else {
                const token = await getVerificationTokenByEmail(user.email);
                if (token.status !== 200 || !token.data) {
                    return { status: 400, data: { message: 'Invalid code' } };
                }
                if (token.data.token !== code) {
                    return { status: 400, data: { message: 'Invalid code' } };
                }
                const expired = new Date(token.data.expiredAt) < new Date();
                if (expired) {
                    return { status: 400, data: { message: 'Code expired' } };
                }
                await deleteVerificationTokenByEmail(user.email);
                createTowFactorConfermation(user.id);
            }
        }

        try {
            await signIn("credentials", { email, password, redirect: false });
            return { status: 200, data: user };
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
                return { status: 500, data: { message: error.message } };
            }
            console.error(error);
            return { status: 500, data: { message: 'An error occurred' } };
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            return { status: 500, data: { message: 'An error occurred' } };
        }
        console.error("An error occurred");
        return { status: 500, data: { message: 'An error occurred' } };
    }
}

export async function confermationRegister(data: any, email: string): Promise<{ status: number, data: any }> {

    const u = await getTranslations("Users")

    const schema = z.object({
        code: z.string(),
    });

    const result = schema.safeParse(data);

    if (!result.success) {
        return { status: 400, data: result.error.errors };
    }
    const { code } = result.data;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                ],
                AND: [
                    { deleted_at: null },
                ]
            }
        })

        if (!user) {
            return { status: 400, data: { message: 'User not found' } };
        }

        const token = await getVerificationTokenByEmail(email);
        if (token.status !== 200 || !token.data) {
            return { status: 400, data: { message: 'Invalid code' } };
        }
        if (token.data.token !== code) {
            return { status: 400, data: { message: 'Invalid code' } };
        }
        const expired = new Date(token.data.expiredAt) < new Date();
        if (expired) {
            return { status: 400, data: { message: 'Code expired' } };
        }
        await deleteVerificationTokenByEmail(email);
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                email_verified: new Date()
            }
        })

        return { status: 200, data: { message: 'Email confirmed successfully' } };

    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            return { status: 500, data: { message: 'An error occurred' } };
        }
        console.error("An error occurred");
        return { status: 500, data: { message: 'An error occurred' } };
    }
}

export const SendVerificationCode = async (email: string)=> {
    const s= await getTranslations('System');
    const tokenExisting = await getVerificationTokenByEmail(email);

    if(tokenExisting.status===200 && tokenExisting.data && new Date(tokenExisting.data.expiredAt) < new Date()){  
        await prisma.verificationtoken.delete({
            where : {
                id: tokenExisting.data.id
            }
        })
    }else if(tokenExisting.status===200 && tokenExisting.data && new Date(tokenExisting.data.expiredAt) > new Date()) {
        return { status: 500, data: { message: s("mustwait1minutes") } };
    }
    const token = await generateVerificationToken(email,1);
    sendCode({ email, code: token.data.token });
    // sendEmail(email, 'Confirmation code', 'Your confirmation code is ' + token.data.token);
    return { status: 200, data: { message: 'Code sent successfully' } };
}

export const SendVerificationCode2FA = async (email: string)=> {
    const s= await getTranslations('System');
    const tokenExisting = await getVerificationTokenByEmail(email);

    if(tokenExisting.status===200 && tokenExisting.data && new Date(tokenExisting.data.expiredAt-1000*60*59) < new Date()){  
        await prisma.verificationtoken.delete({
            where : {
                id: tokenExisting.data.id
            }
        })
    }else if(tokenExisting.status===200 && tokenExisting.data && new Date(tokenExisting.data.expiredAt-1000*60*59) > new Date()) {
        return { status: 500, data: { message: s("mustwait1minutes") } };
    }
    const token = await generateVerificationToken(email,1);
    sendCode({ email, code: token.data.token });
    // sendEmail(email, 'Confirmation code', 'Your confirmation code is ' + token.data.token);
    return { status: 200, data: { message: 'Code sent successfully' } };
}


export async function logoutUser() {
    try {
        const session = await verifySession();
        if (session.status !== 200) {
            await signOut({ redirect: false });
            return { status: 200, data: { message: 'Logout successful' } };
        }

        if (session.data && session.data.session && session.data.session.id)
            await prisma.session.update({
                where: {
                    id: session.data.session.id
                },
                data: {
                    active: false
                }
            })
        await signOut({ redirect: false });
        return { status: 200, data: { message: 'Logout successful' } };
    } catch (error) { // @ts-ignore
        //"An error occurred in logout", error.message);
        return { status: 500, data: { message: 'An error occurred in logout' } };
    }
}

