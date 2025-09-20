import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { groupId } = params;

        // جلب كل الحجوزات ضمن المجموعة
        const bookings = await prisma.booking.findMany({
            where: { groupId },
            include: { 
                guest: true, 
                room: true,
                folio: { include: { charges: true, payments: true } }
            }
        });

        // جمع كل الفواتير الموجودة ضمن هذه الحجوزات
        let folios = bookings
            .map(b => b.folio)
            .filter(f => f !== null);

        // إذا لم يوجد folio لأي حجز، يمكن إنشاء folio يمثل المجموعة
        if (folios.length === 0 && bookings.length > 0) {
            const folio = await prisma.folio.create({
                data: {
                    bookingId: bookings[0].id, // أول حجز كممثل
                    status: "Open"
                },
                include: { charges: true, payments: true, booking: { include: { guest: true, room: true } } }
            });
            folios = [folio];
        }

        return new Response(JSON.stringify(folios), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch group folios:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch folios" }), { status: 500 });
    }
}
