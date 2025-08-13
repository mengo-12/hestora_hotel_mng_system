// app/api/dashboard/todays-bookings/route.js
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await prisma.booking.findMany({
            where: { checkIn: { gte: today } },
            include: {
                guest: true,
                room: true,
            },
            orderBy: { checkIn: "asc" },
        });

        const formatted = bookings.map(b => ({
            guestName: b.guest?.name,
            roomNumber: b.room?.roomNumber,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
        }));

        return new Response(JSON.stringify(formatted), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
}
