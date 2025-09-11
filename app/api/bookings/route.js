import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // مسار إعدادات NextAuth
import prisma from "@/lib/prisma";


// --- جلب كل الحجوزات / إنشاء حجز جديد ---
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const from = searchParams.get("from"); // تاريخ بداية الفلترة
        const to = searchParams.get("to");     // تاريخ نهاية الفلترة

        const filters = [];

        // ✅ فلترة النصوص (search)
        if (search) {
            filters.push({
                OR: [
                    {
                        guest: {
                            firstName: { contains: search, mode: "insensitive" },
                        },
                    },
                    {
                        guest: {
                            lastName: { contains: search, mode: "insensitive" },
                        },
                    },
                    {
                        room: {
                            number: { contains: search, mode: "insensitive" },
                        },
                    },
                    {
                        company: {
                            name: { contains: search, mode: "insensitive" },
                        },
                    },
                    {
                        status: { contains: search, mode: "insensitive" },
                    },
                ],
            });
        }

        // ✅ فلترة بالتواريخ
        if (from || to) {
            const dateFilter = {};
            if (from) {
                dateFilter.gte = new Date(from);
            }
            if (to) {
                dateFilter.lte = new Date(to);
            }

            filters.push({
                OR: [
                    { checkIn: dateFilter },   // الحجز يبدأ ضمن الفترة
                    { checkOut: dateFilter },  // الحجز ينتهي ضمن الفترة
                ],
            });
        }

        const bookings = await prisma.booking.findMany({
            where: filters.length > 0 ? { AND: filters } : {},
            include: {
                guest: true,
                room: { include: { roomType: true } },
                ratePlan: true,
                company: true,
                extras: true,
                folio: {
                    include: {
                        charges: true,
                        extras: true
                    }
                }
            },
            orderBy: { checkIn: "asc" },
        });
        return new Response(JSON.stringify(bookings), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch bookings:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch bookings" }), { status: 500 });
    }
}



// export async function POST(req) {
//     try {
//         const {
//             propertyId, guestId, roomId, checkIn, checkOut, ratePlanId,
//             adults, children, specialRequests, companyId,
//             extras
//         } = await req.json();

//         if (!propertyId || !guestId || !checkIn || !checkOut) {
//             return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
//         }

//         // --- جلب المستخدم الحالي من NextAuth ---
//         const session = await getServerSession(authOptions);
//         if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
//         const currentUserId = session.user.id;


//         // --- تحقق من الغرفة ---
//         let room;
//         if (roomId) {
//             room = await prisma.room.findUnique({ where: { id: roomId }, include: { roomType: true } });
//             if (!room) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });
//             if (room.status !== "VACANT") return new Response(JSON.stringify({ error: "Room not available" }), { status: 400 });
//         }

//         // --- تحقق من Inventory حسب RatePlan ---
//         if (!roomId && ratePlanId) {
//             const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { roomType: true } });
//             if (!ratePlan) return new Response(JSON.stringify({ error: "RatePlan not found" }), { status: 404 });

//             const inventory = await prisma.inventory.findFirst({
//                 where: { propertyId, roomTypeId: ratePlan.roomTypeId, date: { gte: new Date(checkIn), lte: new Date(checkOut) } }
//             });
//             if (!inventory || inventory.allotment - inventory.sold <= 0) {
//                 return new Response(JSON.stringify({ error: "No rooms available for selected rate plan and dates" }), { status: 400 });
//             }

//             await prisma.inventory.update({ where: { id: inventory.id }, data: { sold: { increment: 1 } } });


//             // --- تعديل: التحقق لكل يوم من الفترة ---
//             let current = new Date(checkIn);
//             const end = new Date(checkOut);
//             while (current < end) {
//                 const date = new Date(current);

//                 const inventory = await prisma.inventory.findUnique({
//                     where: {
//                         propertyId_roomTypeId_date: {
//                             propertyId,
//                             roomTypeId: ratePlan.roomTypeId,
//                             date
//                         }
//                     }
//                 });

//                 if (!inventory || inventory.allotment - inventory.sold <= 0) {
//                     return new Response(JSON.stringify({ error: `No availability on ${date.toISOString().slice(0, 10)}` }), { status: 400 });
//                 }

