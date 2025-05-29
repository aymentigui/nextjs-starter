"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { uploadFile } from "./upload";
import { generateRandomFilename, getFileExtension } from "../util/util-public";

export async function updateFilePermissionsDB(
    fileId: string,
    userId: string,
    canViewUsers?: string[],
    canViewPermissions?: string[],
    adminViewOnly?: boolean,

    canDownloadUsers?: string[],
    canDownloadPermissions?: string[],
    adminDownloadOnly?: boolean,

    canDeleteUsers?: string[],
    canDeletePermissions?: string[],
    adminDeleteOnly?: boolean,

): Promise<{ status: number, data: { message?: string, file?: any } }> {

    const s = await getTranslations("System");

    try {

        await prisma.files.update({
            data: {
                can_view_users: adminViewOnly?null:canViewUsers ? canViewUsers.join(",") : null,
                can_download_users: adminDownloadOnly?null:canDownloadUsers ? canDownloadUsers.join(",") : null,
                can_delete_users: adminDeleteOnly?null:canDeleteUsers ? canDeleteUsers.join(",") : null,

                admin_delete_only: adminDeleteOnly??false,
                admin_download_only:adminDownloadOnly??false,
                admin_view_only: adminViewOnly??false,

                can_delete_permissions: adminDeleteOnly?null:canDeletePermissions ? canDeletePermissions.join(",") : null,
                can_download_permissions: adminDownloadOnly?null:canDownloadPermissions ? canDownloadPermissions.join(",") : null,
                can_view_permissions: adminViewOnly?null:canViewPermissions ? canViewPermissions.join(",") : null,
            },
            where: {
                id: fileId
            }
        })

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createUser" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}