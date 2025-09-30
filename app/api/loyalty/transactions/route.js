// app/api/loyalty/transactions/route.js
import prisma from "@/lib/prisma";

// GET: جلب معاملات الولاء مع فلترة حسب guestId، loyaltyMemberId، أو bookingId
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const guestId = searchParams.get("guestId");
        const loyaltyMemberId = searchParams.get("loyaltyMemberId");
        const bookingId = searchParams.get("bookingId");

        const where = {};
        if (loyaltyMemberId) where.loyaltyMemberId = loyaltyMemberId;
        if (bookingId) where.bookingId = bookingId;

        if (guestId) {
            const member = await prisma.loyaltyMember.findFirst({ where: { guestId } });
            if (!member) return new Response(JSON.stringify([]), { status: 200 });
            where.loyaltyMemberId = member.id;
        }

        const transactions = await prisma.loyaltyTransaction.findMany({
            where,
            include: {
                loyaltyMember: {
                    include: {
                        guest: true,
                        loyaltyProgram: true,
                    },
                },
                booking: true,
                folio: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return new Response(JSON.stringify(transactions), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch loyalty transactions:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}

// POST: إنشاء معاملة ولاء جديدة
export async function POST(req) {
    try {
        const { loyaltyMemberId, bookingId, folioId, points, type, description } = await req.json();

        if (!loyaltyMemberId || !points || !type) {
            return new Response(JSON.stringify({ error: "loyaltyMemberId, points, and type are required" }), { status: 400 });
        }

        const transaction = await prisma.loyaltyTransaction.create({
            data: {
                loyaltyMemberId,
                bookingId,
                folioId,
                points,
                type,
                description,
            },
            include: {
                loyaltyMember: {
                    include: { guest: true, loyaltyProgram: true },
                },
                booking: true,
                folio: true,
            },
        });

        // تحديث رصيد نقاط العضو
        await prisma.loyaltyMember.update({
            where: { id: loyaltyMemberId },
            data: {
                pointsBalance: {
                    increment: type.toLowerCase() === "earned" ? points : -points,
                },
                lastActivity: new Date(),
            },
        });

        // بث الحدث عبر Socket
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "LOYALTY_TRANSACTION_CREATED", data: transaction }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(transaction), { status: 201 });
    } catch (err) {
        console.error("Failed to create loyalty transaction:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
