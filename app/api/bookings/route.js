import prisma from "@/lib/prisma";

// --- جلب كل الحجوزات ---
export async function GET(req) {
    try {
        const bookings = await prisma.booking.findMany({
            include: { guest: true, room: true, ratePlan: true, company: true },
            orderBy: { checkIn: "asc" },
        });
        return new Response(JSON.stringify(bookings), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch bookings:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch bookings" }), { status: 500 });
    }
}

// --- إنشاء حجز جديد مع التحقق من توفر الغرف ---
// export async function POST(req) {
//     try {
//         const {
//             propertyId, guestId, roomId, checkIn, checkOut, ratePlanId,
//             adults, children, specialRequests, companyId
//         } = await req.json();

//         if (!propertyId || !guestId || !checkIn || !checkOut) {
//             return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
//         }

//         // --- تحقق من وجود الغرفة وحالتها ---
//         if (roomId) {
//             const room = await prisma.room.findUnique({ where: { id: roomId } });
//             if (!room) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });
//             if (room.status !== "VACANT") return new Response(JSON.stringify({ error: "Room is not available" }), { status: 400 });
//         }

//         // --- تحقق من Inventory حسب RoomType ---
//         if (!roomId && ratePlanId) {
//             const ratePlan = await prisma.ratePlan.findUnique({
//                 where: { id: ratePlanId },
//                 include: { roomType: true }
//             });
//             if (!ratePlan) return new Response(JSON.stringify({ error: "RatePlan not found" }), { status: 404 });

//             const inventory = await prisma.inventory.findFirst({
//                 where: {
//                     propertyId,
//                     roomTypeId: ratePlan.roomTypeId,
//                     date: { gte: new Date(checkIn), lte: new Date(checkOut) }
//                 }
//             });

//             if (!inventory || inventory.allotment - inventory.sold <= 0) {
//                 return new Response(JSON.stringify({ error: "No rooms available for selected rate plan and dates" }), { status: 400 });
//             }
//         }

//         // --- حساب السعر النهائي لكل يوم ---
//         let totalPrice = 0;
//         if (ratePlanId) {
//             const ratePlan = await prisma.ratePlan.findUnique({
//                 where: { id: ratePlanId },
//                 include: { rateRules: true }
//             });

//             const start = new Date(checkIn);
//             const end = new Date(checkOut);
//             for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
//                 const rule = ratePlan.rateRules.find(r => {
//                     const ruleDate = new Date(r.date);
//                     return ruleDate.toDateString() === d.toDateString();
//                 });
//                 if (rule) {
//                     if (rule.closedToArrival || rule.closedToDeparture) {
//                         return new Response(JSON.stringify({ error: `RatePlan closed on ${d.toDateString()}` }), { status: 400 });
//                     }
//                     totalPrice += rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice);
//                 } else {
//                     totalPrice += Number(ratePlan.basePrice);
//                 }
//             }
//         }

//         // --- إنشاء الحجز ---
//         const booking = await prisma.booking.create({
//             data: {
//                 propertyId,
//                 guestId,
//                 roomId: roomId || null,
//                 checkIn: new Date(checkIn),
//                 checkOut: new Date(checkOut),
//                 ratePlanId: ratePlanId || null,
//                 adults,
//                 children,
//                 specialRequests: specialRequests || null,
//                 companyId: companyId || null,
//                 // يمكنك حفظ totalPrice في حقل إضافي إذا أردت
//             },
//             include: { guest: true, room: true, ratePlan: true, company: true },
//         });

//         // --- إنشاء Folio ابتدائي مع السعر الإجمالي ---
//         await prisma.folio.create({
//             data: {
//                 bookingId: booking.id,
//                 guestId,
//                 charges: totalPrice > 0 ? {
//                     create: [{
//                         code: "ROOM",
//                         description: "Room charge",
//                         amount: totalPrice,
//                         tax: 0,
//                         postedById: guestId // مؤقتًا
//                     }]
//                 } : undefined
//             }
//         });

//         // --- Broadcast عالمي ---
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "BOOKING_CREATED", data: booking }),
//             });
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify({ booking, totalPrice }), { status: 201 });

