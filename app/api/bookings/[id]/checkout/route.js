// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export async function POST(req, { params }) {
//     const bookingId = params.id;

//     try {
//         const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { room: true } });
//         if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });
//         if (!booking.roomId) return new Response(JSON.stringify({ error: "Booking has no room assigned" }), { status: 400 });

//         // تحديث الحجز
//         const updatedBooking = await prisma.booking.update({
//             where: { id: bookingId },
//             data: { status: "CheckedOut" },
//             include: { room: true, guest: true }
//         });

//         // تحديث حالة الغرفة
//         await prisma.room.update({ where: { id: booking.roomId }, data: { status: "VACANT" } });

//         // بث عالمي
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "BOOKING_STATUS_CHANGED", data: updatedBooking }),
//             });
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId: booking.roomId, newStatus: "VACANT" } }),
//             });
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify(updatedBooking), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Check-out failed" }), { status: 500 });
//     }
// }



// import prisma from "@/lib/prisma";

// export async function POST(req, { params }) {
//     try {
//         const booking = await prisma.booking.findUnique({ where: { id: params.id } });
//         if (!booking) 
//             return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });
//         if (!booking.roomId) 
//             return new Response(JSON.stringify({ error: "No room assigned" }), { status: 400 });

//         const updatedBooking = await prisma.booking.update({
//             where: { id: params.id },
//             data: { status: "CHECKED_OUT" },
//             include: { guest: true, room: true }
//         });

//         await prisma.room.update({
//             where: { id: booking.roomId },
//             data: { status: "VACANT_DIRTY" } // بعد الـ checkout تكون الغرفة غير نظيفة
//         });

//         // --- Global Broadcast ---
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "BOOKING_STATUS_CHANGED", data: updatedBooking }),
//             });
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ 
//                     event: "ROOM_STATUS_CHANGED", 
//                     data: { roomId: booking.roomId, newStatus: "VACANT_DIRTY" } 
//                 }),
//             });
//         } catch (err) {
//             console.error("Broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(updatedBooking), { status: 200 });
//     } catch (err) {
//         console.error("Check-out failed:", err);
//         return new Response(JSON.stringify({ error: "Check-out failed" }), { status: 500 });
//     }
// }




import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
    try {
        const booking = await prisma.booking.findUnique({ where: { id: params.id } });
        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });
        if (!booking.roomId) return new Response(JSON.stringify({ error: "No room assigned" }), { status: 400 });

        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: { status: "CheckedOut" },
            include: { guest: true, room: true, property: true, ratePlan: true, company: true },
        });

        await prisma.room.update({ where: { id: booking.roomId }, data: { status: "VACANT" } });

        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_UPDATED", data: updatedBooking }),
            });
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId: booking.roomId, newStatus: "VACANT" } }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Check-out failed" }), { status: 500 });
    }
}
