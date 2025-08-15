// app/api/rooms/check-availability/route.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req) {
    try {
        const { roomId, checkIn, checkOut } = await req.json();

        if (!roomId || !checkIn || !checkOut) {
            return new Response(JSON.stringify({ available: false, error: "الرجاء تحديد الغرفة والتواريخ" }), { status: 400 });
        }

        const conflict = await prisma.booking.findFirst({
            where: {
                roomId,
                status: { not: 'CANCELLED' }, // تجاهل الحجوزات الملغية
                OR: [
                    {
                        checkIn: { lte: new Date(checkOut) },
                        checkOut: { gte: new Date(checkIn) },
                    },
                ],
            },
        });

        if (conflict) {
            return new Response(JSON.stringify({ available: false, message: "الغرفة محجوزة مسبقًا في هذه الفترة" }), { status: 200 });
        }

        return new Response(JSON.stringify({ available: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ available: false, error: err.message }), { status: 500 });
    }
}
