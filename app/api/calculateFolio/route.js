import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const data = await req.json();
        const { bookingId, roomRate, nights, services = [], taxPercent = 0 } = data;

        if (!bookingId || !roomRate || !nights) {
            return new Response(JSON.stringify({ error: "BookingId, roomRate and nights are required" }), { status: 400 });
        }

        // حساب subtotal
        const roomTotal = Number(roomRate) * Number(nights);
        const servicesTotal = (services || []).reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const subtotal = roomTotal + servicesTotal;

        // حساب الضرائب
        const taxTotal = subtotal * (Number(taxPercent) / 100);

        // المجموع النهائي
        const totalCharges = subtotal + taxTotal;

        // إنشاء أو تحديث الفاتورة في قاعدة البيانات
        let folio = await prisma.folio.findUnique({ where: { bookingId } });
        if (folio) {
            folio = await prisma.folio.update({
                where: { bookingId },
                data: {
                    subtotal,
                    taxTotal,
                    totalCharges,
                    roomRate,
                    nights,
                    taxPercent,
                    services: {
                        deleteMany: {},
                        create: services.map(s => ({ description: s.description, amount: s.amount })),
                    },
                },
            });
        } else {
            folio = await prisma.folio.create({
                data: {
                    bookingId,
                    subtotal,
                    taxTotal,
                    totalCharges,
                    roomRate,
                    nights,
                    taxPercent,
                    services: { create: services.map(s => ({ description: s.description, amount: s.amount })) },
                },
            });
        }

        return new Response(JSON.stringify(folio), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
