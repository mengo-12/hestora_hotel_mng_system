// // app/api/rooms/available/route.js
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const propertyId = searchParams.get("propertyId");
//         const checkIn = searchParams.get("checkIn");
//         const checkOut = searchParams.get("checkOut");

//         if (!propertyId || !checkIn || !checkOut) {
//             return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
//         }

//         // جلب جميع الغرف في الفندق
//         const rooms = await prisma.room.findMany({
//             where: { propertyId },
//             include: { roomType: true }
//         });

//         // جلب الحجوزات المتقاطعة مع التواريخ المطلوبة
//         const overlappingBookings = await prisma.booking.findMany({
//             where: {
//                 propertyId,
//                 roomId: { not: null },
//                 OR: [
//                     {
//                         checkIn: { lte: new Date(checkOut) },
//                         checkOut: { gte: new Date(checkIn) }
//                     }
//                 ]
//             },
//             select: { roomId: true }
//         });

//         const bookedRoomIds = overlappingBookings.map(b => b.roomId);

//         // الغرف المتاحة
//         const availableRooms = rooms.filter(
//             r => r.status === "VACANT" && !bookedRoomIds.includes(r.id)
//         );

//         return new Response(JSON.stringify(availableRooms), { status: 200 });
//     } catch (err) {
//         console.error("Failed to fetch available rooms:", err);
//         return new Response(JSON.stringify({ error: "Failed to fetch available rooms" }), { status: 500 });
//     }
// }


// الكود في الاعلى نسخة اصلية



// app/api/rooms/available/route.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const checkIn = searchParams.get("checkIn");
        const checkOut = searchParams.get("checkOut");

        if (!propertyId || !checkIn || !checkOut) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
        }

        // جلب جميع الغرف في الفندق مع RoomType و RatePlans
        const rooms = await prisma.room.findMany({
            where: { propertyId },
            include: {
                roomType: {
                    include: {
                        ratePlans: true // هنا نضيف خطط الأسعار
                    }
                }
            }
        });

        // جلب الحجوزات المتقاطعة مع التواريخ المطلوبة
        const overlappingBookings = await prisma.booking.findMany({
            where: {
                propertyId,
                roomId: { not: null },
                OR: [
                    {
                        checkIn: { lte: new Date(checkOut) },
                        checkOut: { gte: new Date(checkIn) }
                    }
                ]
            },
            select: { roomId: true }
        });

        const bookedRoomIds = overlappingBookings.map(b => b.roomId);

        // الغرف المتاحة
        const availableRooms = rooms.filter(
            r => r.status === "VACANT" && !bookedRoomIds.includes(r.id)
        );

        return new Response(JSON.stringify(availableRooms), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch available rooms:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch available rooms" }), { status: 500 });
    }
}
