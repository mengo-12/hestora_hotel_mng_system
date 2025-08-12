import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { bookingId } = params;
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { guest: true, room: true, createdBy: true, invoice: true },
    });

    if (!booking) return new Response(JSON.stringify({ error: "الحجز غير موجود" }), { status: 404 });

    return new Response(JSON.stringify(booking), { status: 200 });
}

export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { bookingId } = params;
    const data = await req.json();

    try {
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                guestId: data.guestId,
                roomId: data.roomId,
                checkInDate: new Date(data.checkInDate),
                checkOutDate: new Date(data.checkOutDate),
                status: data.status,
                paymentStatus: data.paymentStatus,
            },
        });
        return new Response(JSON.stringify(updatedBooking), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في تحديث الحجز" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { bookingId } = params;

    try {
        await prisma.booking.delete({ where: { id: bookingId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في حذف الحجز" }), { status: 500 });
    }
}
