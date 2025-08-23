// app/api/guests/route.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const guests = await prisma.guest.findMany({
            include: { property: true, hotelGroup: true },
        });
        return new Response(JSON.stringify(guests), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch guests:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch guests" }), { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { firstName, lastName, propertyId, hotelGroupId, phone, email, nationality, passportNumber, dateOfBirth } = await req.json();

        // ---- Validation ----
        if (!firstName || firstName.trim() === "") return new Response(JSON.stringify({ error: "First Name is required" }), { status: 400 });
        if (!lastName || lastName.trim() === "") return new Response(JSON.stringify({ error: "Last Name is required" }), { status: 400 });
        if (!propertyId) return new Response(JSON.stringify({ error: "Property is required" }), { status: 400 });

        // ---- Optional: check duplicate guest by email in same property ----
        if (email) {
            const exists = await prisma.guest.findFirst({ where: { propertyId, email } });
            if (exists) return new Response(JSON.stringify({ error: "Guest with this email already exists in this property" }), { status: 400 });
        }

        // ---- Create Guest ----
        const guest = await prisma.guest.create({
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
                body: JSON.stringify({ event: "GUEST_CREATED", data: guest }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(guest), { status: 201 });

    } catch (err) {
        console.error("Guest creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create guest" }), { status: 500 });
    }
}
