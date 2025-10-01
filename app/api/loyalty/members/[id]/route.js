// app/api/loyalty/members/[id]/route.js
import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();
        const { membershipLevel, loyaltyProgramId, pointsBalance } = body;

        // جلب العضو الحالي
        const existing = await prisma.loyaltyMember.findUnique({
            where: { id: String(id) }, // ✅ تأكد أنه String
            include: { transactions: true }
        });

        if (!existing) {
            return new Response(JSON.stringify({ error: "Member not found" }), { status: 404 });
        }

        const oldPoints = existing.pointsBalance;
        const newPoints = Number(pointsBalance);
        const diff = newPoints - oldPoints;

        // تحديث العضو
        const updated = await prisma.loyaltyMember.update({
            where: { id: String(id) },
            data: {
                membershipLevel,
                loyaltyProgramId: loyaltyProgramId || null,
                pointsBalance: newPoints,
                lastActivity: new Date()
            },
            include: {
                guest: true,
                loyaltyProgram: true,
                transactions: true
            }
        });

        // إنشاء معاملة فرق
        if (diff !== 0) {
            await prisma.loyaltyTransaction.create({
                data: {
                    loyaltyMemberId: String(id),
                    points: Math.abs(diff),
                    type: diff > 0 ? "Earned" : "Redeemed",
                    description: "Balance adjustment"
                }
            });
        }

        // إرجاع النسخة المحدثة بالـ transactions الجديدة
        const finalMember = await prisma.loyaltyMember.findUnique({
            where: { id: String(id) },
            include: { guest: true, loyaltyProgram: true, transactions: true }
        });

        // Socket broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "LOYALTY_MEMBER_UPDATED", data: finalMember }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(finalMember), { status: 200 });
    } catch (err) {
        console.error("Update member error:", err);
        return new Response(JSON.stringify({ error: "Failed to update member" }), { status: 500 });
    }
}
