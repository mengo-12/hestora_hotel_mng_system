import prisma from "@/lib/prisma";
import { io } from "@/lib/socket";

export async function POST(req, { params }) {
    const booking = await prisma.booking.update({ where: { id: params.id }, data: { status: "CheckedOut" } });
    io.emit("BOOKING_CHECKOUT", booking);
    return new Response(JSON.stringify(booking), { status: 200 });
}
