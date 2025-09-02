// app/api/night-audit/admin/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function broadcast(event, data) {
    try {
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event, data }),
        });
    } catch (err) {
        console.error("Broadcast failed:", err);
    }
}

export async function POST(req) {
    try {
        const { propertyId, date } = await req.json();
        if (!propertyId) return new Response(JSON.stringify({ error: "Property required" }), { status: 400 });
        if (!date) return new Response(JSON.stringify({ error: "Date required" }), { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const currentUserId = session.user.id;
        const auditDate = new Date(date);

        // 1️⃣ ترحيل أسعار الغرف
        const reservations = await prisma.reservation.findMany({
            where: { propertyId, status: "CHECKED_IN" },
            include: { room: true, folio: true },
        });

        for (const res of reservations) {
            const folioEntry = await prisma.folioEntry.create({
                data: {
                    folioId: res.folio.id,
                    type: "ROOM_CHARGE",
                    amount: res.room.rate,
                    description: `Room charge for ${auditDate.toLocaleDateString()}`,
                },
            });
            await broadcast("ADMIN_ROOM_CHARGE_POSTED", { reservationId: res.id, folioEntry });
        }

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "ADMIN_POST_ROOM_CHARGES", metadata: { reservations: reservations.length } },
        });
        await broadcast("ADMIN_AUDIT_STEP_COMPLETED", { step: "POST_ROOM_CHARGES", propertyId });

        // 2️⃣ تحديث الحجوزات
        const noShows = await prisma.reservation.updateMany({
            where: { propertyId, status: "BOOKED", checkInDate: { lt: auditDate } },
            data: { status: "NO_SHOW" },
        });

        const autoCheckouts = await prisma.reservation.updateMany({
            where: { propertyId, status: "CHECKED_IN", checkOutDate: { lt: auditDate } },
            data: { status: "CHECKED_OUT" },
        });

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "ADMIN_UPDATE_RESERVATIONS", metadata: { noShows, autoCheckouts } },
        });
        await broadcast("ADMIN_AUDIT_STEP_COMPLETED", { step: "UPDATE_RESERVATIONS", propertyId });

        // 3️⃣ إقفال وفتح اليوم
        const today = auditDate.toISOString().split("T")[0];

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "ADMIN_CLOSE_DAY", metadata: { closedDate: today } },
        });
        await broadcast("ADMIN_AUDIT_STEP_COMPLETED", { step: "CLOSE_DAY", propertyId });

        await prisma.auditLog.create({
            data: { actorId: currentUserId, propertyId, action: "ADMIN_OPEN_NEW_DAY", metadata: { openedDate: today } },
        });
        await broadcast("ADMIN_AUDIT_STEP_COMPLETED", { step: "OPEN_NEW_DAY", propertyId });

        return new Response(JSON.stringify({ success: true, auditDate: today }), { status: 200 });

    } catch (err) {
        console.error("Admin Night Audit failed:", err);
        return new Response(JSON.stringify({ error: "Admin Night Audit failed", details: err.message }), { status: 500 });
    }
}
