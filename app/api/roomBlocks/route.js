import prisma from "@/lib/prisma";

// ✅ Get all RoomBlocks
export async function GET(req) {
    try {
        const roomBlocks = await prisma.roomBlock.findMany({
            include: {
                group: { select: { id: true, name: true, code: true } },
                roomType: { select: { id: true, name: true } },
                property: { select: { id: true, name: true } },
            },
            orderBy: { blockDate: "asc" },
        });

        return new Response(JSON.stringify(roomBlocks), { status: 200 });
    } catch (err) {
        console.error("GET RoomBlocks error:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch RoomBlocks" }), { status: 500 });
    }
}

// ✅ Create new RoomBlock + broadcast
export async function POST(req) {
    try {
        const body = await req.json();
        const { groupId, roomTypeId, propertyId, blockDate, roomsBlocked } = body;

        if (!groupId || !roomTypeId || !propertyId || !blockDate || !roomsBlocked) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const newRoomBlock = await prisma.roomBlock.create({
            data: {
                groupId,
                roomTypeId,
                propertyId,
                blockDate: new Date(blockDate),
                roomsBlocked,
            },
            include: {
                group: true,
                roomType: true,
                property: true,
            },
        });

        // 📢 بث الحدث عبر socket
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "ROOMBLOCK_CREATED", data: newRoomBlock }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(newRoomBlock), { status: 201 });
    } catch (err) {
        console.error("POST RoomBlock error:", err);
        return new Response(JSON.stringify({ error: "Failed to create RoomBlock" }), { status: 500 });
    }
}
