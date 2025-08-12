// app/api/bookings/route.js
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const bookings = await prisma.booking.findMany({
            include: { guest: true, room: true, createdBy: true },
        });
        return new Response(JSON.stringify(bookings), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "فشل في جلب الحجوزات" }), { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
        }

        const data = await req.json();

        const booking = await prisma.booking.create({
            data: {
                guest: { connect: { id: data.guestId } },
                room: { connect: { id: data.roomId } },
                createdBy: { connect: { id: session.user.id } },
                checkInDate: new Date(data.checkInDate),
                checkOutDate: new Date(data.checkOutDate),
                status: "PENDING",
                paymentStatus: "UNPAID",
            },
            include: { guest: true, room: true, createdBy: true },
        });

        return new Response(JSON.stringify(booking), { status: 201 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "فشل في إنشاء الحجز" }), { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
        }

        const data = await req.json();

        const booking = await prisma.booking.update({
            where: { id: data.id },
            data: {
                guest: data.guestId ? { connect: { id: data.guestId } } : undefined,
                room: data.roomId ? { connect: { id: data.roomId } } : undefined,
                checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
                checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
                status: data.status || undefined,
                paymentStatus: data.paymentStatus || undefined,
            },
            include: { guest: true, room: true, createdBy: true },
        });

        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "فشل في تحديث الحجز" }), { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
        }

        const { id } = await req.json();

        await prisma.booking.delete({ where: { id } });

        return new Response(JSON.stringify({ message: "تم حذف الحجز بنجاح" }), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "فشل في حذف الحجز" }), { status: 500 });
    }
}
