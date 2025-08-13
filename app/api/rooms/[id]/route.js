// app/api/rooms/[id]/route.js
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) {
        throw new Error("UNAUTHORIZED");
    }
    return token;
}

// ✅ جلب غرفة واحدة
export async function GET(req, { params }) {
    try {
        await requireAuth(req);

        const { id } = params;
        const room = await prisma.room.findUnique({ where: { id } });

        if (!room) {
            return new Response(
                JSON.stringify({ error: "Room not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify(room),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err.message || "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
}

// ✅ تعديل بيانات الغرفة
export async function PUT(req, { params }) {
    try {
        await requireAuth(req);

        const { id } = params;
        const body = await req.json();
        const updateData = {};

        if (body.roomNumber !== undefined) updateData.roomNumber = String(body.roomNumber);
        if (body.roomType !== undefined) updateData.roomType = String(body.roomType);
        if (body.status !== undefined) updateData.status = body.status.toUpperCase();
        if (body.pricePerNight !== undefined) updateData.pricePerNight = Number(body.pricePerNight);
        if (body.description !== undefined) updateData.description = body.description;

        const updated = await prisma.room.update({
            where: { id },
            data: updateData
        });

        return new Response(
            JSON.stringify(updated),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error(err);
        if (err.code === "P2025") {
            return new Response(
                JSON.stringify({ error: "Room not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }
        return new Response(
            JSON.stringify({ error: err.message || "Failed to update room" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

// ✅ حذف الغرفة
export async function DELETE(req, { params }) {
    try {
        await requireAuth(req);

        const { id } = params;
        await prisma.room.delete({ where: { id } });

        return new Response(null, { status: 204 });

    } catch (err) {
        console.error(err);
        if (err.code === "P2025") {
            return new Response(
                JSON.stringify({ error: "Room not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }
        return new Response(
            JSON.stringify({ error: err.message || "Failed to delete room" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
