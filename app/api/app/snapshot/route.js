// app/api/app/snapshot/route.js
import prisma from "@/lib/prisma";

export async function GET() {
    const rooms = await prisma.room.findMany({ include: { roomType: true } });
    const bookings = await prisma.booking.findMany({ include: { guest: true, room: true } });
    const housekeepingTasks = await prisma.housekeepingTask.findMany({ include: { room: true, assignedTo: true } });

    return new Response(JSON.stringify({ rooms, bookings, housekeepingTasks }), { status: 200 });
}
