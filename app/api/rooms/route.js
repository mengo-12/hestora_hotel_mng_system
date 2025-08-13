// app/api/rooms/route.js
import prisma from "../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

// عرض قائمة الغرف
export async function GET(req) {
    try {
        await requireAuth(req);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const q = searchParams.get("q");

        const where = {};
        if (status) where.status = status.toUpperCase();
        if (q) {
            where.OR = [
                { roomNumber: { contains: q, mode: "insensitive" } },
                { roomType: { contains: q, mode: "insensitive" } }
            ];
        }

        const rooms = await prisma.room.findMany({
            where,
            orderBy: { roomNumber: "asc" }
        });

        return new Response(JSON.stringify(rooms), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: "Unauthorized or failed" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
}

// إضافة غرفة جديدة
export async function POST(req) {
    try {
        await requireAuth(req);

        const body = await req.json();

        if (!body.roomNumber || !body.roomType || !body.status || body.pricePerNight == null) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const newRoom = await prisma.room.create({
            data: {
                roomNumber: String(body.roomNumber),
                roomType: String(body.roomType),
                status: body.status.toUpperCase(),
                pricePerNight: Number(body.pricePerNight),
                description: body.description || null
            }
        });

        return new Response(JSON.stringify(newRoom), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err.message || "Failed to create room" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
