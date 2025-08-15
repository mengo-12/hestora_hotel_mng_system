// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export async function GET(req) {
//     try {
//         const bookings = await prisma.booking.findMany({
//             include: {
//                 guest: true,
//                 room: true,
//             },
//             orderBy: { createdAt: 'desc' },
//         });
//         return new Response(JSON.stringify(bookings), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// export async function POST(req) {
//     try {
//         const data = await req.json();

//         // تحقق من الحقول المطلوبة
//         if (!data.guestId || !data.roomId || !data.checkIn || !data.checkOut) {
//             return new Response(JSON.stringify({ error: 'يرجى تعبئة جميع الحقول المطلوبة' }), { status: 400 });
//         }

//         // تحقق من توفر الغرفة
//         const conflict = await prisma.booking.findFirst({
//             where: {
//                 roomId: data.roomId,
//                 OR: [
//                     {
//                         checkIn: { lte: new Date(data.checkOut) },
//                         checkOut: { gte: new Date(data.checkIn) },
//                     },
//                 ],
//                 status: { not: 'CANCELLED' },
//             },
//         });

//         if (conflict) {
//             return new Response(JSON.stringify({ error: 'الغرفة محجوزة في هذه الفترة' }), { status: 400 });
//         }

//         const booking = await prisma.booking.create({
//             data: {
//                 guestId: data.guestId,
//                 roomId: data.roomId,
//                 checkIn: new Date(data.checkIn),
//                 checkOut: new Date(data.checkOut),
//                 status: data.status || 'PENDING',
//                 totalPrice: data.totalPrice || 0,
//                 notes: data.notes || '',
//             },
//             include: {
//                 guest: true,
//                 room: true,
//             },
//         });

//         return new Response(JSON.stringify(booking), { status: 201 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                guest: true,
                room: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return new Response(JSON.stringify(bookings), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function POST(req) {
    try {
        const data = await req.json();

        // تحقق من الحقول المطلوبة
        if (!data.guestId || !data.roomId || !data.checkIn || !data.checkOut) {
            return new Response(JSON.stringify({ error: 'يرجى تعبئة جميع الحقول المطلوبة' }), { status: 400 });
        }

        // تحقق من توفر الغرفة
        const conflict = await prisma.booking.findFirst({
            where: {
                roomId: data.roomId,
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
            return new Response(JSON.stringify({ error: 'الغرفة محجوزة في هذه الفترة' }), { status: 400 });
        }

        // إنشاء الحجز
        const booking = await prisma.booking.create({
            data: {
                guestId: data.guestId,
                roomId: data.roomId,
                checkIn: new Date(data.checkIn),
                checkOut: new Date(data.checkOut),
                status: data.status || 'CONFIRMED',
                totalPrice: data.totalPrice || 0,
                notes: data.notes || '',
            },
            include: {
                guest: true,
                room: true,
            },
        });

        // تحديث حالة الغرفة إلى مشغولة
        await prisma.room.update({
            where: { id: data.roomId },
            data: { status: 'OCCUPIED' },
        });

        return new Response(JSON.stringify(booking), { status: 201 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// إضافة PATCH لتحديث الحجز (تغيير حالة الغرفة عند الخروج)
export async function PATCH(req, { params }) {
    try {
        const data = await req.json();
        const bookingId = params.id;

        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: data.status || 'CHECKED_OUT',
            },
        });

        // إذا تم تسجيل الخروج، تغيير حالة الغرفة إلى MAINTENANCE
        if (booking.status === 'CHECKED_OUT') {
            await prisma.room.update({
                where: { id: booking.roomId },
                data: { status: 'MAINTENANCE' },
            });
        }

        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
