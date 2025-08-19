// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // جلب بيانات حجز محدد
// export async function GET(req, context) {
//     try {
//         const { params } = context;
//         const id = params.id;

//         const booking = await prisma.booking.findUnique({
//             where: { id },
//             include: {
//                 guest: true,
//                 room: true,
//                 extras: { include: { extraService: true } },
//             },
//         });

//         if (!booking) {
//             return new Response(JSON.stringify({ error: 'الحجز غير موجود' }), { status: 404 });
//         }

//         const bookingWithRoomStatus = {
//             ...booking,
//             roomStatus: booking.room?.status || 'AVAILABLE',
//         };

//         return new Response(JSON.stringify(bookingWithRoomStatus), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// export async function PUT(req, context) {
//     try {
//         const { params } = context;
//         const id = params.id;
//         const data = await req.json();

//         // التحقق من التعارض مع حجوزات أخرى لنفس الغرفة
//         const conflict = await prisma.booking.findFirst({
//             where: {
//                 roomId: data.roomId,
//                 id: { not: id },
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
//             return new Response(JSON.stringify({ error: '⚠️ الغرفة محجوزة بالفعل في هذه الفترة' }), { status: 400 });
//         }

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

//         // تحديث حالة الغرفة بناءً على حالة الحجز
//         let newRoomStatus = 'AVAILABLE';
//         if (data.roomStatus) newRoomStatus = data.roomStatus;
//         else if (data.status === 'CHECKED_OUT') newRoomStatus = 'MAINTENANCE';
//         else if (['CONFIRMED', 'ONGOING'].includes(data.status)) newRoomStatus = 'OCCUPIED';
//         else if (data.status === 'CANCELLED') newRoomStatus = 'AVAILABLE';

//         await prisma.room.update({
//             where: { id: data.roomId },
//             data: { status: newRoomStatus },
//         });

//         const updatedBookingWithRoomStatus = {
//             ...updatedBooking,
//             roomStatus: newRoomStatus,
//         };

//         return new Response(JSON.stringify(updatedBookingWithRoomStatus), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // حذف الحجز
// export async function DELETE(req, context) {
//     try {
//         const { params } = context;
//         const id = params.id;

//         const booking = await prisma.booking.findUnique({ where: { id } });

//         if (!booking) {
//             return new Response(JSON.stringify({ error: 'الحجز غير موجود' }), { status: 404 });
//         }

//         await prisma.booking.delete({ where: { id } });

//         if (booking?.roomId) {
//             await prisma.room.update({
//                 where: { id: booking.roomId },
//                 data: { status: 'AVAILABLE' },
//             });
//         }

//         return new Response(JSON.stringify({ message: 'تم حذف الحجز' }), { status: 200 });
//     } catch (err) {
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// ----------------- قديم شغال ------------------------

// ------------------ جديد تحت التجربة-------------------

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// GET: جلب حجز محدد
export async function GET(req, { params }) {
    const { id } = params;
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { guest: true, room: true },
        });
        if (!booking) {
            return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
        }
        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);
        return NextResponse.json({ error: "فشل في جلب بيانات الحجز" }, { status: 500 });
    }
}

