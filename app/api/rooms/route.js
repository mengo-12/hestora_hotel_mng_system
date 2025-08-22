// app/api/rooms/route.js
import prisma from "@/lib/prisma";
import { io } from "@/lib/socket"; // Socket.io server instance

export async function GET() {
    const rooms = await prisma.room.findMany({
        include: { roomType: true, property: true }
    });
    return new Response(JSON.stringify(rooms), { status: 200 });
}

export async function POST(req) {
    try {
        const { propertyId, number, roomTypeId, status, floor, notes, createdById } = await req.json();

        // ---- Validation ----
        if (!propertyId) return new Response(JSON.stringify({ error: "Property is required" }), { status: 400 });
        if (!roomTypeId) return new Response(JSON.stringify({ error: "Room Type is required" }), { status: 400 });
        if (!number || number.trim() === "") return new Response(JSON.stringify({ error: "Room Number is required" }), { status: 400 });
        if (floor && isNaN(Number(floor))) return new Response(JSON.stringify({ error: "Floor must be a number" }), { status: 400 });
        if (notes && notes.length > 250) return new Response(JSON.stringify({ error: "Notes cannot exceed 250 characters" }), { status: 400 });

        // ---- Check duplicate room number in same property ----
        const exists = await prisma.room.findFirst({ where: { propertyId, number } });
        if (exists) return new Response(JSON.stringify({ error: "Room number already exists in this property" }), { status: 400 });

        // ---- Create Room ----
        const room = await prisma.room.create({
            data: {
                propertyId,
                number,
                roomTypeId,
                status: status || "VACANT",
                floor: floor ? Number(floor) : null,
                notes: notes || null
            },
            include: { roomType: true, property: true }
        });

        // ---- Create initial RoomStatusLog ----
        if (createdById) {
            await prisma.roomStatusLog.create({
                data: {
                    roomId: room.id,
                    oldStatus: null,
                    newStatus: room.status,
                    changedById: createdById
                }
            });
        }

        // ---- Emit Socket Event ----
        io.emit("ROOM_CREATED", room);

        return new Response(JSON.stringify(room), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
