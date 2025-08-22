import prisma from "@/lib/prisma";

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
