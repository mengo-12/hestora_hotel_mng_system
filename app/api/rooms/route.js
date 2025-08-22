// app/api/rooms/route.js
import prisma from "@/lib/prisma";
import { io } from "@/lib/socket"; // Socket.io server instance

export async function GET() {
    const rooms = await prisma.room.findMany({ include: { roomType: true } });
    return new Response(JSON.stringify(rooms), { status: 200 });
}

export async function POST(req) {
    const data = await req.json();
    const room = await prisma.room.create({ data });
    io.emit("ROOM_CREATED", room);
    return new Response(JSON.stringify(room), { status: 201 });
}
