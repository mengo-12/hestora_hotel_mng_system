import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req, { params }) {
    try {
        const { id } = params;
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { guest: true, room: true, ratePlan: true, company: true },
        });

        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch booking:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch booking" }), { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const {
            propertyId,
            guestId,
            roomId,
            checkIn,
            checkOut,
            ratePlanId,
            adults,
            children,
            specialRequests,
            companyId,
            status
        } = await req.json();

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                propertyId,
                guestId,
                roomId: roomId || null,
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined,
                ratePlanId: ratePlanId || null,
                adults,
                children,
                specialRequests: specialRequests || null,
                companyId: companyId || null,
                status: status || undefined,
            },
            include: { guest: true, room: true, ratePlan: true, company: true },
        });

        // ---- Broadcast عالمي ----
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_UPDATED", data: booking }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (err) {
        console.error("Booking update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update booking" }), { status: 500 });
    }
}



export async function DELETE(req, context) {
    try {
        const id = context.params.id;

        // ✅ حذف أي سجلات مرتبطة (إن لم يكن عندك onDelete Cascade)
        await prisma.folio.deleteMany({ where: { bookingId: id } });

        // ✅ حذف الحجز نفسه
        await prisma.booking.delete({ where: { id } });

        // ✅ إرسال Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_DELETED", data: { id } }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Booking delete failed:", err);
        return new Response(JSON.stringify({ error: "Failed to delete booking" }), { status: 500 });
    }
}

