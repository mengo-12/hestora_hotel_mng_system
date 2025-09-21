// import prisma from "@/lib/prisma";

// // GET: جلب كل Charges و Payments و Bookings للشركة
// export async function GET(req) {
//     try {
//         const { pathname } = req.nextUrl;
//         const companyId = pathname.split("/").pop();

//         if (!companyId) {
//             return new Response(JSON.stringify({ error: "companyId is required" }), { status: 400 });
//         }

//         // جلب جميع الفوليوهات المرتبطة مباشرة بالشركة أو المرتبطة بالحجوزات التابعة للشركة
//         const folios = await prisma.folio.findMany({
//             where: {
//                 OR: [
//                     { companyId },
//                     { booking: { companyId } }
//                 ]
//             },
//             include: {
//                 charges: { include: { postedBy: true } },
//                 payments: { include: { postedBy: true } },
//                 booking: { include: { guest: true, room: true } }
//             }
//         });

//         // دمج جميع Charges و Payments
//         const allCharges = folios.flatMap(f => f.charges || []);
//         const allPayments = folios.flatMap(f => f.payments || []);

//         // جلب جميع الحجوزات التابعة للشركة
//         const bookings = await prisma.booking.findMany({
//             where: { companyId },
//             include: { guest: true, room: true }
//         });

//         return new Response(JSON.stringify({ charges: allCharges, payments: allPayments, bookings }), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // POST: إضافة Charge جديد للفوليو
// export async function POST(req, { params }) {
//     const { companyId } = params;
//     const body = await req.json();

//     try {
//         let folio = await prisma.folio.findFirst({ where: { companyId } });
//         if (!folio) throw new Error("Folio not found");

//         const charge = await prisma.charge.create({
//             data: {
//                 folioId: folio.id,
//                 code: body.code,
//                 description: body.description,
//                 amount: body.amount,
//                 tax: body.tax || 0,
//                 guestId: body.guestId || null,
//                 postedById: body.postedById,
//             },
//         });

//         return new Response(JSON.stringify(charge), { status: 201 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // DELETE: حذف Charge
// export async function DELETE(req, { params }) {
//     const { companyId } = params;
//     const { chargeId } = await req.json();

//     try {
//         let folio = await prisma.folio.findFirst({ where: { companyId } });
//         if (!folio) throw new Error("Folio not found");

//         await prisma.charge.delete({ where: { id: chargeId } });

//         return new Response(JSON.stringify({ success: true }), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // PUT: إضافة Payment جديد
// export async function PUT(req, { params }) {
//     const { companyId } = params;
//     const body = await req.json();

//     try {
//         let folio = await prisma.folio.findFirst({ where: { companyId } });
//         if (!folio) throw new Error("Folio not found");

//         const payment = await prisma.payment.create({
//             data: {
//                 folioId: folio.id,
//                 method: body.method,
//                 amount: body.amount,
//                 ref: body.ref || "",
//                 guestId: body.guestId || null,
//                 postedById: body.postedById,
//             },
//         });

//         return new Response(JSON.stringify(payment), { status: 201 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // PATCH: حذف Payment
// export async function PATCH(req, { params }) {
//     const { companyId } = params;
//     const { paymentId } = await req.json();

//     try {
//         let folio = await prisma.folio.findFirst({ where: { companyId } });
//         if (!folio) throw new Error("Folio not found");

//         await prisma.payment.delete({ where: { id: paymentId } });

//         return new Response(JSON.stringify({ success: true }), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }

// // POST /close: غلق/إعادة فتح الفوليو
// export async function POST_CLOSE(req, { params }) {
//     const { companyId } = params;

//     try {
//         let folio = await prisma.folio.findFirst({ where: { companyId } });
//         if (!folio) throw new Error("Folio not found");

//         const updated = await prisma.folio.update({
//             where: { id: folio.id },
//             data: { isClosed: !folio.isClosed },
//         });

//         return new Response(JSON.stringify(updated), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }




// الكود الاعلى اصلي




import prisma from "@/lib/prisma";

// GET: جلب كل Charges و Payments و Bookings للشركة
export async function GET(req, { params }) {
    const { companyId } = params;

    if (!companyId) {
        return new Response(JSON.stringify({ error: "companyId is required" }), { status: 400 });
    }

    try {
        // جلب جميع الفوليوهات المرتبطة مباشرة بالشركة أو المرتبطة بالحجوزات التابعة للشركة
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

        // دمج جميع Charges و Payments
        const allCharges = folios.flatMap(f => f.charges || []);
        const allPayments = folios.flatMap(f => f.payments || []);

        // جلب جميع الحجوزات التابعة للشركة
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

        return new Response(JSON.stringify(charge), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// DELETE: حذف Charge
export async function DELETE(req, { params }) {
    const { companyId } = params;
    const { chargeId } = await req.json();

    try {
        await prisma.charge.delete({ where: { id: chargeId } });
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

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// PATCH: حذف Payment
export async function PATCH(req, { params }) {
    const { companyId } = params;
    const { paymentId } = await req.json();

    try {
        await prisma.payment.delete({ where: { id: paymentId } });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