//                 await prisma.inventory.update({
//                     where: { id: inventory.id },
//                     data: { sold: { increment: 1 } }
//                 });

//                 current.setDate(current.getDate() + 1);
//             }
//         }

//         // --- حساب السعر الإجمالي لكل يوم ---
//         let totalPrice = 0;
//         if (ratePlanId) {
//             const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { rateRules: true } });
//             const start = new Date(checkIn), end = new Date(checkOut);
//             for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
//                 const rule = ratePlan.rateRules.find(r => new Date(r.date).toDateString() === d.toDateString());
//                 totalPrice += rule ? (rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice)) : Number(ratePlan.basePrice);
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
//                 status: "Reserved"
//             },
//             include: {
//                 guest: true,
//                 room: { include: { roomType: true } },
//                 ratePlan: true,
//                 company: true
//             },
//         });


//         // --- إنشاء Folio ---
//         const folio = await prisma.folio.create({
//             data: { bookingId: booking.id, guestId, status: "Open" }
//         });

//         // --- إضافة رسوم الغرفة تلقائياً ---
//         if (room) {
//             const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
//             const roomPrice = room.roomType?.basePrice || 0;

//             if (folio) {
//                 await prisma.charge.create({
//                     data: {
//                         folioId: folio.id,
//                         code: "ROOM",
//                         description: `Room ${room.number} charge`,
//                         amount: roomPrice * nights, // السعر = سعر الغرفة * عدد الليالي
//                         tax: 0,
//                         postedById: currentUserId
//                     }
//                 });
//             }

//         }

//         // --- إضافة Extras و Charges ---
//         if (extras && extras.length > 0) {
//             const extrasData = extras.map(ex => ({
//                 bookingId: booking.id,
//                 folioId: folio.id,
//                 guestId,
//                 name: ex.name,
//                 description: ex.description || "",
//                 unitPrice: ex.price,
//                 quantity: ex.quantity || 1,
//                 tax: ex.tax || 0,
//                 status: "Unpaid"
//             }));
//             await prisma.extra.createMany({ data: extrasData });

//             for (let ex of extras) {
//                 await prisma.charge.create({
//                     data: {
//                         folioId: folio.id,
//                         code: "EXTRA",
//                         description: ex.name,
//                         amount: ex.price * ex.quantity,
//                         tax: ex.tax || 0,
//                         postedById: currentUserId
//                     }
//                 });

//                 totalPrice += ex.price * (ex.quantity || 1) + (ex.tax || 0);
//             }
//         }

//         // --- جلب نسخة جديدة للحجز مع كل العلاقات ---
//         const freshBooking = await prisma.booking.findUnique({
//             where: { id: booking.id },
//             include: {
//                 guest: true,
//                 company: true,
//                 ratePlan: true,
//                 room: {
//                     include: { roomType: true }  // 👈 جلب سعر الغرفة
//                 },
//                 extras: true,
//                 folio: {
//                     include: {
//                         charges: true,            // 👈 جلب كل الرسوم (room + extras)
//                         extras: true
//                     }
//                 }
//             },
//         });

//         // --- Broadcast ---
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "BOOKING_CREATED", data: freshBooking })
//             });

//             if (roomId) {
//                 await fetch("http://localhost:3001/api/broadcast", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId, newStatus: "Reserved" } })
//                 });
//             }

//             // --- تعديل: بث INVENTORY_UPDATED
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     event: "INVENTORY_UPDATED",
//                     data: { propertyId, roomTypeId: booking.room?.roomTypeId || null }
//                 })
//             });
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify({ freshBooking, folio, totalPrice }), { status: 201 });

//     } catch (err) {
//         console.error("Booking creation failed:", err);
//         return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500 });
//     }
// }



// هذا ال post الاصلي

