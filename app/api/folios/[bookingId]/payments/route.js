import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
    try {
        const { folioId } = params;
        const { method, amount, ref } = await req.json();
        const userId = "SYSTEM"; // يمكن تعديلها حسب المستخدم الحالي

        if (!method || !amount) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // التأكد من وجود Folio
        const folio = await prisma.folio.findUnique({ where: { id: folioId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        // إنشاء Payment
        const payment = await prisma.payment.create({
            data: {
                folioId,
                method,
                amount: Number(amount),
                ref: ref || null,
                postedById: userId,
            },
            include: { folio: true, postedBy: true }
        });

        // Broadcast عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "PAYMENT_ADDED", data: payment }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(payment), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to add payment" }), { status: 500 });
    }
}
