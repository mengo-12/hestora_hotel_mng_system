import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "HOUSEKEEPING"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { roomId } = params;
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) return new Response(JSON.stringify({ error: "الغرفة غير موجودة" }), { status: 404 });

    return new Response(JSON.stringify(room), { status: 200 });
}

export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "HOUSEKEEPING"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { roomId } = params;
    const data = await req.json();

    try {
        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: {
                roomNumber: data.roomNumber,
                floor: data.floor,
                type: data.type,
                status: data.status,
                pricePerNight: data.pricePerNight,
            },
        });
        return new Response(JSON.stringify(updatedRoom), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في تحديث الغرفة" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "HOUSEKEEPING"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { roomId } = params;

    try {
        await prisma.room.delete({ where: { id: roomId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في حذف الغرفة" }), { status: 500 });
    }
}
