import prisma from "@/lib/prisma";

// --- GET كل RatePlans لفندق معين ---
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) return new Response(JSON.stringify({ error: "propertyId required" }), { status: 400 });

    const ratePlans = await prisma.ratePlan.findMany({
        where: { propertyId },
        include: { roomType: true }
    });

    return new Response(JSON.stringify(ratePlans), { status: 200 });
}

// --- POST إنشاء RatePlan جديد ---
export async function POST(req) {
    try {
        const { propertyId, roomTypeId, code, name, basePrice, currency, isPublic, mealPlan, parentRatePlanId } = await req.json();
        if (!propertyId || !roomTypeId || !code || !name || !basePrice || !currency) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const newPlan = await prisma.ratePlan.create({
            data: { propertyId, roomTypeId, code, name, basePrice, currency, isPublic: isPublic ?? true, mealPlan, parentRatePlanId }
        });

        // ✅ Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATEPLAN_CREATED", data: newPlan }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(newPlan), { status: 201 });
    } catch (err) {
        console.error("Failed to create rate plan:", err);
        return new Response(JSON.stringify({ error: "Failed to create rate plan" }), { status: 500 });
    }
}
