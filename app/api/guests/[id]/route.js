// app/api/guests/[id]/route.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function PUT(req, { params }) {
    try {
        const guestId = params.id;
        const { firstName, lastName, propertyId, hotelGroupId, phone, email, nationality, passportNumber, dateOfBirth } = await req.json();

        // ---- Validation ----
        if (!firstName || firstName.trim() === "") return new Response(JSON.stringify({ error: "First Name is required" }), { status: 400 });
        if (!lastName || lastName.trim() === "") return new Response(JSON.stringify({ error: "Last Name is required" }), { status: 400 });
        if (!propertyId) return new Response(JSON.stringify({ error: "Property is required" }), { status: 400 });

        // ---- Check if guest exists ----
        const existingGuest = await prisma.guest.findUnique({ where: { id: guestId } });
        if (!existingGuest) return new Response(JSON.stringify({ error: "Guest not found" }), { status: 404 });

        // ---- Update guest ----
        const updatedGuest = await prisma.guest.update({
            where: { id: guestId },
            data: {
                firstName,
                lastName,
                propertyId,
                hotelGroupId: hotelGroupId || null,
                phone: phone || null,
                email: email || null,
                nationality: nationality || null,
                passportNumber: passportNumber || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            },
            include: { property: true, hotelGroup: true },
        });

        // ---- Broadcast عالمي عبر السيرفر الخارجي ----
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GUEST_UPDATED", data: updatedGuest }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedGuest), { status: 200 });

    } catch (err) {
        console.error("Guest update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update guest" }), { status: 500 });
    }
}





export async function DELETE(req, { params }) {
    try {
        const { id } = params;

        // احذف النزيل
        const guest = await prisma.guest.delete({ where: { id } });

        // البث العالمي للنزيل المحذوف
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GUEST_DELETED", data: id }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Failed to delete guest:", err);
        return new Response(JSON.stringify({ error: "Failed to delete guest" }), { status: 500 });
    }
}