export async function POST(req) {
    try {
        const {
            propertyId, guestId, roomId, checkIn, checkOut, ratePlanId,
            adults, children, specialRequests, companyId,
            extras
        } = await req.json();

        if (!propertyId || !guestId || !checkIn || !checkOut) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        // --- جلب المستخدم الحالي من NextAuth ---
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const currentUserId = session.user.id;

        // --- تحقق من الغرفة ---
        let room;
        if (roomId) {
            room = await prisma.room.findUnique({
                where: { id: roomId },
                include: { roomType: true }
            });
            if (!room) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });
            if (room.status !== "VACANT") return new Response(JSON.stringify({ error: "Room not available" }), { status: 400 });
        }

        // --- تحقق من Inventory حسب RatePlan ---
        if (!roomId && ratePlanId) {
            const ratePlan = await prisma.ratePlan.findUnique({
                where: { id: ratePlanId },
                include: { roomType: true }
            });
            if (!ratePlan) return new Response(JSON.stringify({ error: "RatePlan not found" }), { status: 404 });

            let current = new Date(checkIn);
            const end = new Date(checkOut);
            while (current < end) {
                const date = new Date(current);

                const inventory = await prisma.inventory.findUnique({
                    where: {
                        propertyId_roomTypeId_date: {
                            propertyId,
                            roomTypeId: ratePlan.roomTypeId,
                            date
                        }
                    }
                });

                if (!inventory || inventory.allotment - inventory.sold <= 0) {
                    return new Response(JSON.stringify({ error: `No availability on ${date.toISOString().slice(0, 10)}` }), { status: 400 });
                }

                await prisma.inventory.update({
                    where: { id: inventory.id },
                    data: { sold: { increment: 1 } }
                });

                current.setDate(current.getDate() + 1);
            }
        }

        // --- حساب السعر الإجمالي لكل يوم ---
        let totalPrice = 0;
        if (ratePlanId) {
            const ratePlan = await prisma.ratePlan.findUnique({
                where: { id: ratePlanId },
                include: { rateRules: true }
            });
            const start = new Date(checkIn), end = new Date(checkOut);

            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const rule = ratePlan.rateRules.find(r => new Date(r.date).toDateString() === d.toDateString());
                totalPrice += rule
                    ? (rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice))
                    : Number(ratePlan.basePrice);
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
                status: "Reserved"
            },
            include: {
                guest: true,
                room: { include: { roomType: true } },
                ratePlan: true,
                company: true
            },
        });

        // --- إنشاء Folio ---
        const folio = await prisma.folio.create({
            data: { bookingId: booking.id, guestId, status: "Open" }
        });

        // --- إضافة رسوم الغرفة ---
        if (folio) {
            let roomChargeAmount = 0;

            if (ratePlanId) {
                // 👈 السعر من الـ RatePlan
                roomChargeAmount = totalPrice;
            } else if (room) {
                // 👈 fallback إذا ما في RatePlan
                const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
                roomChargeAmount = (room.roomType?.basePrice || 0) * nights;
            }

            await prisma.charge.create({
                data: {
                    folioId: folio.id,
                    code: "ROOM",
                    description: room
                        ? `Room ${room.number} charge`
                        : `Room charge (RatePlan)`,
                    amount: roomChargeAmount,
                    tax: 0,
                    postedById: currentUserId
                }
            });
        }

        // --- إضافة Extras ---
        if (extras && extras.length > 0) {
            const extrasData = extras.map(ex => ({
                bookingId: booking.id,
                folioId: folio.id,
                guestId,
                name: ex.name,
                description: ex.description || "",
                unitPrice: ex.price,
                quantity: ex.quantity || 1,
                tax: ex.tax || 0,
                status: "Unpaid"
            }));
            await prisma.extra.createMany({ data: extrasData });

            for (let ex of extras) {
                await prisma.charge.create({
                    data: {
                        folioId: folio.id,
                        code: "EXTRA",
                        description: ex.name,
                        amount: ex.price * (ex.quantity || 1),
                        tax: ex.tax || 0,
                        postedById: currentUserId
                    }
                });

                totalPrice += ex.price * (ex.quantity || 1) + (ex.tax || 0);
            }
        }

        // --- جلب نسخة جديدة للحجز مع العلاقات ---
        const freshBooking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: {
                guest: true,
                company: true,
                ratePlan: true,
                room: { include: { roomType: true } },
                extras: true,
                folio: { include: { charges: true, extras: true } }
            },
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_CREATED", data: freshBooking })
            });

            if (roomId) {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId, newStatus: "Reserved" } })
                });
            }

            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "INVENTORY_UPDATED",
                    data: { propertyId, roomTypeId: booking.room?.roomTypeId || null }
                })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ freshBooking, folio, totalPrice }), { status: 201 });

    } catch (err) {
        console.error("Booking creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500 });
    }
}

