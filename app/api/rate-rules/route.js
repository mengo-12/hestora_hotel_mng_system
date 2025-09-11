import prisma from "@/lib/prisma";

// GET RateRules
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const ratePlanId = searchParams.get("ratePlanId");

        if (!ratePlanId) return new Response(JSON.stringify({ error: "ratePlanId is required" }), { status: 400 });

        const rules = await prisma.rateRule.findMany({
            where: { ratePlanId },
            orderBy: { startDate: "asc" } // استخدام startDate بدل date مفصل للـ validity
        });

        return new Response(JSON.stringify(rules), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch rate rules:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch rate rules" }), { status: 500 });
    }
}

// POST RateRule
export async function POST(req) {
    try {
        const {
            ratePlanId,
            startDate,
            endDate,
            priceOverride,
            minLOS,
            maxLOS,
            minOccupancy,
            maxOccupancy,
            closedToArrival,
            closedToDeparture,
            policy,
            mealPlan,
            isPublic,
            derivedFromRatePlanId
        } = await req.json();

        if (!ratePlanId || !startDate || !endDate) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const newRule = await prisma.rateRule.create({
            data: {
                ratePlanId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                priceOverride,
                minLOS,
                maxLOS,
                minOccupancy,
                maxOccupancy,
                closedToArrival: closedToArrival ?? false,
                closedToDeparture: closedToDeparture ?? false,
                policy,
                mealPlan,
                isPublic: isPublic ?? true,
                derivedFromRatePlanId
            }
        });

        // ✅ Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATE_RULE_CREATED", data: newRule }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(newRule), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create rate rule" }), { status: 500 });
    }
}
