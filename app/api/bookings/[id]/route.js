import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب بيانات حجز محدد
export async function GET(req, context) {
    try {
        const { params } = context;
        const id = params.id;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                guest: true,
                room: true,
                extras: { include: { extraService: true } },
            },
        });

        if (!booking) {
            return new Response(JSON.stringify({ error: 'الحجز غير موجود' }), { status: 404 });
        }

        const bookingWithRoomStatus = {
            ...booking,
            roomStatus: booking.room?.status || 'AVAILABLE',
        };

        return new Response(JSON.stringify(bookingWithRoomStatus), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const { params } = context;
        const id = params.id;
        const data = await req.json();

        // التحقق من التعارض مع حجوزات أخرى لنفس الغرفة
        const conflict = await prisma.booking.findFirst({
            where: {
                roomId: data.roomId,
                id: { not: id },
                OR: [
                    {
                        checkIn: { lte: new Date(data.checkOut) },
                        checkOut: { gte: new Date(data.checkIn) },
                    },
                ],
                status: { not: 'CANCELLED' },
            },
        });

        if (conflict) {
            return new Response(JSON.stringify({ error: '⚠️ الغرفة محجوزة بالفعل في هذه الفترة' }), { status: 400 });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                guestId: data.guestId,
                roomId: data.roomId,
                checkIn: new Date(data.checkIn),
                checkOut: new Date(data.checkOut),
                status: data.status,
                totalPrice: data.totalPrice || 0,
                notes: data.notes || '',
            },
            include: { guest: true, room: true },
        });

        // تحديث حالة الغرفة بناءً على حالة الحجز
        let newRoomStatus = 'AVAILABLE';
        if (data.roomStatus) newRoomStatus = data.roomStatus;
        else if (data.status === 'CHECKED_OUT') newRoomStatus = 'MAINTENANCE';
        else if (['CONFIRMED', 'ONGOING'].includes(data.status)) newRoomStatus = 'OCCUPIED';
        else if (data.status === 'CANCELLED') newRoomStatus = 'AVAILABLE';

        await prisma.room.update({
            where: { id: data.roomId },
            data: { status: newRoomStatus },
        });

        const updatedBookingWithRoomStatus = {
            ...updatedBooking,
            roomStatus: newRoomStatus,
        };

        return new Response(JSON.stringify(updatedBookingWithRoomStatus), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// حذف الحجز
export async function DELETE(req, context) {
    try {
        const { params } = context;
        const id = params.id;

        const booking = await prisma.booking.findUnique({ where: { id } });

        if (!booking) {
            return new Response(JSON.stringify({ error: 'الحجز غير موجود' }), { status: 404 });
        }

        await prisma.booking.delete({ where: { id } });

        if (booking?.roomId) {
            await prisma.room.update({
                where: { id: booking.roomId },
                data: { status: 'AVAILABLE' },
            });
        }

        return new Response(JSON.stringify({ message: 'تم حذف الحجز' }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}