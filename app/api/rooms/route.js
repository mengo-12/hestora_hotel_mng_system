import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function GET(req) {
    try {
        // جلب الغرف مع نوع الغرفة والحجز الجاري
        const rooms = await prisma.room.findMany({
            include: {
                roomType: true,
                bookings: {
                    where: {
                        status: "Booked",
                        checkIn: { lte: new Date() },
                        checkOut: { gte: new Date() },
                    },
                    take: 1, // لو تريد آخر حجز جاري فقط
                },
            },
        });

        return new Response(JSON.stringify(rooms), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch rooms:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch rooms" }), { status: 500 });
    }
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

        // ---- Broadcast عالمي عبر السيرفر الخارجي ----
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "ROOM_CREATED", data: room }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(room), { status: 201 });

    } catch (err) {
        console.error("Room creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create room" }), { status: 500 });
    }
}