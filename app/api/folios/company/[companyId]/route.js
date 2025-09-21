import prisma from "@/lib/prisma";

// 🟢 دالة مساعدة للبث
async function broadcast(event, data) {
    try {
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event, data }),
        });
    } catch (err) {
        console.error("Socket broadcast failed:", err);
    }
}

// GET: جلب كل Charges و Payments و Bookings للشركة
export async function GET(req, { params }) {
    const { companyId } = params;

    if (!companyId) {
        return new Response(JSON.stringify({ error: "companyId is required" }), { status: 400 });
    }

    try {
        const folios = await prisma.folio.findMany({
            where: {
                OR: [
                    { companyId },
                    { booking: { companyId } }
                ]
            },
            include: {
                charges: true,
                payments: true,
                booking: { include: { guest: true, room: true } }
            }
        });

        const allCharges = folios.flatMap(f => f.charges || []);
        const allPayments = folios.flatMap(f => f.payments || []);

        const bookings = await prisma.booking.findMany({
            where: { companyId },
            include: { guest: true, room: true }
        });

        return new Response(JSON.stringify({ charges: allCharges, payments: allPayments, bookings }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// POST: إضافة Charge جديد للفوليو
export async function POST(req, { params }) {
    const { companyId } = params;
    const body = await req.json();

    try {
        let folio = await prisma.folio.findFirst({ where: { companyId } });
        if (!folio) throw new Error("Folio not found");

        const charge = await prisma.charge.create({
            data: {
                folioId: folio.id,
                code: body.code,
                description: body.description,
                amount: body.amount,
                tax: body.tax || 0,
                guestId: body.guestId || null,
                postedById: body.postedById,
            },
        });

        // 🟢 بث
        await broadcast("COMPANY_CHARGE_CREATED", { companyId, charge });

        return new Response(JSON.stringify(charge), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: حذف Charge
export async function DELETE(req, { params }) {
    const { chargeId } = await req.json();

    try {
        await prisma.charge.delete({ where: { id: chargeId } });

        // 🟢 بث
        await broadcast("COMPANY_CHARGE_DELETED", { chargeId });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// PUT: إضافة Payment جديد
export async function PUT(req, { params }) {
    const { companyId } = params;
    const body = await req.json();

    try {
        let folio = await prisma.folio.findFirst({ where: { companyId } });
        if (!folio) throw new Error("Folio not found");

        const payment = await prisma.payment.create({
            data: {
                folioId: folio.id,
                method: body.method,
                amount: body.amount,
                ref: body.ref || "",
                guestId: body.guestId || null,
                postedById: body.postedById,
            },
        });

        // 🟢 بث
        await broadcast("COMPANY_PAYMENT_CREATED", { companyId, payment });

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// PATCH: حذف Payment
export async function PATCH(req, { params }) {
    const { paymentId } = await req.json();

    try {
        await prisma.payment.delete({ where: { id: paymentId } });

        // 🟢 بث
        await broadcast("COMPANY_PAYMENT_DELETED", { paymentId });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
