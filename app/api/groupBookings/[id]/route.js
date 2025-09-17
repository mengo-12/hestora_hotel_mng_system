import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    const { id } = await params; // ✅ params لازم await

    try {
        const body = await req.json();

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                group: body.groupId ? { connect: { id: body.groupId } } : undefined,
                property: body.propertyId ? { connect: { id: body.propertyId } } : undefined,
                room: body.roomId ? { connect: { id: body.roomId } } : undefined,       // ✅ room بدل roomType
                ratePlan: body.ratePlanId ? { connect: { id: body.ratePlanId } } : undefined, // ✅ موجودة في schema

                checkIn: body.checkIn ? new Date(body.checkIn) : null,
                checkOut: body.checkOut ? new Date(body.checkOut) : null,
                adults: body.adults ?? 1,
                children: body.children ?? 0,
                specialRequests: body.specialRequests || "",
            },
            include: {
                group: true,
                property: true,
                guest: true,
                room: true,       // ✅ room بدل roomType
                ratePlan: true,
                folio: true,
                company: true,
                extras: true,
            },
        });

        // 📢 بث
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUPBOOKING_UPDATED", data: updatedBooking }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });
    } catch (err) {
        console.error("Update group booking failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params; // ✅ params لازم await

    try {
        await prisma.booking.delete({ where: { id } });

        // 📢 بث
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUPBOOKING_DELETED", data: { id } }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ message: "Booking deleted" }), { status: 200 });
    } catch (err) {
        console.error("Delete group booking failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}