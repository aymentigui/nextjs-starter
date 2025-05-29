"use server"
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import { verifySession } from "../permissions";
import { getTranslations } from "next-intl/server";
import { deleteFile } from "../superbase/delete";
import { addStringToFilename, addStringToFilenameWithNewExtension } from "../util/util-public";
import { compressImage } from "../util/util";
import { uploadFile } from "../superbase/upload";

export async function updateEmail(email: string): Promise<{ status: number, data: { message: string } }> {
    const EmailSchema = z.string().email({ message: "Adresse e-mail invalide" });
    const e = await getTranslations('Error');
    const u = await getTranslations('Users');
    const s = await getTranslations('System');

    const session = await verifySession()
    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    try {
        if (!email) {
            return { status: 400, data: { message: u("emailrequired") } };
        }

        if (!EmailSchema.safeParse(email).success) {
            return { status: 400, data: { message: u("emailinvalid") } };
        }
        const userExists = await prisma.user.findUnique({
            where: { email },
        })
        if (userExists) {
            return { status: 400, data: { message: u("emailexists") } };
        }
        const user = await prisma.user.update({
            where: { id: session.data.user.id },
            data: { email },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in updateEmail");
        return { status: 500, data: { message: s("updatefail") } };
    }
}
export async function updateUsername(username: string): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const u = await getTranslations('Users');
    const s = await getTranslations('System');

    const UsernameSchema = z.string().min(6, { message: u("username6") })

    const session = await verifySession()
    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    try {
        if (!username) {
            return { status: 400, data: { message: u("usernamerequired") } };
        }

        if (!UsernameSchema.safeParse(username).success) {
            return { status: 400, data: { message: u("usernameinvalid") } };
        }
        const userExists = await prisma.user.findUnique({
            where: { username },
        })
        if (userExists) {
            return { status: 400, data: { message: u("usernameexists") } };
        }
        await prisma.user.update({
            where: { id: session.data.user.id },
            data: { username },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error(s("updatefail"));
        return { status: 500, data: { message: 'An error occurred in updateUsername' } };
    }
}

export async function updateTwoFactorConfermation(twoFactorConfermation: boolean): Promise<{ status: number, data: { message: string } }> {

    const e = await getTranslations('Error');
    const s = await getTranslations('System');

    const session = await verifySession()
    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    try {
        await prisma.user.update({
            where: { id: session.data.user.id },
            data: { is_two_factor_enabled: twoFactorConfermation },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in updateTwoFactorConfermation");
        return { status: 500, data: { message: s("updatefail") } };
    }
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ status: number, data: { message: string } }> {

    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const u = await getTranslations('Users');
    const t = await getTranslations('Settings');

    const ResetPasswordSchema = z.string().min(6, { message: u("password6") });

    const session = await verifySession()
    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    try {

        const user = await prisma.user.findUnique({
            where: { id: session.data.user.id },
        })
        if (!user) {
            return { status: 400, data: { message: e("usernotfound") } };
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return { status: 400, data: { message: u("currentpasswordinvalid") } };
        }

        if (!ResetPasswordSchema.safeParse(newPassword).success) {
            return { status: 400, data: { message: t("passwordinvalid") } };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.data.user.id },
            data: { password: hashedPassword },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in updatePassword");
        return { status: 500, data: { message: s("updatefail") } };
    }
}

export async function deleteSession(id: string) {
    const session = await verifySession()
    const e = await getTranslations('Error');
    const ss = await getTranslations('Sessions');
    const s = await getTranslations('System');

    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    const sessionExisting = await prisma.session.findFirst({
        where: {
            id: id,
            user_id: session.data.user.id
        }
    })

    if (!sessionExisting) {
        return { status: 400, data: { message: ss("sessionnotfound") } };
    }
    await prisma.session.deleteMany({
        where: {
            id: id,
            user_id: session.data.user.id
        }
    })
    return { status: 200, data: { message: s("deletesuccess") } };
}

export async function deleteAllSessions() {
    const session = await verifySession()
    const s = await getTranslations('System');
    const e = await getTranslations('Error');
    const ss = await getTranslations('Sessions');

    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    const sessionExisting = await prisma.session.findFirst({
        where: {
            user_id: session.data.user.id
        }
    })

    if (!sessionExisting) {
        return { status: 400, data: { message: ss("sessionnotfound") } };
    }
    await prisma.session.deleteMany({
        where: {
            user_id: session.data.user.id
        }
    })

    return { status: 200, data: { message: s("deletesuccess") } };
}

export async function updateImage(image: File): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const u = await getTranslations('Users');

    const ImageScema = z.object({
        image: z
            .instanceof(File, { message: u("avatarinvalid") })
            .optional()
            .refine((file) => !file || file.type.startsWith("image/"), {
                message: u("onlyimagesallowed"),
            }),
    })

    const session = await verifySession()
    if (!session || session.status != 200) {
        return { status: 401, data: { message: e("unauthorized") } };
    }

    try {
        if (!image) {
            return { status: 400, data: { message: u("imagerequired") } };
        }

        if (!ImageScema.safeParse(image).success) {
            return { status: 400, data: { message: u("onlyimagesallowed") } };
        }
        const userExists = await prisma.user.findUnique({
            where: { id: session.data.user.id },
        })

        if (userExists?.image) {
            const success1 = await deleteFile(userExists.image)
            if (success1.status != 200) return { status: 500, data: { message: e("error") } };
            const success2 = await deleteFile(addStringToFilenameWithNewExtension(userExists.image, "compressed", "jpg"))
            if (success2.status != 200) return { status: 500, data: { message: e("error") } };
        }

        if (image?.size > 1000000) {
            return { status: 400, data: { message: u("avatarinvalid") } };
        }

        const arrayBuffer = await image.arrayBuffer();

        // Appeler la Server Action pour compresser l'image
        const result = await compressImage(arrayBuffer, 0.1);
        if (result === null) return { status: 500, data: { message: e("error") } };


        const imageUrl = await uploadFile(image, `${userExists?.id}`, "profile-images")

        const imageCompressedUrl = await uploadFile(result, `${addStringToFilename(session.data.user.id, "compressed")}`, "profile-images")

        if (imageUrl.status != 200 || !imageUrl.data.path) return { status: 500, data: { message: e("error") } };
        if (imageCompressedUrl.status != 200 || !imageCompressedUrl.data.path) return { status: 500, data: { message: e("error") } };

        await prisma.user.update({
            where: { id: userExists?.id },
            data: {
                image: imageUrl.data.path,
            }
        })


        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error(s("updatefail"));
        return { status: 500, data: { message: 'An error occurred in updateUsername' } };
    }
}
