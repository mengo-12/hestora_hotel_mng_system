// app/api/bookings/bulk/route.js
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// --- إنشاء حجز جماعي ---
// export async function POST(req) {
//     try {
//         const session = await getServerSession(authOptions);
//         const currentUserId = session?.user?.id || "SYSTEM_USER_ID";

//         const { bookings = [] } = await req.json();
//         const createdBookings = [];

//         for (const b of bookings) {
//             const {
//                 propertyId,
//                 guestId,
//                 roomId,
//                 checkIn,
//                 checkOut,
//                 ratePlanId,
//                 adults,
//                 children,
//                 specialRequests,
//                 companyId,
//                 extras = []
//             } = b;

//             if (!propertyId || !guestId || !checkIn || !checkOut) {
//                 throw new Error(`Missing required fields for guest ${guestId}`);
//             }

//             // --- تحقق من الغرفة ---
//             let room = null;
//             if (roomId) {
//                 room = await prisma.room.findUnique({ where: { id: roomId }, include: { roomType: true } });
//                 if (!room) throw new Error(`Room not found for guest ${guestId}`);
//                 if (room.status !== "VACANT") throw new Error(`Room not available for guest ${guestId}`);
//             }

//             // --- تحقق من RatePlan وInventory ---
//             if (!roomId && ratePlanId) {
//                 const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { roomType: true } });
//                 if (!ratePlan) throw new Error(`RatePlan not found for guest ${guestId}`);

//                 const inventory = await prisma.inventory.findFirst({
//                     where: { propertyId, roomTypeId: ratePlan.roomTypeId, date: { gte: new Date(checkIn), lte: new Date(checkOut) } }
//                 });
//                 if (!inventory || inventory.allotment - inventory.sold <= 0) {
//                     throw new Error(`No rooms available for selected rate plan and dates for guest ${guestId}`);
//                 }

//                 await prisma.inventory.update({ where: { id: inventory.id }, data: { sold: { increment: 1 } } });
//             }

//             // --- إنشاء الحجز ---
//             const booking = await prisma.booking.create({
//                 data: {
//                     propertyId,
//                     guestId,
//                     roomId: roomId || null,
//                     checkIn: new Date(checkIn),
//                     checkOut: new Date(checkOut),
//                     ratePlanId: ratePlanId || null,
//                     adults,
//                     children,
//                     specialRequests: specialRequests || null,
//                     companyId: companyId || null,
//                     status: "Reserved"
//                 },
//                 include: {
//                     guest: true,
//                     room: { include: { roomType: true } },
//                     ratePlan: true,
//                     company: true
//                 }
//             });

//             // --- إنشاء Folio ---
//             const folio = await prisma.folio.create({
//                 data: { bookingId: booking.id, guestId, status: "Open" }
//             });

//             // --- حساب رسوم الغرفة ---
//             let totalRoomPrice = 0;
//             let roomTax = 0;
//             if (room) {
//                 const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 1;
//                 let roomPrice = room.roomType?.basePrice || room.price || 0;

//                 // لو فيه RatePlan
//                 if (ratePlanId) {
//                     const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { rateRules: true } });
//                     const start = new Date(checkIn), end = new Date(checkOut);
//                     for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
//                         const rule = ratePlan.rateRules.find(r => new Date(r.date).toDateString() === d.toDateString());
//                         totalRoomPrice += rule ? (rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice)) : Number(ratePlan.basePrice);
//                     }
//                     roomTax = ratePlan.tax ? (ratePlan.tax > 1 ? totalRoomPrice * (ratePlan.tax / 100) : totalRoomPrice * ratePlan.tax) : 0;
//                 } else {
//                     totalRoomPrice = roomPrice * nights;
//                 }

//                 await prisma.charge.create({
//                     data: {
//                         folioId: folio.id,
//                         code: "ROOM",
//                         description: `Room Charge - ${room.roomType?.name || "Room"}`,
//                         amount: totalRoomPrice,
//                         tax: roomTax,
//                         postedById: currentUserId
//                     }
//                 });
//             }

//             // --- إضافة Extras و Charges ---
//             for (const ex of extras) {
//                 const price = new Prisma.Decimal(ex.price || 0);
//                 const qty = new Prisma.Decimal(ex.quantity || 1);
//                 const taxRate = new Prisma.Decimal(ex.tax || 0);
//                 const subTotal = price.times(qty);
//                 const taxAmount = taxRate.greaterThan(1) ? subTotal.times(taxRate.dividedBy(100)) : subTotal.times(taxRate);

