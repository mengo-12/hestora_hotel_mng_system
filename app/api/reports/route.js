import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // تأكد من مسار ملف prisma client

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const type = searchParams.get("type"); // Booking, Folio, Payment, Extra, Housekeeping
        const propertyId = searchParams.get("propertyId");
        const hotelGroupId = searchParams.get("hotelGroupId");
        const from = searchParams.get("from"); // YYYY-MM-DD
        const to = searchParams.get("to");     // YYYY-MM-DD
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const skip = (page - 1) * limit;

        let whereClause = {};

        // فلترة حسب النوع
        if (type === "Booking") {
            whereClause = {
                propertyId: propertyId || undefined,
                ...(from && { checkIn: { gte: new Date(from) } }),
                ...(to && { checkOut: { lte: new Date(to) } }),
            };
            if (hotelGroupId) {
                whereClause.guest = { hotelGroupId };
            }
        } else if (type === "Folio") {
            whereClause = {
                booking: propertyId ? { propertyId } : undefined,
                ...(from && { createdAt: { gte: new Date(from) } }),
                ...(to && { createdAt: { lte: new Date(to) } }),
            };
        } else if (type === "Payment") {
            whereClause = {
                folio: propertyId ? { booking: { propertyId } } : undefined,
                ...(from && { postedAt: { gte: new Date(from) } }),
                ...(to && { postedAt: { lte: new Date(to) } }),
            };
        } else if (type === "Housekeeping") {
            whereClause = {
                propertyId: propertyId || undefined,
                ...(from && { createdAt: { gte: new Date(from) } }),
                ...(to && { createdAt: { lte: new Date(to) } }),
            };
        } else if (type === "Extra") {
            whereClause = {
                propertyId: propertyId || undefined,
                ...(from && { createdAt: { gte: new Date(from) } }),
                ...(to && { createdAt: { lte: new Date(to) } }),
            };
        }

        // جلب البيانات مع الفلاتر
        let reports = [];
        let total = 0;

        if (type === "Booking") {
            total = await prisma.booking.count({ where: whereClause });
            reports = await prisma.booking.findMany({
                where: whereClause,
                include: {
                    guest: true,
                    property: true,
                    room: true,
                    ratePlan: true,
                    extras: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            });
        } else if (type === "Folio") {
            total = await prisma.folio.count({ where: whereClause });
            reports = await prisma.folio.findMany({
                where: whereClause,
                include: {
                    booking: { include: { guest: true, property: true } },
                    guest: true,
                    charges: true,
                    payments: true,
                    extras: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            });
        } else if (type === "Payment") {
            total = await prisma.payment.count({ where: whereClause });
            reports = await prisma.payment.findMany({
                where: whereClause,
                include: {
                    folio: { include: { booking: true, guest: true, property: true } },
                    postedBy: true
                },
                skip,
                take: limit,
                orderBy: { postedAt: "desc" },
            });
        } else if (type === "Housekeeping") {
            total = await prisma.housekeepingTask.count({ where: whereClause });
            reports = await prisma.housekeepingTask.findMany({
                where: whereClause,
                include: {
                    room: true,
                    assignedTo: true,
                    property: true
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            });
        } else if (type === "Extra") {
            total = await prisma.extra.count({ where: whereClause });
            reports = await prisma.extra.findMany({
                where: whereClause,
                include: {
                    booking: true,
                    guest: true,
                    folio: true
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            });
        } else {
            return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        }

        // فلترة البحث داخل التفاصيل
        if (search) {
            const searchLower = search.toLowerCase();
            reports = reports.filter(r => JSON.stringify(r).toLowerCase().includes(searchLower));
        }

        return NextResponse.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            reports
        });

    } catch (err) {
        console.error("Error fetching reports:", err);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}
