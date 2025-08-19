import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const bookings = await prisma.booking.findMany({
            where: {
                checkIn: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                guest: true,  // ✅ جلب بيانات الضيف
                room: true,   // ✅ جلب بيانات الغرفة
            },
            orderBy: { checkIn: 'asc' },
        });

        // تجهيز البيانات بشكل مبسط
        const result = bookings.map(b => ({
            id: b.id,
            guestName: b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : '—',
            roomNumber: b.room?.roomNumber || '—',
            checkIn: b.checkIn,
            checkOut: b.checkOut,
        }));

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