//                 const newExtra = await prisma.extra.create({
//                     data: {
//                         bookingId: booking.id,
//                         folioId: folio.id,
//                         guestId,
//                         name: ex.name,
//                         description: ex.description || "",
//                         unitPrice: price,
//                         quantity: qty,
//                         tax: taxAmount,
//                         status: "Unpaid"
//                     }
//                 });

//                 await prisma.charge.create({
//                     data: {
//                         folioId: folio.id,
//                         code: "EXTRA",
//                         description: newExtra.name,
//                         amount: subTotal,
//                         tax: taxAmount,
//                         postedById: currentUserId
//                     }
//                 });
//             }

//             // --- تحديث حالة الغرفة ---
//             if (booking.roomId) {
//                 await prisma.room.update({ where: { id: booking.roomId }, data: { status: "Reserved" } });
//             }

//             // --- جلب نسخة كاملة للحجز ---
//             const freshBooking = await prisma.booking.findUnique({
//                 where: { id: booking.id },
//                 include: {
//                     guest: true,
//                     room: { include: { roomType: true } },
//                     ratePlan: true,
//                     company: true,
//                     folio: { include: { charges: true, extras: true } },
//                     extras: true
//                 }
//             });

//             createdBookings.push(freshBooking);

//             // --- بث عالمي ---
        //     try {
        //         await fetch("http://localhost:3001/api/broadcast", {
        //             method: "POST",
        //             headers: { "Content-Type": "application/json" },
        //             body: JSON.stringify({ event: "BOOKING_CREATED", data: freshBooking })
        //         });
        //         if (roomId) {
        //             await fetch("http://localhost:3001/api/broadcast", {
        //                 method: "POST",
        //                 headers: { "Content-Type": "application/json" },
        //                 body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId, newStatus: "Reserved" } })
        //             });
        //         }
        //     } catch (err) { console.error("Socket broadcast failed:", err); }
        // }

//         return new Response(JSON.stringify(createdBookings), { status: 201 });

//     } catch (err) {
//         console.error("Bulk booking creation failed:", err);
//         return new Response(JSON.stringify({ error: err.message || "Failed to create bulk bookings" }), { status: 500 });
//     }
// }












// // --- تعديل حجز جماعي (PUT) ---
// export async function PUT(req) {
//     try {
//         const session = await getServerSession(authOptions);
//         const currentUserId = session?.user?.id || "SYSTEM_USER_ID";

//         const { bookings = [] } = await req.json(); // array of updated bookings
//         const updatedBookings = [];

//         for (const b of bookings) {
//             const {
//                 id,
//                 propertyId,
//                 guestId,
//                 roomId,
//                 checkIn,
//                 checkOut,
//                 ratePlanId,
//                 adults,
//                 children,
//                 specialRequests,
//                 companyId,
//                 status,
//                 extras = [],
//                 deletedIds = []
//             } = b;

//             const currentBooking = await prisma.booking.findUnique({
//                 where: { id },
//                 include: { room: true, folio: true, extras: true }
//             });
//             if (!currentBooking) continue;

//             // --- تحديث بيانات الحجز ---
//             const updatedBooking = await prisma.booking.update({
//                 where: { id },
//                 data: {
//                     propertyId,
//                     guestId,
//                     roomId: roomId || null,
//                     checkIn: checkIn ? new Date(checkIn) : undefined,
//                     checkOut: checkOut ? new Date(checkOut) : undefined,
//                     ratePlanId: ratePlanId || null,
//                     adults,
//                     children,
//                     specialRequests: specialRequests || null,
//                     companyId: companyId || null,
//                     status: status || undefined
//                 },
//                 include: { guest: true, room: true, ratePlan: true, company: true, folio: true, extras: true }
//             });

//             const folioId = updatedBooking.folio?.id;

//             if (folioId) {
//                 // حذف Extras المحددة
//                 for (const exId of deletedIds) {
//                     const ex = await prisma.extra.findUnique({ where: { id: exId } });
//                     if (ex) {
//                         await prisma.charge.deleteMany({ where: { folioId, description: ex.name } });
//                         await prisma.extra.delete({ where: { id: exId } });
//                     }
//                 }

//                 // --- تحديث أو إضافة Extras ---
//                 for (const ex of extras) {
//                     const price = new Prisma.Decimal(ex.price || 0);
//                     const qty = new Prisma.Decimal(ex.quantity || 1);
//                     const taxRate = new Prisma.Decimal(ex.tax || 0);
//                     const subTotal = price.times(qty);
//                     const taxAmount = taxRate.greaterThan(1)
//                         ? subTotal.times(taxRate.dividedBy(100))
//                         : subTotal.times(taxRate);

