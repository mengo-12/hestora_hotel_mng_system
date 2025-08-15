// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // جلب بيانات حجز محدد
// export async function GET(req, { params }) {
//     try {
//         const { id } = params;

//         const booking = await prisma.booking.findUnique({
//             where: { id },
//             include: {
//                 guest: true,
//                 room: true,
//             },
//         });

//         if (!booking) {
//             return new Response(JSON.stringify({ error: 'الحجز غير موجود' }), { status: 404 });
//         }

//         return new Response(JSON.stringify(booking), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // تعديل بيانات الحجز
// export async function PUT(req, { params }) {
//     try {
//         const { id } = params;
//         const data = await req.json();

//         // حساب السعر النهائي إذا أرسل frontend totalPrice
//         const updatedBooking = await prisma.booking.update({
//             where: { id },
//             data: {
//                 guestId: data.guestId,
//                 roomId: data.roomId,
//                 checkIn: new Date(data.checkIn),
//                 checkOut: new Date(data.checkOut),
//                 status: data.status,
//                 totalPrice: data.totalPrice || 0,
//                 notes: data.notes || '',
//             },
//             include: { guest: true, room: true },
//         });

//         return new Response(JSON.stringify(updatedBooking), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // حذف الحجز
// export async function DELETE(req, { params }) {
//     try {
//         const { id } = params;
//         await prisma.booking.delete({ where: { id } });
//         return new Response(JSON.stringify({ message: 'تم حذف الحجز' }), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب بيانات حجز محدد
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
        if (data.status === 'CHECKED_OUT') {
            await prisma.room.update({
                where: { id: data.roomId },
                data: { status: 'MAINTENANCE' },
            });
        } else if (data.status === 'CONFIRMED' || data.status === 'ONGOING') {
            await prisma.room.update({
                where: { id: data.roomId },
                data: { status: 'OCCUPIED' },
            });
        } else if (data.status === 'CANCELLED') {
            await prisma.room.update({
                where: { id: data.roomId },
                data: { status: 'AVAILABLE' },
            });
        }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// حذف الحجز
export async function DELETE(req, { params }) {
    try {
        const { id } = params;

        // جلب بيانات الحجز قبل الحذف لتحديث حالة الغرفة
        const booking = await prisma.booking.findUnique({ where: { id } });

        await prisma.booking.delete({ where: { id } });

        // عند الحذف، إذا كانت الغرفة مشغولة → اجعلها متاحة
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
