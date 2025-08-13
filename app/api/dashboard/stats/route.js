import prisma from '../../../../lib/prisma';

export async function GET() {
    try {
        const availableRooms = await prisma.room.count({
            where: { status: 'AVAILABLE' },
        });

        const occupiedRooms = await prisma.room.count({
            where: { status: 'OCCUPIED' },
        });

        const maintenanceRooms = await prisma.room.count({
            where: { status: 'MAINTENANCE' },
        });

        // عد الحجوزات لليوم (تعديل حسب جدول الحجز لديك)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysBookings = await prisma.booking.count({
            where: {
                checkIn: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        return new Response(
            JSON.stringify({
                availableRooms,
                occupiedRooms,
                maintenanceRooms,
                todaysBookings,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: 'Failed to load stats' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
