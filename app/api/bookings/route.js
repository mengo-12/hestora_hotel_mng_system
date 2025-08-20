import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// =================== GET ===================
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

        const all = await prisma.booking.findMany({
            include: { guest: true, room: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(all);
    } catch (error) {
        console.error("GET /api/bookings error:", error);
        return NextResponse.json({ error: "فشل جلب الحجوزات" }, { status: 500 });
    }
}

// =================== POST ===================
export async function POST(req) {
    try {
        const data = await req.json();

        if (!data?.guestId || !data?.roomId || !data?.checkIn || !data?.checkOut) {
            return NextResponse.json(
                { error: "يجب إدخال الضيف، الغرفة، تاريخ الدخول، تاريخ الخروج" },
                { status: 400 }
            );
        }

        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);

        const result = await prisma.$transaction(async (tx) => {
            // ===== تحقق من وجود حجز سابق للنزيل لنفس الغرفة في فترة متداخلة =====
            const overlappingBooking = await tx.booking.findFirst({
                where: {
                    guestId: data.guestId,
                    roomId: data.roomId,
                    status: { not: "CHECKED_OUT" },
                    OR: [
                        {
                            checkIn: { lte: checkOut },
                            checkOut: { gte: checkIn },
                        },
                    ],
                },
            });

            if (overlappingBooking) {
                throw new Error("⚠️ هذا النزيل لديه حجز ساري لهذه الغرفة في نفس الفترة.");
            }

            // ===== تحقق من حالة الغرفة =====
            const lastStatusLog = await tx.roomStatusLog.findFirst({
                where: { roomId: data.roomId },
                orderBy: { changedAt: "desc" },
            });
            const lastStatus = lastStatusLog?.newStatus;

            if (lastStatus && lastStatus !== "AVAILABLE") {
                throw new Error("⚠️ الغرفة غير متاحة للحجز");
            }

            // ===== إنشاء الحجز =====
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

            // ===== تحديث سجل حالة الغرفة =====
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
            error?.message?.includes("⚠️") ? error.message : "حدث خطأ أثناء إنشاء الحجز";
        const status = message.includes("⚠️") ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

// =================== PUT ===================
// تعديل بيانات الحجز أو تغيير الغرفة
export async function PUT(req) {
    try {
        const data = await req.json();

        if (!data?.id) {
            return NextResponse.json({ error: "معرف الحجز مطلوب" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const oldBooking = await tx.booking.findUnique({
                where: { id: data.id },
            });

            if (!oldBooking) throw new Error("الحجز غير موجود");

            // تحقق من عدم وجود حجز متداخل للنزيل إذا تم تغيير الغرفة أو التواريخ
            if (data.roomId || data.checkIn || data.checkOut) {
                const checkIn = data.checkIn ? new Date(data.checkIn) : oldBooking.checkIn;
                const checkOut = data.checkOut ? new Date(data.checkOut) : oldBooking.checkOut;
                const roomId = data.roomId ?? oldBooking.roomId;

                const overlappingBooking = await tx.booking.findFirst({
                    where: {
                        id: { not: oldBooking.id },
                        guestId: oldBooking.guestId,
                        roomId,
                        status: { not: "CHECKED_OUT" },
                        OR: [
                            { checkIn: { lte: checkOut }, checkOut: { gte: checkIn } },
                        ],
                    },
                });

                if (overlappingBooking) {
                    throw new Error("⚠️ هذا النزيل لديه حجز ساري لهذه الغرفة في نفس الفترة.");
                }
            }

            // تحديث بيانات الحجز
            const booking = await tx.booking.update({
                where: { id: data.id },
                data: { ...data, updatedAt: new Date() },
                include: { guest: true, room: true },
            });

            return booking;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating booking:", error);
        const message = error?.message?.includes("⚠️")
            ? error.message
            : "فشل تعديل الحجز";
        const status = message.includes("⚠️") ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

// =================== DELETE ===================
// عند إنهاء الحجز -> تغيير الغرفة لصيانة
export async function DELETE(req, { params }) {
    try {
        const id = params?.id;

        if (!id) return NextResponse.json({ error: "معرف الحجز مطلوب" }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({ where: { id } });
            if (!booking) throw new Error("الحجز غير موجود");

            await tx.roomStatusLog.create({
                data: {
                    roomId: booking.roomId,
                    oldStatus: "OCCUPIED",
                    newStatus: "MAINTENANCE",
                    changedBy: "SYSTEM",
                    changedAt: new Date(),
                },
            });

            await tx.room.update({
                where: { id: booking.roomId },
                data: { status: "MAINTENANCE" },
            });

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


// ------------------ قديم لكن شغال -----------------



//  ----------------- جديد تحت التجربة --------------

// import { NextResponse } from "next/server";
// import prisma from "../../../lib/prisma";

// // =================== GET ===================
// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const roomId = searchParams.get("roomId");

//         if (roomId) {
//             const bookings = await prisma.booking.findMany({
//                 where: { roomId },
//                 select: { id: true, checkIn: true, checkOut: true, status: true },
//                 orderBy: { checkIn: "desc" },
//             });
//             return NextResponse.json(bookings);
//         }

//         const all = await prisma.booking.findMany({
//             include: {
//                 guest: true,
//                 room: true,
//             },
//             orderBy: { createdAt: "desc" },
//         });
//         return NextResponse.json(all);
//     } catch (error) {
//         console.error("GET /api/bookings error:", error);
//         return NextResponse.json({ error: "فشل جلب الحجوزات" }, { status: 500 });
//     }
// }

// // =================== POST ===================
// export async function POST(req) {
//     try {
//         const data = await req.json();

//         if (!data?.guestId || !data?.roomId || !data?.checkIn || !data?.checkOut) {
//             return NextResponse.json(
//                 { error: "يجب إدخال الضيف، الغرفة، تاريخ الدخول، تاريخ الخروج" },
//                 { status: 400 }
//             );
//         }

//         const checkIn = new Date(data.checkIn);
//         const checkOut = new Date(data.checkOut);

//         const result = await prisma.$transaction(async (tx) => {
//             const lastStatusLog = await tx.roomStatusLog.findFirst({
//                 where: { roomId: data.roomId },
//                 orderBy: { changedAt: "desc" },
//             });
//             const lastStatus = lastStatusLog?.newStatus;

//             if (lastStatus && lastStatus !== "AVAILABLE") {
//                 throw new Error("⚠️ الغرفة غير متاحة للحجز");
//             }

//             const booking = await tx.booking.create({
//                 data: {
//                     guestId: data.guestId,
//                     roomId: data.roomId,
//                     checkIn,
//                     checkOut,
//                     adults: data.adults ?? 1,
//                     children: data.children ?? 0,
//                     extraBeds: data.extraBeds ?? 0,
//                     status: data.status || "CONFIRMED",
//                     paymentStatus: data.paymentStatus || "UNPAID",
//                     source: data.source || "Walk-in",
//                     notes: data.notes || "",
//                     discountPercent: data.discountPercent ?? 0,
//                     taxPercent: data.taxPercent ?? 0,
//                     extraServices: data.extraServices ?? [],
//                     totalPrice: data.totalPrice ?? null,
//                 },
//                 include: { guest: true, room: true },
//             });

//             await tx.roomStatusLog.create({
//                 data: {
//                     roomId: data.roomId,
//                     oldStatus: lastStatus ?? "AVAILABLE",
//                     newStatus: "OCCUPIED",
//                     changedBy: "SYSTEM",
//                     changedAt: new Date(),
//                 },
//             });

//             await tx.room.update({
//                 where: { id: data.roomId },
//                 data: { status: "OCCUPIED" },
//             });

//             return booking;
//         });

//         return NextResponse.json(result);
//     } catch (error) {
//         console.error("Error creating booking:", error);
//         const message =
//             error?.message === "⚠️ الغرفة غير متاحة للحجز"
//                 ? error.message
//                 : "حدث خطأ أثناء إنشاء الحجز";
//         const status = message === "⚠️ الغرفة غير متاحة للحجز" ? 400 : 500;
//         return NextResponse.json({ error: message }, { status });
//     }
// }

// // =================== PUT ===================
// // تعديل بيانات الحجز أو تغيير الغرفة
// export async function PUT(req) {
//     try {
//         const data = await req.json();

//         if (!data?.id) {
//             return NextResponse.json({ error: "معرف الحجز مطلوب" }, { status: 400 });
//         }

//         const result = await prisma.$transaction(async (tx) => {
//             const oldBooking = await tx.booking.findUnique({
//                 where: { id: data.id },
//             });

//             if (!oldBooking) {
//                 throw new Error("الحجز غير موجود");
//             }

//             // إذا تم تغيير الغرفة
//             if (data.roomId && data.roomId !== oldBooking.roomId) {
//                 // الغرفة القديمة -> MAINTENANCE
//                 await tx.roomStatusLog.create({
//                     data: {
//                         roomId: oldBooking.roomId,
//                         oldStatus: "OCCUPIED",
//                         newStatus: "MAINTENANCE",
//                         changedBy: "SYSTEM",
//                         changedAt: new Date(),
//                     },
//                 });
//                 await tx.room.update({
//                     where: { id: oldBooking.roomId },
//                     data: { status: "MAINTENANCE" },
//                 });

//                 // الغرفة الجديدة -> OCCUPIED
//                 await tx.roomStatusLog.create({
//                     data: {
//                         roomId: data.roomId,
//                         oldStatus: "AVAILABLE",
//                         newStatus: "OCCUPIED",
//                         changedBy: "SYSTEM",
//                         changedAt: new Date(),
//                     },
//                 });
//                 await tx.room.update({
//                     where: { id: data.roomId },
//                     data: { status: "OCCUPIED" },
//                 });
//             }

//             // تحديث بيانات الحجز
//             const booking = await tx.booking.update({
//                 where: { id: data.id },
//                 data: {
//                     ...data,
//                     updatedAt: new Date(),
//                 },
//                 include: { guest: true, room: true },
//             });

//             return booking;
//         });

//         return NextResponse.json(result);
//     } catch (error) {
//         console.error("Error updating booking:", error);
//         return NextResponse.json({ error: "فشل تعديل الحجز" }, { status: 500 });
//     }
// }

// // =================== DELETE ===================
// // =================== DELETE ===================
// // عند إنهاء الحجز -> تغيير الغرفة لصيانة
// export async function DELETE(req, { params }) {
//     try {
//         const id = params?.id; // نقرأ معرف الحجز من URL /api/bookings/[id]

//         if (!id) {
//             return NextResponse.json({ error: "معرف الحجز مطلوب" }, { status: 400 });
//         }

//         const result = await prisma.$transaction(async (tx) => {
//             const booking = await tx.booking.findUnique({ where: { id } });
//             if (!booking) throw new Error("الحجز غير موجود");

//             // تحديث سجل حالة الغرفة -> MAINTENANCE
//             await tx.roomStatusLog.create({
//                 data: {
//                     roomId: booking.roomId,
//                     oldStatus: "OCCUPIED",
//                     newStatus: "MAINTENANCE",
//                     changedBy: "SYSTEM",
//                     changedAt: new Date(),
//                 },
//             });

//             // تغيير حالة الغرفة الى صيانة
//             await tx.room.update({
//                 where: { id: booking.roomId },
//                 data: { status: "MAINTENANCE" },
//             });

//             // تحديث حالة الحجز -> COMPLETED
//             await tx.booking.update({
//                 where: { id },
//                 data: { status: "CHECKED_OUT" },
//             });

//             return booking;
//         });

//         return NextResponse.json({ success: true, booking: result });
//     } catch (error) {
//         console.error("Error ending booking:", error);
//         return NextResponse.json({ error: "فشل إنهاء الحجز" }, { status: 500 });
//     }
// }

