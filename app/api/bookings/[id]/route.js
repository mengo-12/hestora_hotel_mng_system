// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // جلب بيانات الحجز
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
//         const bookingId = params.id; // استخدم params مباشرة
//         const data = await req.json();

//         // جلب سعر الغرفة
//         const room = await prisma.room.findUnique({ where: { id: data.roomId } });
//         const basePrice = room ? Number(room.pricePerNight) || 0 : 0;
//         const discountPct = parseFloat(data.discountPercent) || 0;
//         const taxPct = parseFloat(data.taxPercent) || 0;

//         const checkInDate = new Date(data.checkIn);
//         const checkOutDate = new Date(data.checkOut);
//         const nights = Math.max(Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)), 0);

//         let totalPrice = 0;
//         for (let i = 0; i < nights; i++) {
//             const discount = (basePrice * discountPct) / 100;
//             const tax = ((basePrice - discount) * taxPct) / 100;
//             const net = basePrice - discount + tax;
//             totalPrice += net;
//         }

//         const updatedBooking = await prisma.booking.update({
//             where: { id: bookingId },
//             data: {
//                 guestId: data.guestId,
//                 roomId: data.roomId,
//                 checkIn: checkInDate,
//                 checkOut: checkOutDate,
//                 adults: data.adults,
//                 children: data.children,
//                 extraBeds: data.extraBeds,
//                 status: data.status,
//                 paymentStatus: data.paymentStatus,
//                 source: data.source || '',
//                 notes: data.notes || '',
//                 discountPercent: discountPct,
//                 taxPercent: taxPct,
//                 totalPrice: Number(totalPrice.toFixed(2)),
//             },
//             include: { guest: true, room: true },
//         });

//         // تحديث حالة الغرفة عند تسجيل الخروج
//         if (updatedBooking.status === "CHECKED_OUT") {
//             await prisma.room.update({
//                 where: { id: updatedBooking.roomId },
//                 data: { status: "MAINTENANCE" },
//             });
//         }

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

        // حساب السعر النهائي إذا أرسل frontend totalPrice
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

        return new Response(JSON.stringify(updatedBooking), { status: 200 });
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

