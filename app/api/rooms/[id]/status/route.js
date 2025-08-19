import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

export async function POST(req, context) {
    try {
        await requireAuth(req);

        const { params } = await context;
        const { id } = params;

        const { newStatus, changedBy } = await req.json();
        if (!newStatus) {
            return new Response(JSON.stringify({ error: "newStatus is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const room = await prisma.room.findUnique({ where: { id } });
        if (!room) {
            return new Response(JSON.stringify({ error: "Room not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const oldStatus = room.status;

        const updatedRoom = await prisma.room.update({
            where: { id },
            data: { status: newStatus },
            include: { statusLogs: { orderBy: { changedAt: 'desc' }, take: 1 } },
        });

        await prisma.roomStatusLog.create({
            data: {
                roomId: id,
                oldStatus,
                newStatus,
                changedBy,
                changedAt: new Date(),
            },
        });

        

        return new Response(JSON.stringify(updatedRoom), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
