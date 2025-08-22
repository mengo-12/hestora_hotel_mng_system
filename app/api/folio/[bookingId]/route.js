// app/api/folios/[bookingId]/route.js
export async function GET(req, { params }) {
    const folio = await prisma.folio.findUnique({ where: { bookingId: params.bookingId }, include: { charges: true, payments: true } });
    return new Response(JSON.stringify(folio), { status: 200 });
}

// Charges
export async function POST_charge(req, { params }) {
    const data = await req.json();
    const charge = await prisma.charge.create({ data });
    io.emit("FOLIO_POSTED", { bookingId: params.bookingId, charge });
    return new Response(JSON.stringify(charge), { status: 201 });
}

// Payments
export async function POST_payment(req, { params }) {
    const data = await req.json();
    const payment = await prisma.payment.create({ data });
    io.emit("FOLIO_POSTED", { bookingId: params.bookingId, payment });
    return new Response(JSON.stringify(payment), { status: 201 });
}
