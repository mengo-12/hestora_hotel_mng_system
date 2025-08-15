import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب بيانات الحجز
export async function GET(req, { params }) {
    try {
        const { id } = params;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                guest: true,
                room: true,
            },
        });

        if (!booking) {
            return new Response(JSON.stringify({ error: 'الحجز غير موجود' }), { status: 404 });
        }

        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// تعديل بيانات الحجز
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const data = await req.json();

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                guestId: data.guestId,
                roomId: data.roomId,
                checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
                checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
                status: data.status,
                totalPrice: data.totalPrice,
                notes: data.notes,
            },
        });

        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// حذف الحجز
export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        await prisma.booking.delete({ where: { id } });
        return new Response(JSON.stringify({ message: 'تم حذف الحجز' }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