//                     if (ex.id) {
//                         await prisma.extra.update({
//                             where: { id: ex.id },
//                             data: { name: ex.name, description: ex.description || "", unitPrice: price, quantity: qty, tax: taxAmount, status: ex.status || "Unpaid" }
//                         });
//                         await prisma.charge.updateMany({ where: { folioId, description: ex.name }, data: { amount: subTotal, tax: taxAmount } });
//                     } else {
//                         const newExtra = await prisma.extra.create({
//                             data: { bookingId: id, folioId, guestId, name: ex.name, description: ex.description || "", unitPrice: price, quantity: qty, tax: taxAmount, status: ex.status || "Unpaid" }
//                         });
//                         await prisma.charge.create({
//                             data: { folioId, code: "EXTRA", description: newExtra.name, amount: subTotal, tax: taxAmount, postedById: currentUserId }
//                         });
//                     }
//                 }

//                 // --- تحديث سعر الغرفة إذا تم تغييره أو إضافة Charge جديدة ---
//                 let roomPrice = new Prisma.Decimal(0);
//                 let roomTax = new Prisma.Decimal(0);

//                 if (ratePlanId) {
//                     const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId } });
//                     if (ratePlan?.price) roomPrice = new Prisma.Decimal(ratePlan.price);
//                     if (ratePlan?.tax) {
//                         roomTax = ratePlan.tax > 1
//                             ? roomPrice.times(new Prisma.Decimal(ratePlan.tax).dividedBy(100))
//                             : roomPrice.times(new Prisma.Decimal(ratePlan.tax));
//                     }
//                 } else if (updatedBooking.room?.price) {
//                     roomPrice = new Prisma.Decimal(updatedBooking.room.price);
//                 }

//                 if (updatedBooking.roomId) {
//                     await prisma.charge.upsert({
//                         where: { folioId_description: { folioId, description: `Room Charge - ${updatedBooking.room?.roomType?.name || "Room"}` } },
//                         update: { amount: roomPrice, tax: roomTax },
//                         create: { folioId, code: "ROOM", description: `Room Charge - ${updatedBooking.room?.roomType?.name || "Room"}`, amount: roomPrice, tax: roomTax, postedById: currentUserId }
//                     });
//                 }
//             }

//             // --- تحديث حالة الغرفة ---
//             if (updatedBooking.roomId) {
//                 if (status === "InHouse") {
//                     await prisma.room.update({ where: { id: updatedBooking.roomId }, data: { status: "OCCUPIED" } });
//                 } else if (status === "CheckedOut") {
//                     await prisma.room.update({ where: { id: updatedBooking.roomId }, data: { status: "VACANT" } });
//                 }
//             }

//             // --- جلب نسخة جديدة محدثة ---
//             const freshBooking = await prisma.booking.findUnique({
//                 where: { id },
//                 include: { guest: true, room: { include: { roomType: true } }, ratePlan: true, company: true, folio: { include: { charges: true, extras: true } }, extras: true }
//             });

//             updatedBookings.push(freshBooking);

        //     // --- بث عالمي ---
        //     try {
        //         await fetch("http://localhost:3001/api/broadcast", {
        //             method: "POST",
        //             headers: { "Content-Type": "application/json" },
        //             body: JSON.stringify({ event: "BOOKING_UPDATED", data: freshBooking })
        //         });
        //     } catch (err) { console.error("Socket broadcast failed:", err); }
        // }

//         return new Response(JSON.stringify(updatedBookings), { status: 200 });

//     } catch (err) {
//         console.error("Bulk booking update failed:", err);
//         return new Response(JSON.stringify({ error: "Failed to update bulk bookings" }), { status: 500 });
//     }
// }


