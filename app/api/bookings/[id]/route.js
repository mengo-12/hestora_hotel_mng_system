import prisma from "@/lib/prisma";
import { io } from "@/lib/socket";

export async function PUT(req, { params }) {
    const data = await req.json();
    const booking = await prisma.booking.update({ where: { id: params.id }, data });
    io.emit("BOOKING_UPDATED", booking);
    return new Response(JSON.stringify(booking), { status: 200 });
}

export async function DELETE(req, { params }) {
    await prisma.booking.delete({ where: { id: params.id } });
    io.emit("BOOKING_DELETED", { id: params.id });
    return new Response(null, { status: 204 });
}
