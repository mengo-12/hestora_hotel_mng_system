import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

// GET: جلب بيانات حجز معين
export async function GET(req, { params }) {
    const { id } = params;
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                guest: true,
                room: true,
            },
        });
        if (!booking) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);
        return NextResponse.json({ error: "فشل في جلب بيانات الحجز" }, { status: 500 });
    }
}

// PUT: تعديل بيانات الحجز
export async function PUT(req, { params }) {
    const { id } = params;
    try {
        const data = await req.json();

        // تحديث الحجز
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                guestId: data.guestId,
                roomId: data.roomId,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                adults: data.adults,
                children: data.children,
                extraBeds: data.extraBeds,
                status: data.status,
                paymentStatus: data.paymentStatus,
                source: data.source,
                notes: data.notes,
                discountPercent: data.discountPercent,
                taxPercent: data.taxPercent,
                extraServices: data.extraServices,
                totalPrice: data.totalPrice,
            },
            include: { guest: true, room: true },
        });

        // تحديث حالة الغرفة إذا تغيرت
        if (data.roomStatus) {
            await prisma.roomStatusLog.create({
                data: {
                    roomId: data.roomId,
                    oldStatus: updatedBooking.room.status || "AVAILABLE",
                    newStatus: data.roomStatus,
                    changedBy: "SYSTEM",
                    changedAt: new Date(),
                },
            });
        }

        return NextResponse.json(updatedBooking);
    } catch (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ error: "فشل تحديث بيانات الحجز" }, { status: 500 });
    }
}

// DELETE: حذف الحجز
export async function DELETE(req, { params }) {
    const { id } = params;
    try {
        await prisma.booking.delete({ where: { id } });
        return NextResponse.json({ message: "تم حذف الحجز بنجاح" });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return NextResponse.json({ error: "فشل حذف الحجز" }, { status: 500 });
    }
}