//     } catch (err) {
//         console.error("Booking creation failed:", err);
//         return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500 });
//     }
// }





// --- إنشاء حجز جديد مع التحقق من توفر الغرف ---
export async function POST(req) {
    try {
        const {
            propertyId, guestId, roomId, checkIn, checkOut, ratePlanId,
            adults, children, specialRequests, companyId
        } = await req.json();

        if (!propertyId || !guestId || !checkIn || !checkOut) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // --- تحقق من وجود الغرفة وحالتها ---
        if (roomId) {
            const room = await prisma.room.findUnique({ where: { id: roomId } });
            if (!room) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });
            if (room.status !== "VACANT") return new Response(JSON.stringify({ error: "Room is not available" }), { status: 400 });
        }

        // --- تحقق من Inventory حسب RoomType ---
        if (!roomId && ratePlanId) {
            const ratePlan = await prisma.ratePlan.findUnique({
                where: { id: ratePlanId },
                include: { roomType: true }
            });
            if (!ratePlan) return new Response(JSON.stringify({ error: "RatePlan not found" }), { status: 404 });

            const inventory = await prisma.inventory.findFirst({
                where: {
                    propertyId,
                    roomTypeId: ratePlan.roomTypeId,
                    date: { gte: new Date(checkIn), lte: new Date(checkOut) }
                }
            });

            if (!inventory || inventory.allotment - inventory.sold <= 0) {
                return new Response(JSON.stringify({ error: "No rooms available for selected rate plan and dates" }), { status: 400 });
            }

            // تحديث عدد الغرف المحجوزة
            await prisma.inventory.update({
                where: { id: inventory.id },
                data: { sold: { increment: 1 } }
            });
        }

        // --- حساب السعر النهائي لكل يوم ---
        let totalPrice = 0;
        if (ratePlanId) {
            const ratePlan = await prisma.ratePlan.findUnique({
                where: { id: ratePlanId },
                include: { rateRules: true }
            });

            const start = new Date(checkIn);
            const end = new Date(checkOut);
            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const rule = ratePlan.rateRules.find(r => {
                    const ruleDate = new Date(r.date);
                    return ruleDate.toDateString() === d.toDateString();
                });
                if (rule) {
                    if (rule.closedToArrival || rule.closedToDeparture) {
                        return new Response(JSON.stringify({ error: `RatePlan closed on ${d.toDateString()}` }), { status: 400 });
                    }
                    totalPrice += rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice);
                } else {
                    totalPrice += Number(ratePlan.basePrice);
                }
            }
        }

        // --- إنشاء الحجز ---
        const booking = await prisma.booking.create({
            data: {
                propertyId,
                guestId,
                roomId: roomId || null,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                ratePlanId: ratePlanId || null,
                adults,
                children,
                specialRequests: specialRequests || null,
                companyId: companyId || null,
                status: "Reserved" // ✅ حالة ابتدائية
            },
            include: { guest: true, room: true, ratePlan: true, company: true },
        });

        // --- إنشاء Folio ابتدائي مع السعر الإجمالي ---
        await prisma.folio.create({
            data: {
                bookingId: booking.id,
                guestId,
                charges: totalPrice > 0 ? {
                    create: [{
                        code: "ROOM",
                        description: "Room charge",
                        amount: totalPrice,
                        tax: 0,
                        postedById: guestId // مؤقتًا
                    }]
                } : undefined
            }
        });

        // --- Broadcast عالمي ---
        try {
            // بث إنشاء الحجز
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_CREATED", data: booking }),
            });

            // بث حالة الغرفة لو تم ربط RoomId
            if (roomId) {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId, newStatus: "Reserved" } }),
                });
            }
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ booking, totalPrice }), { status: 201 });

    } catch (err) {
        console.error("Booking creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500 });
    }
}
