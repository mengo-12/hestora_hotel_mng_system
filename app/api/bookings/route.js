import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                guest: true,
                room: true,
                ratePlan: true,
                company: true,
            },
            orderBy: { checkIn: "asc" },
        });
        return new Response(JSON.stringify(bookings), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch bookings:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch bookings" }), { status: 500 });
    }
}

export async function POST(req) {
    try {
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
            companyId
        } = await req.json();

        // ---- Validation ----
        if (!propertyId) return new Response(JSON.stringify({ error: "Property is required" }), { status: 400 });
        if (!guestId) return new Response(JSON.stringify({ error: "Guest is required" }), { status: 400 });
        if (!checkIn || !checkOut) return new Response(JSON.stringify({ error: "Check-in and Check-out dates are required" }), { status: 400 });

        // ---- Create Booking ----
        const booking = await prisma.booking.create({
            data: {
                propertyId,
                guestId,
                roomId: roomId || null,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                ratePlanId: ratePlanId || null,
                adults,
                children,
                specialRequests: specialRequests || null,
                companyId: companyId || null,
            },
            include: { guest: true, room: true, ratePlan: true, company: true },
        });

        // ---- Create initial Folio ----
        await prisma.folio.create({
            data: { bookingId: booking.id, guestId },
        });

        // ---- Broadcast عالمي عبر السيرفر الخارجي ----
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_CREATED", data: booking }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(booking), { status: 201 });

    } catch (err) {
        console.error("Booking creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500 });
    }
}
