import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { guestId } = params;

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });

    if (!guest) {
        return new Response(JSON.stringify({ error: "النزيل غير موجود" }), { status: 404 });
    }

    return new Response(JSON.stringify(guest), { status: 200 });
}

export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { guestId } = params;
    const data = await req.json();

    try {
        const updatedGuest = await prisma.guest.update({
            where: { id: guestId },
            data: {
                fullName: data.fullName,
                nationalId: data.nationalId || null,
                phone: data.phone,
                email: data.email || null,
                notes: data.notes || null,
            },
        });
        return new Response(JSON.stringify(updatedGuest), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في تحديث النزيل" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { guestId } = params;

    try {
        await prisma.guest.delete({ where: { id: guestId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في حذف النزيل" }), { status: 500 });
    }
}
