import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
    try {
        const { folioId } = params;
        const { code, description, amount } = await req.json();
        const userId = "SYSTEM"; // يمكن تعديلها حسب المستخدم الحالي

        if (!code || !description || !amount) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // التأكد من وجود Folio
        const folio = await prisma.folio.findUnique({ where: { id: folioId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        // إنشاء Charge
        const charge = await prisma.charge.create({
            data: {
                folioId,
                code,
                description,
                amount: Number(amount),
                postedById: userId,
            },
            include: { folio: true, postedBy: true }
        });

        // Broadcast عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "CHARGE_ADDED", data: charge }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(charge), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to add charge" }), { status: 500 });
    }
}
