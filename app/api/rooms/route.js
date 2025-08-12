import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            select: {
                id: true,
                roomNumber: true,
                type: true,
            },
        });
        return new Response(JSON.stringify(rooms), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "فشل في جلب الغرف" }), { status: 500 });
    }
}
