// app/api/properties/[id]/roomTypes/route.js
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { id } = params; // propertyId
        const roomTypes = await prisma.roomType.findMany({
            where: { propertyId: id },
            select: { id: true, name: true }
        });
        return new Response(JSON.stringify(roomTypes), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch room types by property:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch room types" }), { status: 500 });
    }
}
