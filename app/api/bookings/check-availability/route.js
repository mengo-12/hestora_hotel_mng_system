import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const { propertyId, roomTypeId, checkInDate, checkOutDate } = await req.json();

        if (!propertyId || !roomTypeId || !checkInDate || !checkOutDate) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // جلب الغرف من النوع المطلوب في الفندق
        const rooms = await prisma.room.findMany({
            where: { propertyId: Number(propertyId), roomTypeId: Number(roomTypeId) },
        });

        if (rooms.length === 0) {
            return new Response(JSON.stringify({ available: false, reason: "No rooms of this type" }), { status: 404 });
        }

        // جلب الحجوزات المتداخلة (overlapping bookings)
        const overlappingBookings = await prisma.booking.findMany({
            where: {
                room: { propertyId: Number(propertyId), roomTypeId: Number(roomTypeId) },
                status: { in: ["Reserved", "InHouse"] },
                AND: [
                    { checkInDate: { lte: new Date(checkOutDate) } },
                    { checkOutDate: { gte: new Date(checkInDate) } }
                ]
            },
            include: { room: true }
        });

        // الغرف المشغولة
        const occupiedRoomIds = overlappingBookings.map(b => b.roomId);

        // الغرف المتاحة
        const availableRooms = rooms.filter(r => !occupiedRoomIds.includes(r.id));

        const result = {
            available: availableRooms.length > 0,
            totalRooms: rooms.length,
            availableRooms: availableRooms.map(r => ({ id: r.id, number: r.number })),
        };

        // --- بث عالمي للسيرفر الخارجي ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "ROOM_AVAILABILITY_CHECKED", data: result }),
            });
        } catch (err) {
            console.error("Broadcast failed:", err);
        }

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err) {
        console.error("Availability check failed:", err);
        return new Response(JSON.stringify({ error: "Availability check failed" }), { status: 500 });
    }
}
