import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    const id = params.id; // id كسلسلة

    try {
        const { propertyId, number, roomTypeId, status, floor, notes, changedById } = await req.json();

        if (!propertyId) return new Response(JSON.stringify({ error: "Property is required" }), { status: 400 });
        if (!roomTypeId) return new Response(JSON.stringify({ error: "Room Type is required" }), { status: 400 });
        if (!number || number.trim() === "") return new Response(JSON.stringify({ error: "Room Number is required" }), { status: 400 });
        if (floor && isNaN(Number(floor))) return new Response(JSON.stringify({ error: "Floor must be a number" }), { status: 400 });
        if (notes && notes.length > 250) return new Response(JSON.stringify({ error: "Notes cannot exceed 250 characters" }), { status: 400 });

        const exists = await prisma.room.findFirst({
            where: { propertyId, number, NOT: { id } }
        });
        if (exists) return new Response(JSON.stringify({ error: "Room number already exists in this property" }), { status: 400 });

        const oldRoom = await prisma.room.findUnique({ where: { id } });
        if (!oldRoom) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });

        const updatedRoom = await prisma.room.update({
            where: { id },
            data: {
                propertyId,
                number,
                roomTypeId,
                status: status || oldRoom.status,
                floor: floor !== undefined ? Number(floor) : oldRoom.floor,
                notes: notes !== undefined ? notes : oldRoom.notes
            },
            include: { roomType: true, property: true }
        });

        if (status && status !== oldRoom.status && changedById) {
            await prisma.roomStatusLog.create({
                data: {
                    roomId: updatedRoom.id,
                    oldStatus: oldRoom.status,
                    newStatus: updatedRoom.status,
                    changedById
                }
            });
        }

        // بث التغييرات إلى جميع العملاء عبر السيرفر الخارجي
        try {
            // بث تحديث شامل
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "ROOM_UPDATED",
                    data: updatedRoom,
                }),
            });

            // بث مخصص لتغيير حالة الغرفة فقط
            if (status && status !== oldRoom.status) {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: "ROOM_STATUS_CHANGED",
                        data: { roomId: updatedRoom.id, newStatus: updatedRoom.status },
                    }),
                });
            }
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedRoom), { status: 200 });


    } catch (err) {
        console.error("Room update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update room" }), { status: 500 });
    }
}





export async function DELETE(req, { params }) {
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: "Room ID is required" }), { status: 400 });
    }

    try {
        const room = await prisma.room.findUnique({ where: { id } });
        if (!room) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });

        await prisma.room.delete({ where: { id } });

        // أرسل للسيرفر الخارجي Socket.io عبر HTTP
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "ROOM_DELETED", data: id }),
        });

        return new Response(JSON.stringify({ message: "Room deleted", id }), { status: 200 });
    } catch (err) {
        console.error("Room deletion failed:", err);
        return new Response(JSON.stringify({ error: "Failed to delete room" }), { status: 500 });
    }
}
