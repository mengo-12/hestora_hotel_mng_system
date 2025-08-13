// app/api/dashboard/alerts/route.js
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

export async function GET(req) {
    try {
        await requireAuth(req);

        const cleaningNeeded = await prisma.room.findMany({
            where: { needsCleaning: true },
            select: { roomNumber: true },
        });

        const upcomingBookings = await prisma.booking.findMany({
            where: {
                checkIn: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 60 * 60 * 1000), // خلال ساعة
                },
            },
            include: { guest: true, room: true },
        });

        return new Response(
            JSON.stringify({
                cleaningNeeded,
                upcomingBookings: upcomingBookings.map(b => ({
                    guestName: b.guest?.name,
                    roomNumber: b.room?.roomNumber,
                    checkIn: b.checkIn,
                })),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
}
