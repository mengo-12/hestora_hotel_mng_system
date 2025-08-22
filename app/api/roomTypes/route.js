import  prisma  from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function GET() {
    try {
        const roomTypes = await prisma.roomType.findMany({
            select: {
                id: true,
                name: true,
                propertyId: true,
            },
        });
        return new Response(JSON.stringify(roomTypes), { status: 200 });
    } catch (err) {
        console.error("ERROR fetching roomTypes:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch room types" }), { status: 500 });
    }
}

// إضافة Property جديد مع إشعار Socket.IO
export async function POST(req) {
    try {
        const body = await req.json();

        const newProperty = await prisma.property.create({
            data: {
                name: body.name,
                code: body.code,
                timezone: body.timezone,
                currency: body.currency,
            },
        });

        const io = getIO();
        io.emit("PROPERTY_CREATED", newProperty);

        return new Response(JSON.stringify(newProperty), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create property" }), { status: 500 });
    }
}
