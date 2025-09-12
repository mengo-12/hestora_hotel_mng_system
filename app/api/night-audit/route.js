import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const BROADCAST_URL = "http://localhost:3001/api/broadcast";

function toISODateStart(d) {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
}
function toISODateEnd(d) {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + 1);
    return dt;
}

function calculateRevenueBreakdown(bookings) {
    const breakdown = { roomRevenue: 0, extrasRevenue: 0, taxes: 0, adjustments: 0 };
    bookings.forEach(b => {
        (b.folio?.charges || []).forEach(c => {
            const chargeTotal = Number(c.amount || 0) + Number(c.tax || 0);
            if (c.code === "ROOM") breakdown.roomRevenue += chargeTotal;
            else if (c.type === "Extra") breakdown.extrasRevenue += chargeTotal;
            else if (c.type === "Tax") breakdown.taxes += chargeTotal;
            else if (c.type === "Adjustment") breakdown.adjustments += chargeTotal;
        });
    });
    return breakdown;
}

// -------- GET --------
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const date = searchParams.get("date");

        if (!propertyId || !date) return NextResponse.json({ error: "propertyId & date required" }, { status: 400 });

        const dayStart = toISODateStart(date);
        const dayEnd = toISODateEnd(date);

        const bookings = await prisma.booking.findMany({
            where: {
                propertyId,
                checkIn: { lte: dayEnd },
                checkOut: { gt: dayStart },
            },
            include: {
                guest: true,
                room: { include: { roomType: true } },
                company: true,
                folio: {
                    include: {
                        charges: {
                            where: { postedAt: { gte: dayStart, lt: dayEnd } },
                            orderBy: { postedAt: "asc" },
                        },
                        payments: true
                    },
                },
            },
            orderBy: { roomId: "asc" },
        });

        // حساب كل Folio Summary لكل حجز
        const bookingsWithFolioSummary = bookings.map(b => {
            const folio = b.folio || { charges: [], payments: [] };

            const subtotal = folio.charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
            const taxTotal = folio.charges.reduce((sum, c) => sum + ((Number(c.amount || 0) * Number(c.tax || 0)) / 100), 0);
            const totalCharges = subtotal + taxTotal;
            const totalPayments = folio.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const balance = totalCharges - totalPayments;

            return {
                ...b,
                folio: {
                    ...folio,
                    subtotal,
                    taxTotal,
                    totalCharges,
                    totalPayments,
                    balance
                }
            };
        });

        const roomsSold = bookings.length;
        const roomsAvailable = await prisma.room.count({ where: { propertyId } });
        const occupancy = roomsAvailable > 0 ? Math.round((roomsSold / roomsAvailable) * 100) : 0;

        let totalRevenue = 0, roomsRevenue = 0;
        bookingsWithFolioSummary.forEach(b => {
            const charges = b.folio?.charges || [];
            totalRevenue += charges.reduce((s, c) => s + Number(c.amount || 0) + Number(c.tax || 0), 0);
            roomsRevenue += charges.filter(c => c.code === "ROOM").reduce((s, c) => s + Number(c.amount || 0) + Number(c.tax || 0), 0);
        });

        const adr = roomsSold > 0 ? Math.round(roomsRevenue / roomsSold) : 0;
        const revpar = roomsAvailable > 0 ? Math.round(totalRevenue / roomsAvailable) : 0;

        return NextResponse.json({
            bookings: bookingsWithFolioSummary,
            summary: {
                roomsSold,
                roomsAvailable,
                occupancy,
                adr,
                revpar,
                totalRevenue,
                roomsRevenue,
                revenueBreakdown: calculateRevenueBreakdown(bookingsWithFolioSummary)
            }
        });
    } catch (err) {
        console.error("GET /api/night-audit failed:", err);
        return NextResponse.json({ error: "Failed to fetch night audit data", details: err.message }, { status: 500 });
    }
}



