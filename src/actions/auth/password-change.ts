"use server"
import { generateVerificationToken, getVerificationTokenByEmail, getVerificationTokenByToken } from "./verification-token";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { sendEmail } from "../email";
import { getUserByEmailOrUsername } from "../users/get";
import { getTranslations } from "next-intl/server";


export async function resetPasswordWithoutConnection(data: { email: string, password?: string, code?: string }): Promise<{ status: number, data: any }> {
    const u=await getTranslations('Users');
    const t=await getTranslations('Settings');
    const e=await getTranslations('Error');
    const s=await getTranslations('System');
    
    try {
        const { email, password, code } = data;

        if(!email) {
            return { status: 400, data: { message: t("emailorusername") } };
        }

        const user = await getUserByEmailOrUsername(email);
        if (user.status !== 200 || !user.data) {
            return { status: 400, data: { message: e("usernotfound") } };
        }

        const token = await getVerificationTokenByEmail(user.data.email);
        if (code)  {
            if (token.status !== 200 || !token.data) {
                return { status: 400, data: { message: e("invalidcode") } };
            }

            if (token.data.token !== code) {
                return { status: 400, data: { message: e("invalidcode") } };
            }
            const expiresAt= new Date(token.data.expiresAt)<new Date()
            if(expiresAt){
                return { status: 400, data: { message: e("codeexpired") } };
            }

            createResetPasswordConfermation(user.data.id)            
             
            return { status: 200, data: { codeConfirmed: true } };
        }

        if (!password) {
            return { status: 400, data: { message: u("passwordrequired") } };
        }

        const existingResetPassword=await getResetPasswordConfermation(user.data.id)
        if(existingResetPassword.status!==200 || !existingResetPassword.data){
            return { status: 400, data: { message: e("invalidcode") } };
        }
        
        const expiresAt= new Date(existingResetPassword.data.expiresAt)<new Date()
        if(expiresAt){
            return { status: 400, data: { message: e("codeexpired") } };
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.data.id },
            data: { password: passwordHash },
        });

        await deleteResetPasswordConfermation(user.data.id)
        
        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in resetPasswordWithoutConnection");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getConfirmationCodePasswordChange(emailOrUsername: string): Promise<{ status: number, data: any }> {
    const e=await getTranslations('Error');
    const s=await getTranslations('System');
    
    try {
        const user = await getUserByEmailOrUsername(emailOrUsername);
        if (user.status !== 200 || !user.data) {
            return { status: 400, data: { message: e("usernotfound") } };
        }
        const toke = await generateVerificationToken(user.data.email);
        sendEmail(user.data.email, 'Confirmation code', 'Your confirmation code is ' + toke.data.token);
        return { status: 200, data: { message: s("emailsent") } };
    } catch (error) {
        console.error("An error occurred in getConfirmationCode");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function createResetPasswordConfermation(id: string) : Promise<{ status: number, data: any }> {
    const e=await getTranslations('Error');    
    try {
        const existingResetPassword=await getResetPasswordConfermation(id)
        if(existingResetPassword){
            await deleteResetPasswordConfermation(id)
        }
        const verificationToken=await prisma.resetpasswordconfermation.create({
            data : {
                user_id: id,
                expired_at: new Date(new Date().getTime() + 1000 * 60 * 5)
            }
        })
        return { status: 200, data: verificationToken };
    } catch (error) {
        console.error("An error occurred in createResetPasswordConfermation");
        return { status: 500, data: { message: e("error") } };  
    }
}

export async function getResetPasswordConfermation(id: string) : Promise<{ status: number, data: any }> {
    const e=await getTranslations('Error');
    try {
        const verificationToken=await prisma.resetpasswordconfermation.findFirst({
            where : {
                user_id: id
            }
        })
        if(!verificationToken){
            return { status: 404, data: { message: e("invalidtoken") } };
        }
        return { status: 200, data: verificationToken };
    } catch (error) {
        console.error("An error occurred in getResetPasswordConfermation");
        return { status: 500, data: { message: e("error") } };  
    }
}

export async function deleteResetPasswordConfermation(id: string) : Promise<{ status: number, data: any }> {
    const e=await getTranslations('Error');    
    try {
        const verificationToken=await prisma.resetpasswordconfermation.deleteMany({
            where : {
                user_id: id
            }
        })
        return { status: 200, data: verificationToken };
    } catch (error) {
        console.error("An error occurred in deleteResetPasswordConfermation");
        return { status: 500, data: { message: e("error")} };  
    }
}