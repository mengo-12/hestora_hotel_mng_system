import prisma from "@/lib/prisma";
import { io } from "@/lib/socket";

export async function POST(req, { params }) {
    const { id } = params;
    const { newStatus, changedById } = await req.json();

    const oldRoom = await prisma.room.findUnique({ where: { id } });

    const room = await prisma.room.update({
        where: { id },
        data: { status: newStatus }
    });

    await prisma.roomStatusLog.create({
        data: {
            roomId: id,
            oldStatus: oldRoom.status,
            newStatus,
            changedById
        }
    });

    io.emit("ROOM_STATUS_CHANGED", { roomId: id, newStatus });
    return new Response(JSON.stringify(room), { status: 200 });
}
