import prisma from "@/lib/prisma";
import { io } from "@/lib/socket";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where = {};
    if (from && to) where.checkIn = { gte: new Date(from), lte: new Date(to) };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({ where, include: { guest: true, room: true, ratePlan: true } });
    return new Response(JSON.stringify(bookings), { status: 200 });
}

export async function POST(req) {
    const data = await req.json();
    const booking = await prisma.booking.create({ data });
    io.emit("BOOKING_CREATED", booking);
    return new Response(JSON.stringify(booking), { status: 201 });
}
