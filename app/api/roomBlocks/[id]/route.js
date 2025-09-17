import prisma from "@/lib/prisma";

// ✅ Get single RoomBlock
export async function GET(req, { params }) {
    try {
        const roomBlock = await prisma.roomBlock.findUnique({
            where: { id: params.id },
            include: {
                group: true,
                roomType: true,
                property: true,
            },
        });

        if (!roomBlock) {
            return new Response(JSON.stringify({ error: "RoomBlock not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(roomBlock), { status: 200 });
    } catch (err) {
        console.error("GET RoomBlock error:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch RoomBlock" }), { status: 500 });
    }
}

// ✅ Update RoomBlock + broadcast
export async function PUT(req, { params }) {
    try {
        const body = await req.json();
        const { groupId, roomTypeId, propertyId, blockDate, roomsBlocked, roomsPicked } = body;

        const updatedRoomBlock = await prisma.roomBlock.update({
            where: { id: params.id },
            data: {
                groupId,
                roomTypeId,
                propertyId,
                blockDate: blockDate ? new Date(blockDate) : undefined,
                roomsBlocked,
                roomsPicked,
            },
            include: {
                group: true,
                roomType: true,
                property: true,
            },
        });

        // 📢 بث الحدث
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "ROOMBLOCK_UPDATED", data: updatedRoomBlock }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedRoomBlock), { status: 200 });
    } catch (err) {
        console.error("PUT RoomBlock error:", err);
        return new Response(JSON.stringify({ error: "Failed to update RoomBlock" }), { status: 500 });
    }
}

// ✅ Delete RoomBlock + broadcast
export async function DELETE(req, { params }) {
    try {
        const deletedRoomBlock = await prisma.roomBlock.delete({
            where: { id: params.id },
        });

        // 📢 بث الحدث
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "ROOMBLOCK_DELETED", data: deletedRoomBlock }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ message: "RoomBlock deleted" }), { status: 200 });
    } catch (err) {
        console.error("DELETE RoomBlock error:", err);
        return new Response(JSON.stringify({ error: "Failed to delete RoomBlock" }), { status: 500 });
    }
}
