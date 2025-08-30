import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // مسار إعدادات NextAuth
import prisma from "@/lib/prisma";


// --- جلب كل الحجوزات / إنشاء حجز جديد ---
export async function GET(req) {
    try {
        const bookings = await prisma.booking.findMany({
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
            room = await prisma.room.findUnique({ where: { id: roomId }, include: { roomType: true } });
            if (!room) return new Response(JSON.stringify({ error: "Room not found" }), { status: 404 });
            if (room.status !== "VACANT") return new Response(JSON.stringify({ error: "Room not available" }), { status: 400 });
        }

        // --- تحقق من Inventory حسب RatePlan ---
        if (!roomId && ratePlanId) {
            const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { roomType: true } });
            if (!ratePlan) return new Response(JSON.stringify({ error: "RatePlan not found" }), { status: 404 });

            const inventory = await prisma.inventory.findFirst({
                where: { propertyId, roomTypeId: ratePlan.roomTypeId, date: { gte: new Date(checkIn), lte: new Date(checkOut) } }
            });
            if (!inventory || inventory.allotment - inventory.sold <= 0) {
                return new Response(JSON.stringify({ error: "No rooms available for selected rate plan and dates" }), { status: 400 });
            }

            await prisma.inventory.update({ where: { id: inventory.id }, data: { sold: { increment: 1 } } });
        }

        // --- حساب السعر الإجمالي لكل يوم ---
        let totalPrice = 0;
        if (ratePlanId) {
            const ratePlan = await prisma.ratePlan.findUnique({ where: { id: ratePlanId }, include: { rateRules: true } });
            const start = new Date(checkIn), end = new Date(checkOut);
            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const rule = ratePlan.rateRules.find(r => new Date(r.date).toDateString() === d.toDateString());
                totalPrice += rule ? (rule.priceOverride ? Number(rule.priceOverride) : Number(ratePlan.basePrice)) : Number(ratePlan.basePrice);
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

        // --- إضافة رسوم الغرفة تلقائياً ---
        if (room) {
            const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
            const roomPrice = room.roomType?.basePrice || 0;

            if (folio) {
                await prisma.charge.create({
                    data: {
                        folioId: folio.id,
                        code: "ROOM",
                        description: `Room ${room.number} charge`,
                        amount: roomPrice * nights, // السعر = سعر الغرفة * عدد الليالي
                        tax: 0,
                        postedById: currentUserId
                    }
                });
            }

        }

        // --- إضافة Extras و Charges ---
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
                        amount: ex.price * ex.quantity,
                        tax: ex.tax || 0,
                        postedById: currentUserId
                    }
                });

                totalPrice += ex.price * (ex.quantity || 1) + (ex.tax || 0);
            }
        }

        // --- جلب نسخة جديدة للحجز مع كل العلاقات ---
        const freshBooking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: {
                guest: true,
                company: true,
                ratePlan: true,
                room: {
                    include: { roomType: true }  // 👈 جلب سعر الغرفة
                },
                extras: true,
                folio: {
                    include: {
                        charges: true,            // 👈 جلب كل الرسوم (room + extras)
                        extras: true
                    }
                }
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
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ freshBooking, folio, totalPrice }), { status: 201 });

    } catch (err) {
        console.error("Booking creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500 });
    }
}

