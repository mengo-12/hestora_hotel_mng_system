import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
    try {
        // جلب كل الغرف مع آخر حجز (إن وجد) حالة الحجز
        const rooms = await prisma.room.findMany({
            include: {
                bookings: {
                    where: {
                        // حجز حاليا فعال (اليوم بين checkInDate و checkOutDate)
                        checkInDate: { lte: new Date() },
                        checkOutDate: { gte: new Date() },
                        status: { in: ["CONFIRMED", "PENDING"] }, // مؤجرة أو محجوزة
                    },
                    orderBy: { checkInDate: "desc" },
                    take: 1,
                    include: { guest: true },
                },
            },
        });

        const data = rooms.map(room => {
            const booking = room.bookings[0];

            let status = "AVAILABLE";
            if (booking) {
                status = booking.status === "PENDING" ? "BOOKED" : "OCCUPIED";
            }

            return {
                id: room.id,
                roomNumber: room.roomNumber,
                status,
                guestName: booking ? `${booking.guest.firstName} ${booking.guest.lastName}` : null,
            };
        });

        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Failed to fetch rooms status" }), { status: 500 });
    }
}
