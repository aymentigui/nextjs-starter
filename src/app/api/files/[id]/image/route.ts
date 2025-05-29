import { withAuthorizationPermission, verifySession } from "@/actions/permissions";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request, { params }: { params: any }) {

    const paramsID = await params

    const e = await getTranslations('Error');

    const fileexists = await prisma.files.findFirst({ where: { id: paramsID.id } });

    if (!fileexists) {
        const filePath = path.join(process.cwd(), '/public/not_found.png');
        const fileStream = fs.createReadStream(filePath);

        const readableStream = new ReadableStream({
            start(controller) {
                fileStream.on("data", (chunk) => controller.enqueue(chunk));
                fileStream.on("end", () => controller.close());
                fileStream.on("error", (err) => controller.error(err));
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "image/png",
                "X-File-Metadata": JSON.stringify(fileexists),
            },
        });
    }

    if (fileexists?.can_view_users || fileexists?.admin_view_only || fileexists?.can_view_permissions) {
        const session = await verifySession();
        let havePermission = false
        if (session.status !== 200 || !session.data || !session.data.user) {
            const filePath = path.join(process.cwd(), '/public/no_access.png');
            const fileStream = fs.createReadStream(filePath);
            const readableStream = new ReadableStream({
                start(controller) {
                    fileStream.on("data", (chunk) => controller.enqueue(chunk));
                    fileStream.on("end", () => controller.close());
                    fileStream.on("error", (err) => controller.error(err));
                },
            });

            return new Response(readableStream, {
                headers: {
                    "Content-Type": "image/png",
                    "X-File-Metadata": JSON.stringify(fileexists),
                },
            });
        }
        if (session.data.user.is_admin === true) {
            havePermission = true
        }
        if (fileexists.admin_view_only) {
            if (session.data.user.is_admin === false && fileexists.added_from !== session.data.user.id) {

                const filePath = path.join(process.cwd(), '/public/no_access.png');
                const fileStream = fs.createReadStream(filePath);
                const readableStream = new ReadableStream({
                    start(controller) {
                        fileStream.on("data", (chunk) => controller.enqueue(chunk));
                        fileStream.on("end", () => controller.close());
                        fileStream.on("error", (err) => controller.error(err));
                    },
                });

                return new Response(readableStream, {
                    headers: {
                        "Content-Type": "image/png",
                        "X-File-Metadata": JSON.stringify(fileexists),
                    },
                });
            } else {
                havePermission = true
            }
        }
        if (fileexists.can_view_users && !havePermission) {
            const users = fileexists.can_view_users.split(',')
            if (!users.includes(session.data.user.id)) {
                const filePath = path.join(process.cwd(), '/public/no_access.png');
                const fileStream = fs.createReadStream(filePath);

                const readableStream = new ReadableStream({
                    start(controller) {
                        fileStream.on("data", (chunk) => controller.enqueue(chunk));
                        fileStream.on("end", () => controller.close());
                        fileStream.on("error", (err) => controller.error(err));
                    },
                });

                return new Response(readableStream, {
                    headers: {
                        "Content-Type": "image/png",
                        "X-File-Metadata": JSON.stringify(fileexists),
                    },
                });
            } else {
                havePermission = true
            }
        }
        if (fileexists.can_view_permissions && !havePermission) {
            const permissions = fileexists.can_view_permissions.split(',')
            const hasPermission = await withAuthorizationPermission(permissions, session.data.user.id);
            if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
                const filePath = path.join(process.cwd(), '/public/no_access.png');
                const fileStream = fs.createReadStream(filePath);

                const readableStream = new ReadableStream({
                    start(controller) {
                        fileStream.on("data", (chunk) => controller.enqueue(chunk));
                        fileStream.on("end", () => controller.close());
                        fileStream.on("error", (err) => controller.error(err));
                    },
                });

                return new Response(readableStream, {
                    headers: {
                        "Content-Type": "image/png",
                        "X-File-Metadata": JSON.stringify(fileexists),
                    },
                });
            }
        }
    }

    const filePath = path.join(process.cwd(), fileexists.path);

    if (!fs.existsSync(filePath)) {
        const filePath = path.join(process.cwd(), '/public/not_found.jpg');
        const fileStream = fs.createReadStream(filePath);

        const readableStream = new ReadableStream({
            start(controller) {
                fileStream.on("data", (chunk) => controller.enqueue(chunk));
                fileStream.on("end", () => controller.close());
                fileStream.on("error", (err) => controller.error(err));
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "image/png",
                "X-File-Metadata": JSON.stringify(fileexists),
            },
        });
    }

    const fileStream = fs.createReadStream(filePath);

    const readableStream = new ReadableStream({
        start(controller) {
            fileStream.on("data", (chunk) => controller.enqueue(chunk));
            fileStream.on("end", () => controller.close());
            fileStream.on("error", (err) => controller.error(err));
        },
    });

    return new Response(readableStream, {
        headers: {
            "Content-Type": fileexists.mime_type,
            "X-File-Metadata": JSON.stringify(fileexists),
        },
    });

}