// PUT: تحديث بيانات الحجز + تحديث حالة الغرفة واللوج
export async function PUT(req, { params }) {
    const { id } = params;

    try {
        const data = await req.json();

        const result = await prisma.$transaction(async (tx) => {
            // الحجز الحالي
            const existing = await tx.booking.findUnique({
                where: { id },
                include: { room: true },
            });
            if (!existing) {
                throw new Error("الحجز غير موجود");
            }

            const prevRoomId = existing.roomId;
            const nextRoomId = data.roomId ?? prevRoomId;

            // تحديث بيانات الحجز أولاً
            const updatedBooking = await tx.booking.update({
                where: { id },
                data: {
                    guestId: data.guestId ?? existing.guestId,
                    roomId: nextRoomId,
                    checkIn: data.checkIn ?? existing.checkIn,
                    checkOut: data.checkOut ?? existing.checkOut,
                    adults: data.adults ?? existing.adults,
                    children: data.children ?? existing.children,
                    extraBeds: data.extraBeds ?? existing.extraBeds,
                    status: data.status ?? existing.status,
                    paymentStatus: data.paymentStatus ?? existing.paymentStatus,
                    source: data.source ?? existing.source,
                    notes: data.notes ?? existing.notes,
                    // لو عندك أعمدة إضافية (خصم / ضريبة / خدمات...) وسيماك يدعمها، اتركها:
                    discountPercent: data.discountPercent ?? existing.discountPercent,
                    taxPercent: data.taxPercent ?? existing.taxPercent,
                    extraServices: data.extraServices ?? existing.extraServices,
                    totalPrice: data.totalPrice ?? existing.totalPrice,
                },
                include: { room: true },
            });

            // 1) لو تغيّرت الغرفة: سجل خروج للقديمة ودخول للجديدة
            if (prevRoomId !== nextRoomId) {
                // الغرفة القديمة => AVAILABLE
                const lastOld = await tx.roomStatusLog.findFirst({
                    where: { roomId: prevRoomId },
                    orderBy: { changedAt: "desc" },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: prevRoomId,
                        oldStatus: lastOld?.newStatus ?? "AVAILABLE",
                        newStatus: "AVAILABLE",
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });
                await tx.room.update({
                    where: { id: prevRoomId },
                    data: { status: "AVAILABLE" },
                });

                // الغرفة الجديدة => OCCUPIED إلا إذا الحجز منتهي/ملغي
                const shouldOccupy =
                    !["CHECKED_OUT", "CANCELLED"].includes(
                        (updatedBooking.status || "").toUpperCase()
                    );

                const targetNewStatus = shouldOccupy ? "OCCUPIED" : "AVAILABLE";
                const lastNew = await tx.roomStatusLog.findFirst({
                    where: { roomId: nextRoomId },
                    orderBy: { changedAt: "desc" },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: nextRoomId,
                        oldStatus: lastNew?.newStatus ?? "AVAILABLE",
                        newStatus: targetNewStatus,
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });
                await tx.room.update({
                    where: { id: nextRoomId },
                    data: { status: targetNewStatus },
                });
            }

            // 2) لو تم إرسال roomStatus صراحةً من الواجهة، طبّقه على الغرفة الحالية (بعد التحديث)
            if (data.roomStatus) {
                const targetRoomId = nextRoomId;
                const last = await tx.roomStatusLog.findFirst({
                    where: { roomId: targetRoomId },
                    orderBy: { changedAt: "desc" },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: targetRoomId,
                        oldStatus: last?.newStatus ?? "AVAILABLE",
                        newStatus: data.roomStatus,
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });
                await tx.room.update({
                    where: { id: targetRoomId },
                    data: { status: data.roomStatus },
                });
            }

            // 3) لو الحجز اتغير إلى CHECKED_OUT ولم يُرسل roomStatus، خلّي الغرفة MAINTENANCE
            if (
                (updatedBooking.status || "").toUpperCase() === "CHECKED_OUT" &&
                !data.roomStatus
            ) {
                const targetRoomId = nextRoomId;
                const last = await tx.roomStatusLog.findFirst({
                    where: { roomId: targetRoomId },
                    orderBy: { changedAt: "desc" },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: targetRoomId,
                        oldStatus: last?.newStatus ?? "AVAILABLE",
                        newStatus: "MAINTENANCE",
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });
                await tx.room.update({
                    where: { id: targetRoomId },
                    data: { status: "MAINTENANCE" },
                });
            }

            return updatedBooking;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating booking:", error);
        const message = error?.message || "فشل تحديث بيانات الحجز";
        const status = message === "الحجز غير موجود" ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

// =================== DELETE ===================
// عند إنهاء الحجز -> تغيير الغرفة لصيانة
export async function DELETE(req, { params }) {
    try {
        const id = params?.id; // نقرأ معرف الحجز من URL /api/bookings/[id]

        if (!id) {
            return NextResponse.json({ error: "معرف الحجز مطلوب" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({ where: { id } });
            if (!booking) throw new Error("الحجز غير موجود");

            // تحديث سجل حالة الغرفة -> MAINTENANCE
            await tx.roomStatusLog.create({
                data: {
                    roomId: booking.roomId,
                    oldStatus: "OCCUPIED",
                    newStatus: "MAINTENANCE",
                    changedBy: "SYSTEM",
                    changedAt: new Date(),
                },
            });

            // تغيير حالة الغرفة الى صيانة
            await tx.room.update({
                where: { id: booking.roomId },
                data: { status: "MAINTENANCE" },
            });

            // تحديث حالة الحجز -> COMPLETED
            await tx.booking.update({
                where: { id },
                data: { status: "CHECKED_OUT" },
            });

            return booking;
        });

        return NextResponse.json({ success: true, booking: result });
    } catch (error) {
        console.error("Error ending booking:", error);
        return NextResponse.json({ error: "فشل إنهاء الحجز" }, { status: 500 });
    }
}
