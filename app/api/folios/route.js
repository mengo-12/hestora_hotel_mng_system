import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    const { bookingId } = params;

    if (!bookingId) {
        return new Response(JSON.stringify({ error: "bookingId is required" }), { status: 400 });
    }

    try {
        // جلب الحجز أو group مع الفواتير
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                guest: true,
                company: true,
                room: true,
                property: true,
                ratePlan: true,
                folio: {
                    include: {
                        charges: true,
                        payments: true,
                        extras: true
                    }
                },
                extras: true // Extras مرتبطة بالحجز مباشرة
            }
        });

        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        // إذا Folio غير موجود، ننشئ هيكل فارغ لتجنب مشاكل العرض
        const folioData = {
            ...booking,
            charges: booking.folio?.charges || [],
            payments: booking.folio?.payments || [],
            extras: booking.folio?.extras?.length > 0 ? booking.folio.extras : booking.extras || [],
        };

        return new Response(JSON.stringify(folioData), { status: 200 });

    } catch (err) {
        console.error("Failed to fetch folio:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
    }
}


