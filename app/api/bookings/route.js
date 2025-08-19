import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";


// GET: جلب كل الحجوزات مع بيانات النزيل والغرفة
export async function GET() {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                guest: true,
                room: true,
            },
            orderBy: {
                checkIn: "desc",
            },
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ error: "فشل جلب الحجوزات" }, { status: 500 });
    }
}

// إضافة حجز جديد
export async function POST(req) {
    try {
        let data;

        try {
            data = await req.json();
        } catch (err) {
            return NextResponse.json({ error: "البيانات المرسلة غير صحيحة أو فاضية" }, { status: 400 });
        }

        if (!data || !data.checkIn || !data.checkOut) {
            return NextResponse.json({ error: "يجب إدخال جميع البيانات المطلوبة" }, { status: 400 });
        }

        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);

        if (isNaN(checkIn) || isNaN(checkOut)) {
            return NextResponse.json({ error: "صيغة التاريخ غير صحيحة" }, { status: 400 });
        }

        // التحقق من آخر حالة للغرفة
        const lastStatusLog = await prisma.roomStatusLog.findFirst({
            where: { roomId: data.roomId },
            orderBy: { changedAt: "desc" },
        });

        if (lastStatusLog && lastStatusLog.newStatus !== "AVAILABLE") {
            return NextResponse.json({ error: "⚠️ الغرفة غير متاحة للحجز" }, { status: 400 });
        }

        // إنشاء الحجز
        const booking = await prisma.booking.create({
            data: {
                guestId: data.guestId,
                roomId: data.roomId,
                checkIn,
                checkOut,
                status: data.status || "CONFIRMED",
            },
            include: { room: true, guest: true },
        });

        // إضافة سجل حالة الغرفة بعد الحجز مباشرة
        await prisma.roomStatusLog.create({
            data: {
                roomId: data.roomId,
                oldStatus: lastStatusLog ? lastStatusLog.newStatus : "AVAILABLE",
                newStatus: "OCCUPIED",
                changedBy: "SYSTEM",
                changedAt: new Date(),
            },
        });

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error creating booking:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الحجز" }, { status: 500 });
    }
}
