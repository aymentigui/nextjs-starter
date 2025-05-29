import { withAuthorizationPermission, verifySession } from "@/actions/permissions";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { deleteFile } from "@/actions/localstorage/delete";

export async function GET(request: Request, { params }: { params: any }) {

    const paramsID = await params
    const url = new URL(request.url);
    const allFile = url.searchParams.get("allFile");

    const f = await getTranslations('Files');
    const e = await getTranslations('Error');

    const fileexists = await prisma.files.findFirst({ where: { id: paramsID.id } });

    if (!fileexists) {
        return NextResponse.json(fileexists);
    }

    if (fileexists?.can_view_users || fileexists?.admin_view_only || fileexists?.can_view_permissions) {
        const session = await verifySession();
        let havePermission = false
        if (session.status !== 200 || !session.data || !session.data.user) {
            return NextResponse.json({ message: e("unauthorized") }, { status: 401 });
        }
        if(session.data.user.is_admin === true) {
            havePermission = true
        }
        if (fileexists.admin_view_only) {
            if (session.data.user.is_admin === false && fileexists.admin_view_only !== session.data.user.id) {
                return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
            } else {
                havePermission = true
            }
        }
        if (fileexists.can_view_users && !havePermission) {
            const users = fileexists.can_view_users.split(',')
            if (!users.includes(session.data.user.id)) {
                return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
            } else {
                havePermission = true
            }
        }
        if (fileexists.can_view_permissions && !havePermission) {
            const permissions = fileexists.can_view_permissions.split(',')
            const hasPermission = await withAuthorizationPermission(permissions, session.data.user.id);
            if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
                return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
            }
        }
    }

    if (allFile === "true") {
        try {
            // Définition du chemin du fichier
            const filePath = path.join(process.cwd(), fileexists.path);

            // Vérifier si le fichier existe
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: "File not found in storage" }, { status: 200 });
            }

            // Création du stream de lecture
            const fileStream = fs.createReadStream(filePath);

            // Adapter ReadStream en ReadableStream
            const readableStream = new ReadableStream({
                start(controller) {
                    fileStream.on("data", (chunk) => controller.enqueue(chunk));
                    fileStream.on("end", () => controller.close());
                    fileStream.on("error", (err) => controller.error(err));
                },
            });


            // Retourner la réponse avec le stream
            return new Response(readableStream, {
                headers: {
                    "Content-Type": fileexists.mime_type,
                    "X-File-Metadata": JSON.stringify(fileexists),
                },
            });
        } catch (error) {
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }

    return NextResponse.json({ data: fileexists }, { status: 200 });
}



export async function DELETE(request: Request, { params }: { params: any }) {

    const paramsID = await params
    const f = await getTranslations('Files');

    const fileexist = await prisma.files.findFirst({ where: { id: paramsID.id } });

    if (!fileexist) {
        return NextResponse.json({ message: f("filedoesnotexist") }, { status: 404 });
    }

    const session = await verifySession();
    let havePermission = false
    if (session.status !== 200 || !session.data || !session.data.user) {
        return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
    }
    if(session.data.user.is_admin === true) {
        havePermission = true
    }
    if (!havePermission && fileexist.admin_delete_only && fileexist.added_from !== session.data.user.id) {
        if (session.data.user.is_admin === false) {
            return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
        } else {
            havePermission = true
        }
    }
    if (fileexist.can_delete_users && !havePermission) {
        const users = fileexist.can_delete_users.split(',')
        if (!users.includes(session.data.user.id) && fileexist.added_from !== session.data.user.id) {
            return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
        } else {
            havePermission = true
        }
    }
    if (fileexist.can_delete_permissions && !havePermission) {
        const permissions = fileexist.can_delete_permissions.split(',')
        const hasPermission = await withAuthorizationPermission(permissions, session.data.user.id);
        if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
            return NextResponse.json({ message: f("unauthorized") }, { status: 401 });
        }
    }

    const deletedFile = await prisma.files.delete({ where: { id: paramsID.id } });
    deleteFile(paramsID.id);

    return NextResponse.json({ data: deletedFile }, { status: 200 });

}