// --- إنشاء حجز جماعي ---
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id || "SYSTEM_USER_ID";

        const { bookings = [] } = await req.json();
        const createdBookings = [];

        for (const b of bookings) {
            const {
                propertyId,
                guestId,
                roomId,
                checkIn,
                checkOut,
                ratePlanId,
                adults,
                children,
                specialRequests,
                companyId,
                extras = []
            } = b;

            if (!propertyId || !guestId || !checkIn || !checkOut) {
                throw new Error(`Missing required fields for guest ${guestId}`);
            }

            // --- تحقق من الغرفة ---
            let room = null;
            if (roomId) {
                room = await prisma.room.findUnique({ where: { id: roomId }, include: { roomType: true } });
                if (!room) throw new Error(`Room not found for guest ${guestId}`);
                if (room.status !== "VACANT") throw new Error(`Room not available for guest ${guestId}`);
            }

            // --- تحقق من RatePlan وInventory ---
            if (!roomId && ratePlanId) {
                const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { roomType: true } });
                if (!ratePlan) throw new Error(`RatePlan not found for guest ${guestId}`);

                const inventory = await prisma.inventory.findFirst({
                    where: { propertyId, roomTypeId: ratePlan.roomTypeId, date: { gte: new Date(checkIn), lte: new Date(checkOut) } }
                });
                if (!inventory || inventory.allotment - inventory.sold <= 0) {
                    throw new Error(`No rooms available for selected rate plan and dates for guest ${guestId}`);
                }

                await prisma.inventory.update({ where: { id: inventory.id }, data: { sold: { increment: 1 } } });
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
                }
            });

            // --- إنشاء Folio ---
            const folio = await prisma.folio.create({
                data: { bookingId: booking.id, guestId, status: "Open" }
            });

            // --- حساب رسوم الغرفة ---
            let totalRoomPrice = 0;
            let roomTax = 0;
            if (room) {
                const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 1;
                let roomPrice = room.roomType?.basePrice || room.price || 0;

                // لو فيه RatePlan
                if (ratePlanId) {
                    const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { rateRules: true } });
                    const start = new Date(checkIn), end = new Date(checkOut);
                    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                        const rule = ratePlan.rateRules.find(r => new Date(r.date).toDateString() === d.toDateString());
                        totalRoomPrice += rule ? (rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice)) : Number(ratePlan.basePrice);
                    }
                    // ✅ عدلنا الضريبة هنا
                    if (ratePlan.tax) {
                        const taxRate = Number(ratePlan.tax);
                        roomTax = totalRoomPrice * (taxRate / 100);
                    }
                } else {
                    totalRoomPrice = roomPrice * nights;
                }

                await prisma.charge.create({
                    data: {
                        folioId: folio.id,
                        code: "ROOM",
                        description: `Room Charge - ${room.roomType?.name || "Room"}`,
                        amount: totalRoomPrice,
                        tax: roomTax,
                        postedById: currentUserId
                    }
                });
            }

            // --- إضافة Extras و Charges ---
            for (const ex of extras) {
                const price = new Prisma.Decimal(ex.price || 0);
                const qty = new Prisma.Decimal(ex.quantity || 1);
                const subTotal = price.times(qty);

                // ✅ عدلنا الضريبة هنا
                const taxRate = new Prisma.Decimal(ex.tax || 0); // ex.tax متوقع 15
                const taxAmount = subTotal.times(taxRate.dividedBy(100));

                const newExtra = await prisma.extra.create({
                    data: {
                        bookingId: booking.id,
                        folioId: folio.id,
                        guestId,
                        name: ex.name,
                        description: ex.description || "",
                        unitPrice: price,
                        quantity: qty,
                        tax: taxRate, // نخزن النسبة نفسها (15)
                        status: "Unpaid"
                    }
                });

                await prisma.charge.create({
                    data: {
                        folioId: folio.id,
                        code: "EXTRA",
                        description: newExtra.name,
                        amount: subTotal,       // ✅ لازم يكون موجود (Decimal)
                        tax: taxRate,
                        postedById: currentUserId
                    }
                });
            }

            // --- تحديث حالة الغرفة ---
            if (booking.roomId) {
                await prisma.room.update({ where: { id: booking.roomId }, data: { status: "Reserved" } });
            }

            // --- جلب نسخة كاملة للحجز ---
            const freshBooking = await prisma.booking.findUnique({
                where: { id: booking.id },
                include: {
                    guest: true,
                    room: { include: { roomType: true } },
                    ratePlan: true,
                    company: true,
                    folio: { include: { charges: true, extras: true } },
                    extras: true
                }
            });

            createdBookings.push(freshBooking);
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
            } catch (err) { console.error("Socket broadcast failed:", err); }
        }

        return new Response(JSON.stringify(createdBookings), { status: 201 });

    } catch (err) {
        console.error("Bulk booking creation failed:", err);
        return new Response(JSON.stringify({ error: err.message || "Failed to create bulk bookings" }), { status: 500 });
    }
}


