// app/api/rates/[roomTypeId]/route.js
export async function GET(req, { params }) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const rates = await prisma.rateRule.findMany({
        where: { ratePlan: { roomTypeId: params.roomTypeId }, date: { gte: new Date(from), lte: new Date(to) } },
    });

    return new Response(JSON.stringify(rates), { status: 200 });
}

export async function PUT_rules(req, { params }) {
    const data = await req.json();
    const rules = await prisma.rateRule.updateMany({ where: { ratePlanId: params.ratePlanId }, data });
    io.emit("RATE_CHANGED", { ratePlanId: params.ratePlanId, rules });
    return new Response(JSON.stringify(rules), { status: 200 });
}
