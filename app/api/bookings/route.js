// import { NextResponse } from "next/server";
// import prisma from "../../../lib/prisma";


// // GET: جلب كل الحجوزات مع بيانات النزيل والغرفة
// export async function GET() {
//     try {
//         const bookings = await prisma.booking.findMany({
//             include: {
//                 guest: true,
//                 room: true,
//             },
//             orderBy: {
//                 checkIn: "desc",
//             },
//         });

//         return NextResponse.json(bookings);
//     } catch (error) {
//         console.error("Error fetching bookings:", error);
//         return NextResponse.json({ error: "فشل جلب الحجوزات" }, { status: 500 });
//     }
// }

// // إضافة حجز جديد
// export async function POST(req) {
//     try {
//         let data;

//         try {
//             data = await req.json();
//         } catch (err) {
//             return NextResponse.json({ error: "البيانات المرسلة غير صحيحة أو فاضية" }, { status: 400 });
//         }

//         if (!data || !data.checkIn || !data.checkOut) {
//             return NextResponse.json({ error: "يجب إدخال جميع البيانات المطلوبة" }, { status: 400 });
//         }

//         const checkIn = new Date(data.checkIn);
//         const checkOut = new Date(data.checkOut);

//         if (isNaN(checkIn) || isNaN(checkOut)) {
//             return NextResponse.json({ error: "صيغة التاريخ غير صحيحة" }, { status: 400 });
//         }

//         // التحقق من آخر حالة للغرفة
//         const lastStatusLog = await prisma.roomStatusLog.findFirst({
//             where: { roomId: data.roomId },
//             orderBy: { changedAt: "desc" },
//         });

//         if (lastStatusLog && lastStatusLog.newStatus !== "AVAILABLE") {
//             return NextResponse.json({ error: "⚠️ الغرفة غير متاحة للحجز" }, { status: 400 });
//         }

//         // إنشاء الحجز
//         const booking = await prisma.booking.create({
//             data: {
//                 guestId: data.guestId,
//                 roomId: data.roomId,
//                 checkIn,
//                 checkOut,
//                 status: data.status || "CONFIRMED",
//             },
//             include: { room: true, guest: true },
//         });

//         // إضافة سجل حالة الغرفة بعد الحجز مباشرة
//         await prisma.roomStatusLog.create({
//             data: {
//                 roomId: data.roomId,
//                 oldStatus: lastStatusLog ? lastStatusLog.newStatus : "AVAILABLE",
//                 newStatus: "OCCUPIED",
//                 changedBy: "SYSTEM",
//                 changedAt: new Date(),
//             },
//         });

//         return NextResponse.json(booking);
//     } catch (error) {
//         console.error("Error creating booking:", error);
//         return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الحجز" }, { status: 500 });
//     }
// }


// ------------------ قديم لكن شغال -----------------



//  ----------------- جديد تحت التجربة --------------

import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// GET: قائمة الحجوزات أو حجوزات غرفة محددة (لتقويم الغرفة)
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get("roomId");

        if (roomId) {
            const bookings = await prisma.booking.findMany({
                where: { roomId },
                select: { id: true, checkIn: true, checkOut: true, status: true },
                orderBy: { checkIn: "desc" },
            });
            return NextResponse.json(bookings);
        }

        // كل الحجوزات (لصفحة الإدارة)
        const all = await prisma.booking.findMany({
            include: {
                guest: true,
                room: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(all);
    } catch (error) {
        console.error("GET /api/bookings error:", error);
        return NextResponse.json({ error: "فشل جلب الحجوزات" }, { status: 500 });
    }
}

// POST: إضافة حجز جديد + تحديث حالة الغرفة واللوج
export async function POST(req) {
    try {
        let data;
        try {
            data = await req.json();
        } catch {
            return NextResponse.json(
                { error: "البيانات المرسلة غير صحيحة أو فاضية" },
                { status: 400 }
            );
        }

        if (!data?.guestId || !data?.roomId || !data?.checkIn || !data?.checkOut) {
            return NextResponse.json(
                { error: "يجب إدخال الضيف، الغرفة، تاريخ الدخول، تاريخ الخروج" },
                { status: 400 }
            );
        }

        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        if (isNaN(checkIn) || isNaN(checkOut)) {
            return NextResponse.json({ error: "صيغة التاريخ غير صحيحة" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // تحقق من آخر حالة للغرفة
            const lastStatusLog = await tx.roomStatusLog.findFirst({
                where: { roomId: data.roomId },
                orderBy: { changedAt: "desc" },
            });
            const lastStatus = lastStatusLog?.newStatus;

            if (lastStatus && lastStatus !== "AVAILABLE") {
                throw new Error("⚠️ الغرفة غير متاحة للحجز");
            }

            // إنشاء الحجز
            const booking = await tx.booking.create({
                data: {
                    guestId: data.guestId,
                    roomId: data.roomId,
                    checkIn,
                    checkOut,
                    adults: data.adults ?? 1,
                    children: data.children ?? 0,
                    extraBeds: data.extraBeds ?? 0,
                    status: data.status || "CONFIRMED",
                    paymentStatus: data.paymentStatus || "UNPAID",
                    source: data.source || "Walk-in",
                    notes: data.notes || "",
                    discountPercent: data.discountPercent ?? 0,
                    taxPercent: data.taxPercent ?? 0,
                    extraServices: data.extraServices ?? [],
                    totalPrice: data.totalPrice ?? null,
                },
                include: { guest: true, room: true },
            });

            // تحديث حالة الغرفة -> OCCUPIED + تسجيل اللوج
            await tx.roomStatusLog.create({
                data: {
                    roomId: data.roomId,
                    oldStatus: lastStatus ?? "AVAILABLE",
                    newStatus: "OCCUPIED",
                    changedBy: "SYSTEM",
                    changedAt: new Date(),
                },
            });

            await tx.room.update({
                where: { id: data.roomId },
                data: { status: "OCCUPIED" },
            });

            return booking;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error creating booking:", error);
        const message =
            error?.message === "⚠️ الغرفة غير متاحة للحجز"
                ? error.message
                : "حدث خطأ أثناء إنشاء الحجز";
        const status = message === "⚠️ الغرفة غير متاحة للحجز" ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
