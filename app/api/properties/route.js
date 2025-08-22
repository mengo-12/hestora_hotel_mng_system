import  prisma  from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function GET() {
    try {
        const properties = await prisma.property.findMany({
            select: {
                id: true,
                name: true,
            },
        });
        return new Response(JSON.stringify(properties), { status: 200 });
    } catch (err) {
        console.error("ERROR fetching properties:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch properties" }), { status: 500 });
    }
}

// إضافة RoomType جديد مع إشعار Socket.IO
export async function POST(req) {
    try {
        const body = await req.json();

        const newRoomType = await prisma.roomType.create({
            data: {
                name: body.name,
                code: body.code,
                propertyId: body.propertyId,
                capacity: body.capacity,
                basePrice: body.basePrice,
            },
        });

        const io = getIO();
        io.emit("ROOMTYPE_CREATED", newRoomType);

        return new Response(JSON.stringify(newRoomType), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create room type" }), { status: 500 });
    }
}