// --- تعديل حجز جماعي (PUT) ---
export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id || "SYSTEM_USER_ID";

        const { bookings = [] } = await req.json();
        const updatedBookings = [];

        for (const b of bookings) {
            const {
                id,
                propertyId,
                guestId,
                roomId,
                checkIn,
                checkOut,
                ratePlanId,
                adults,
                children,
                specialRequests,
                companyId,
                status,
                extras = [],
                deletedIds = []
            } = b;

            const currentBooking = await prisma.booking.findUnique({
                where: { id },
                include: { room: true, folio: true, extras: true }
            });
            if (!currentBooking) continue;

            // --- تحديث بيانات الحجز ---
            const updatedBooking = await prisma.booking.update({
                where: { id },
                data: {
                    propertyId,
                    guestId,
                    roomId: roomId || null,
                    checkIn: checkIn ? new Date(checkIn) : undefined,
                    checkOut: checkOut ? new Date(checkOut) : undefined,
                    ratePlanId: ratePlanId || null,
                    adults,
                    children,
                    specialRequests: specialRequests || null,
                    companyId: companyId || null,
                    status: status || undefined
                },
                include: { guest: true, room: true, ratePlan: true, company: true, folio: true, extras: true }
            });

            const folioId = updatedBooking.folio?.id;

            if (folioId) {
                // حذف Extras
                for (const exId of deletedIds) {
                    const ex = await prisma.extra.findUnique({ where: { id: exId } });
                    if (ex) {
                        await prisma.charge.deleteMany({ where: { folioId, description: ex.name } });
                        await prisma.extra.delete({ where: { id: exId } });
                    }
                }

                // --- تحديث أو إضافة Extras ---
                for (const ex of extras) {
                    const price = new Prisma.Decimal(ex.price || 0);
                    const qty = new Prisma.Decimal(ex.quantity || 1);
                    const subTotal = price.times(qty);

                    // ✅ عدلنا الضريبة هنا
                    const taxRate = new Prisma.Decimal(ex.tax || 0); // ex.tax متوقع 15
                    const taxAmount = subTotal.times(taxRate.dividedBy(100));

                    if (ex.id) {
                        await prisma.extra.update({
                            where: { id: ex.id },
                            data: {
                                name: ex.name,
                                description: ex.description || "",
                                unitPrice: price,
                                quantity: qty,
                                tax: taxRate,
                                status: ex.status || "Unpaid"
                            }
                        });
                        await prisma.charge.updateMany({
                            where: { folioId, description: ex.name },
                            data: { amount: subTotal, tax: taxAmount }
                        });
                    } else {
                        const newExtra = await prisma.extra.create({
                            data: {
                                bookingId: id,
                                folioId,
                                guestId,
                                name: ex.name,
                                description: ex.description || "",
                                unitPrice: price,
                                quantity: qty,
                                tax: taxRate,
                                status: ex.status || "Unpaid"
                            }
                        });
                        await prisma.charge.create({
                            data: {
                                folioId,
                                code: "EXTRA",
                                description: newExtra.name,
                                amount: subTotal,
                                tax: taxAmount,
                                postedById: currentUserId
                            }
                        });
                    }
                }
            }

            updatedBookings.push(updatedBooking);
                        // --- بث عالمي ---
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_UPDATED", data: freshBooking })
                });
            } catch (err) { console.error("Socket broadcast failed:", err); }
        }
        

        return new Response(JSON.stringify(updatedBookings), { status: 200 });

    } catch (err) {
        console.error("Bulk booking update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update bulk bookings" }), { status: 500 });
    }
}




// --- حذف الحجز الجماعي ---
export async function DELETE(req) {
    try {
        const { bookingIds = [] } = await req.json(); // array of ids to delete

        for (const id of bookingIds) {
            // حذف Extras المرتبطة
            await prisma.extra.deleteMany({ where: { bookingId: id } });

            // حذف Charges و Payments المرتبطة بكل Folio
            const folios = await prisma.folio.findMany({ where: { bookingId: id } });
            for (const f of folios) {
                await prisma.charge.deleteMany({ where: { folioId: f.id } });
                await prisma.payment.deleteMany({ where: { folioId: f.id } });
            }

            // حذف Folios
            await prisma.folio.deleteMany({ where: { bookingId: id } });

            // حذف الحجز نفسه
            await prisma.booking.delete({ where: { id } });

            // --- بث عالمي ---
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_DELETED", data: { id } })
                });
            } catch (err) { console.error("Socket broadcast failed:", err); }
        }

        return new Response(JSON.stringify({ message: "Bulk bookings deleted successfully" }), { status: 200 });
    } catch (err) {
        console.error("Bulk booking deletion failed:", err);
        return new Response(JSON.stringify({ error: "Failed to delete bulk bookings" }), { status: 500 });
    }
}