// -------- POST --------
export async function POST(req) {
    try {
        const body = await req.json();
        const { propertyId, date } = body || {};

        if (!propertyId) return NextResponse.json({ error: "Property required" }, { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const currentUserId = session.user.id;

        const dayStart = toISODateStart(date || new Date());
        const dayEnd = toISODateEnd(date || new Date());
        const todayKey = (date || new Date().toISOString()).split("T")[0];

        // ✅ تحقق إن اليوم مش مقفول قبل كده
        const alreadyClosed = await prisma.nightAudit.findFirst({
            where: { propertyId, closedDate: todayKey }
        });
        if (alreadyClosed) {
            return NextResponse.json({ error: "This date is already closed", closedAudit: alreadyClosed }, { status: 400 });
        }

        // 1️⃣ Post room charges
        const inhouseBookings = await prisma.booking.findMany({
            where: { propertyId, status: "InHouse" },
            include: { guest: true, room: true, folio: true },
        });

        for (const b of inhouseBookings) {
            if (!b.folio) continue;

            let amount = 0;
            let tax = 0;
            if (b.room?.roomTypeId) {
                const rt = await prisma.roomType.findUnique({ where: { id: b.room.roomTypeId } });
                if (rt) { amount = Number(rt.basePrice); tax = Number(rt.tax || 0); }
            }

            const createdCharge = await prisma.charge.create({
                data: {
                    folioId: b.folio.id,
                    code: "ROOM",
                    description: `Room charge for ${dayStart.toISOString().split("T")[0]}`,
                    amount,
                    tax,
                    postedById: currentUserId,
                },
            });

            try {
                await fetch(BROADCAST_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "ROOM_CHARGE_POSTED", data: { bookingId: b.id, charge: createdCharge } }),
                });
            } catch (err) { console.error("Broadcast failed ROOM_CHARGE_POSTED:", err); }
        }

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "POST_ROOM_CHARGES", metadata: { count: inhouseBookings.length } },
        });

        // 2️⃣ Update reservations (NoShows / AutoCheckouts)
        const now = new Date();
        const noShows = await prisma.booking.updateMany({ where: { propertyId, status: "Booked", checkIn: { lt: now } }, data: { status: "NoShow" } });
        const autoCheckouts = await prisma.booking.updateMany({ where: { propertyId, status: "InHouse", checkOut: { lt: now } }, data: { status: "CheckedOut" } });

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "UPDATE_RESERVATIONS", metadata: { noShows, autoCheckouts } },
        });

        // 3️⃣ Close Day → NightAudit
        const closedAudit = await prisma.nightAudit.create({
            data: {
                propertyId,
                closedDate: todayKey,
                closedById: currentUserId,
            },
        });

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "CLOSE_DAY", metadata: { closedDate: todayKey } },
        });

        // إرسال حدث واحد للـ Timeline
        try {
            await fetch(BROADCAST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "NIGHT_AUDIT_COMPLETED", data: { closedAudit } }),
            });
        } catch (err) { console.error("Broadcast failed NIGHT_AUDIT_COMPLETED:", err); }

        // 📊 Summary
        const updatedBookings = await prisma.booking.findMany({
            where: { propertyId, checkIn: { lte: dayEnd }, checkOut: { gt: dayStart } },
            include: { guest: true, room: { include: { roomType: true } }, company: true, folio: { include: { charges: { where: { postedAt: { gte: dayStart, lt: dayEnd } }, orderBy: { postedAt: "asc" } } } } },
            orderBy: { roomId: "asc" },
        });

        let totalRevenue = 0, roomsRevenue = 0;
        updatedBookings.forEach(b => {
            const charges = b.folio?.charges || [];
            totalRevenue += charges.reduce((s, c) => s + Number(c.amount || 0) + Number(c.tax || 0), 0);
            roomsRevenue += charges.filter(c => c.code === "ROOM").reduce((s, c) => s + Number(c.amount || 0) + Number(c.tax || 0), 0);
        });

        const roomsSold = updatedBookings.length;
        const roomsAvailable = await prisma.room.count({ where: { propertyId } });
        const occupancy = roomsAvailable > 0 ? Math.round((roomsSold / roomsAvailable) * 100) : 0;
        const adr = roomsSold > 0 ? Math.round(roomsRevenue / roomsSold) : 0;
        const revpar = roomsAvailable > 0 ? Math.round(totalRevenue / roomsAvailable) : 0;

        return NextResponse.json({
            success: true,
            audit: closedAudit,
            bookings: updatedBookings,
            summary: {
                roomsSold,
                roomsAvailable,
                occupancy,
                adr,
                revpar,
                totalRevenue,
                roomsRevenue,
                revenueBreakdown: calculateRevenueBreakdown(updatedBookings)
            }
        });

    } catch (err) {
        console.error("POST /api/night-audit failed:", err);
        return NextResponse.json({ error: "Night Audit failed", details: err.message }, { status: 500 });
    }
}

