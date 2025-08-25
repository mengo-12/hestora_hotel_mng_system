import prisma from "@/lib/prisma";

// export async function POST(req, { params }) {
//     try {
//         const booking = await prisma.booking.findUnique({ 
//             where: { id: params.id }, 
//             include: { room: true, guest: true, property: true, ratePlan: true, company: true }
//         });
//         if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

//         // تحديث حالة الحجز إلى Cancelled
//         const updatedBooking = await prisma.booking.update({
//             where: { id: params.id },
//             data: { status: "Cancelled" },
//             include: { room: true, guest: true, property: true, ratePlan: true, company: true }
//         });

//         // إذا كان هناك غرفة محجوزة، تغيير حالتها إلى VACANT
//         if (booking.roomId) {
//             await prisma.room.update({ where: { id: booking.roomId }, data: { status: "VACANT" } });
//         }

//         // بث عالمي
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "BOOKING_UPDATED", data: updatedBooking }),
//             });

//             if (booking.roomId) {
//                 await fetch("http://localhost:3001/api/broadcast", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId: booking.roomId, newStatus: "VACANT" } }),
//                 });
//             }
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify(updatedBooking), { status: 200 });

//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Cancel failed" }), { status: 500 });
//     }
// }



export async function POST(req, { params }) {
    try {
        const booking = await prisma.booking.findUnique({ 
            where: { id: params.id }, 
            include: { room: true, guest: true, property: true, ratePlan: true, company: true }
        });
        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        // تحديث حالة الحجز إلى Cancelled
        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: { status: "Cancelled" },
            include: { room: true, guest: true, property: true, ratePlan: true, company: true }
        });

        // إذا كان هناك غرفة محجوزة، تغيير حالتها إلى VACANT
        if (booking.roomId) {
            await prisma.room.update({ where: { id: booking.roomId }, data: { status: "VACANT" } });
        }

        // --- تحرير الـ Inventory إذا كان الحجز بدون roomId ---
        if (booking.ratePlanId && !booking.roomId) {
            const start = new Date(booking.checkIn);
            const end = new Date(booking.checkOut);
            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                await prisma.inventory.updateMany({
                    where: {
                        propertyId: booking.propertyId,
                        roomTypeId: booking.ratePlan.roomTypeId,
                        date: new Date(d)
                    },
                    data: { sold: { decrement: 1 } }
                });
            }
        }

        // بث عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_UPDATED", data: updatedBooking }),
            });

            if (booking.roomId) {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId: booking.roomId, newStatus: "VACANT" } }),
                });
            }
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Cancel failed" }), { status: 500 });
    }
}

