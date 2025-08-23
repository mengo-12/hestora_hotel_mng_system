import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: { guest: true, room: true }
        });

        if (!booking) {
            return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });
        }

        if (booking.status !== "RESERVED") {
            return new Response(JSON.stringify({ error: "Only reserved bookings can be marked as NoShow" }), { status: 400 });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: { status: "NOSHOW" },
            include: { guest: true, room: true }
        });

        // إذا كان مرتبط بغرفة → نرجع الغرفة VACANT
        if (booking.roomId) {
            await prisma.room.update({
                where: { id: booking.roomId },
                data: { status: "VACANT" }
            });
        }

        // --- Global Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_STATUS_CHANGED", data: updatedBooking }),
            });

            if (booking.roomId) {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: "ROOM_STATUS_CHANGED",
                        data: { roomId: booking.roomId, newStatus: "VACANT" }
                    }),
                });
            }
        } catch (err) {
            console.error("Broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });
    } catch (err) {
        console.error("NoShow failed:", err);
        return new Response(JSON.stringify({ error: "NoShow failed" }), { status: 500 });
    }
}
