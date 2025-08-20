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

// PUT: تحديث بيانات الحجز + تحديث حالة الغرفة
export async function PUT(req, { params }) {
    const { id } = params;

    try {
        const data = await req.json();

        // إصلاح صيغة التواريخ (Prisma يحتاج DateTime كامل)
        const checkIn = data.checkIn ? new Date(data.checkIn) : undefined;
        const checkOut = data.checkOut ? new Date(data.checkOut) : undefined;

        const result = await prisma.$transaction(async (tx) => {
            // الحجز الحالي
            const existing = await tx.booking.findUnique({
                where: { id },
                include: { room: true },
            });
            if (!existing) throw new Error("الحجز غير موجود");

            const prevRoomId = existing.roomId;
            const nextRoomId = data.roomId ?? prevRoomId;

            // تحديث بيانات الحجز
            const updatedBooking = await tx.booking.update({
                where: { id },
                data: {
                    guestId: data.guestId ?? existing.guestId,
                    roomId: nextRoomId,
                    checkIn: checkIn ?? existing.checkIn,
                    checkOut: checkOut ?? existing.checkOut,
                    adults: data.adults ?? existing.adults,
                    children: data.children ?? existing.children,
                    extraBeds: data.extraBeds ?? existing.extraBeds,
                    status: data.status ?? existing.status,
                    paymentStatus: data.paymentStatus ?? existing.paymentStatus,
                    source: data.source ?? existing.source,
                    notes: data.notes ?? existing.notes,
                    discountPercent: data.discountPercent ?? existing.discountPercent,
                    taxPercent: data.taxPercent ?? existing.taxPercent,
                    extraServices: data.extraServices ?? existing.extraServices,
                    totalPrice: data.totalPrice ?? existing.totalPrice,
                },
                include: { room: true },
            });

            // 1) لو تغيّرت الغرفة
            if (prevRoomId !== nextRoomId) {
                // الغرفة القديمة => AVAILABLE
                await tx.room.update({
                    where: { id: prevRoomId },
                    data: { status: "AVAILABLE" },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: prevRoomId,
                        oldStatus: existing.room.status,
                        newStatus: "AVAILABLE",
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });

                // الغرفة الجديدة => OCCUPIED إلا إذا الحجز ملغي/منتهي
                const shouldOccupy = !["CHECKED_OUT", "CANCELLED"].includes(
                    (updatedBooking.status || "").toUpperCase()
                );
                const targetNewStatus = shouldOccupy ? "OCCUPIED" : "AVAILABLE";

                await tx.room.update({
                    where: { id: nextRoomId },
                    data: { status: targetNewStatus },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: nextRoomId,
                        oldStatus: "AVAILABLE",
                        newStatus: targetNewStatus,
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });
            }

            // 2) لو تم إرسال roomStatus صراحةً من الواجهة
            if (data.roomStatus) {
                await tx.room.update({
                    where: { id: nextRoomId },
                    data: { status: data.roomStatus },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: nextRoomId,
                        oldStatus: updatedBooking.room.status,
                        newStatus: data.roomStatus,
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
                });
            }

            // 3) لو الحجز CHECKED_OUT ولم يُرسل roomStatus => MAINTENANCE
            if (
                (updatedBooking.status || "").toUpperCase() === "CHECKED_OUT" &&
                !data.roomStatus
            ) {
                await tx.room.update({
                    where: { id: nextRoomId },
                    data: { status: "MAINTENANCE" },
                });
                await tx.roomStatusLog.create({
                    data: {
                        roomId: nextRoomId,
                        oldStatus: updatedBooking.room.status,
                        newStatus: "MAINTENANCE",
                        changedBy: "SYSTEM",
                        changedAt: new Date(),
                    },
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
