import prisma from "@/lib/prisma";

// GET: جلب الفواتير + المجاميع
export async function GET(req, { params }) {
    try {
        const { groupId } = params;

        const bookings = await prisma.booking.findMany({
            where: { groupId },
            include: {
                guest: true,
                room: true,
                folio: {
                    include: {
                        charges: true,
                        payments: true,
                        booking: { include: { guest: true, room: true } }
                    }
                }
            }
        });

        let folios = bookings
            .map(b => b.folio)
            .filter(f => f != null)
            .map(f => {
                if (!f.booking && f.bookingId) {
                    const bookingData = bookings.find(b => b.id === f.bookingId);
                    if (bookingData) f.booking = bookingData;
                }
                return f;
            });

        if (folios.length === 0 && bookings.length > 0) {
            const folio = await prisma.folio.create({
                data: { bookingId: bookings[0].id, status: "Open" },
                include: { charges: true, payments: true, booking: { include: { guest: true, room: true } } }
            });
            folios = [folio];
        }

        // حساب totals على مستوى المجموعة
        const allCharges = folios.flatMap(f => f.charges || []);
        const allPayments = folios.flatMap(f => f.payments || []);
        const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
        const totalCharges = subtotal + taxTotal;
        const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const balance = totalCharges - totalPayments;

        return new Response(JSON.stringify({
            folios,
            groupTotals: { subtotal, taxTotal, totalCharges, totalPayments, balance },
            bookings
        }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch folios" }), { status: 500 });
    }
}

// POST: إضافة Charge
export async function POST(req, { params }) {
    const { groupId } = params;
    const body = await req.json();

    try {
        let booking = await prisma.booking.findFirst({ where: { groupId } });
        if (!booking) throw new Error("Booking not found for this group");

        let folio = await prisma.folio.findFirst({ where: { bookingId: booking.id } });
        if (!folio) {
            folio = await prisma.folio.create({ data: { bookingId: booking.id, status: "Open" } });
        }

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

        // بث التحديث
        if (globalThis.io) {
            globalThis.io.emit("groupFolioUpdated", { groupId, type: "chargeAdded", charge });
        }

        return new Response(JSON.stringify(charge), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: حذف Charge
export async function DELETE(req, { params }) {
    const { groupId } = params;
    const { chargeId } = await req.json();

    try {
        await prisma.charge.delete({ where: { id: chargeId } });

        // بث التحديث
        if (globalThis.io) {
            globalThis.io.emit("groupFolioUpdated", { groupId, type: "chargeDeleted", chargeId });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// PUT: إضافة Payment
export async function PUT(req, { params }) {
    const { groupId } = params;
    const body = await req.json();

    try {
        let booking = await prisma.booking.findFirst({ where: { groupId } });
        if (!booking) throw new Error("Booking not found for this group");

        let folio = await prisma.folio.findFirst({ where: { bookingId: booking.id } });
        if (!folio) {
            folio = await prisma.folio.create({ data: { bookingId: booking.id, status: "Open" } });
        }

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

        // بث التحديث
        if (globalThis.io) {
            globalThis.io.emit("groupFolioUpdated", { groupId, type: "paymentAdded", payment });
        }

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// PATCH: حذف Payment
export async function PATCH(req, { params }) {
    const { groupId } = params;
    const { paymentId } = await req.json();

    try {
        await prisma.payment.delete({ where: { id: paymentId } });

        // بث التحديث
        if (globalThis.io) {
            globalThis.io.emit("groupFolioUpdated", { groupId, type: "paymentDeleted", paymentId });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
