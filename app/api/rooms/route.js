// import prisma from "../../../lib/prisma";
// import { getToken } from "next-auth/jwt";

// const secret = process.env.NEXTAUTH_SECRET;

// async function requireAuth(req) {
//     const token = await getToken({ req, secret });
//     if (!token) throw new Error("UNAUTHORIZED");
//     return token;
// }

// // عرض قائمة الغرف
// export async function GET(req) {
//     try {
//         await requireAuth(req);

//         const { searchParams } = new URL(req.url);
//         const status = searchParams.get("status");
//         const q = searchParams.get("q");

//         const where = {};
//         if (status) where.status = status.toUpperCase();
//         if (q) {
//             where.OR = [
//                 { roomNumber: { contains: q, mode: "insensitive" } },
//                 { roomType: { contains: q, mode: "insensitive" } }
//             ];
//         }

//         const rooms = await prisma.room.findMany({
//             where,
//             orderBy: { roomNumber: "asc" },
//             include: {
//                 statusLogs: {
//                     orderBy: { changedAt: "desc" }, // ✅ استخدام العمود الصحيح
//                     take: 1 // آخر حالة فقط
//                 }
//             }
//         });

//         // تجهيز النتيجة مع الحالة الحالية من الـ log
//         const result = rooms.map(r => ({
//             id: r.id,
//             roomNumber: r.roomNumber,
//             roomType: r.roomType,
//             pricePerNight: r.pricePerNight,
//             description: r.description,
//             // لو في log خذ الحالة الأخيرة، وإلا خذ من جدول Room
//             currentStatus: r.statusLogs[0]?.newStatus || r.status
//         }));

//         return new Response(JSON.stringify(result), {
//             status: 200,
//             headers: { "Content-Type": "application/json" }
//         });
//     } catch (err) {
//         console.error(err);
//         return new Response(
//             JSON.stringify({ error: "Unauthorized or failed" }),
//             { status: 401, headers: { "Content-Type": "application/json" } }
//         );
//     }
// }

// // إضافة غرفة جديدة
// export async function POST(req) {
//     try {
//         await requireAuth(req);

//         const body = await req.json();

//         if (!body.roomNumber || !body.roomType || !body.status || body.pricePerNight == null) {
//             return new Response(
//                 JSON.stringify({ error: "Missing required fields" }),
//                 { status: 400, headers: { "Content-Type": "application/json" } }
//             );
//         }

//         const newRoom = await prisma.room.create({
//             data: {
//                 roomNumber: String(body.roomNumber),
//                 roomType: String(body.roomType),
//                 status: body.status.toUpperCase(),
//                 pricePerNight: Number(body.pricePerNight),
//                 description: body.description || null
//             }
//         });

//         return new Response(JSON.stringify(newRoom), {
//             status: 201,
//             headers: { "Content-Type": "application/json" }
//         });
//     } catch (err) {
//         console.error(err);
//         return new Response(
//             JSON.stringify({ error: err.message || "Failed to create room" }),
//             { status: 500, headers: { "Content-Type": "application/json" } }
//         );
//     }
// }




// app/api/rooms/route.js
import prisma from "../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

export async function POST(req) {
    try {
        await requireAuth(req);
        const { roomNumber, roomType, status, pricePerNight, description } = await req.json();

        // إنشاء الغرفة
        const room = await prisma.room.create({
            data: { roomNumber, roomType, status, pricePerNight, description },
        });

        // إنشاء أول سجل حالة في statusLogs
        await prisma.roomStatusLog.create({
            data: {
                roomId: room.id,
                oldStatus: status,
                newStatus: status,
                changedBy: "SYSTEM", // أو معرف المستخدم الحالي
                changedAt: new Date(),
            },
        });

        return new Response(JSON.stringify(room), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err.message || "Failed to create room" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

// يمكنك إضافة GET هنا إذا أردت جلب كل الغرف
export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                statusLogs: { orderBy: { changedAt: "desc" }, take: 1 },
            },
        });

        const roomsWithCurrentStatus = rooms.map((room) => ({
            ...room,
            status: room.statusLogs.length > 0 ? room.statusLogs[0].newStatus : room.status,
        }));

        return new Response(JSON.stringify(roomsWithCurrentStatus), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: err.message || "Failed to fetch rooms" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}