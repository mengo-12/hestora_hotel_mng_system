// import prisma from "@/lib/prisma";

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const groupId = searchParams.get("groupId");
//         if (!groupId) return new Response("GroupId is required", { status: 400 });

//         const bookings = await prisma.booking.findMany({
//             where: { groupId },
//             include: {
//                 guest: true,
//                 property: true,
//                 room: true,
//                 ratePlan: true,
//                 folio: true,
//                 company: true,
//                 group: true,
//                 extras: true,
//             },
//         });

//         return new Response(JSON.stringify(bookings), { status: 200 });
//     } catch (err) {
//         console.error("Failed to fetch group bookings:", err);
//         return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
//     }
// }


// export async function POST(req) {
//     try {
//         const data = await req.json();

//         // تأكد من وجود المجموعة
//         const group = await prisma.groupMaster.findUnique({ where: { id: data.groupId } });
//         if (!group) throw new Error("Group not found");

//         // اختياري: إنشاء Guest جديد باسم "Group Guest" إذا لم يُرسل guestId
//         let guestId = data.guestId;
//         if (!guestId) {
//             const guest = await prisma.guest.create({
//                 data: {
//                     firstName: "Group Guest",
//                     lastName: group.name,
//                     hotelGroupId: null,
//                     propertyId: data.propertyId,
//                 },
//             });
//             guestId = guest.id;
//         }

//         // إنشاء الحجز
//         const booking = await prisma.booking.create({
//             data: {
//                 property: { connect: { id: data.propertyId } },
//                 group: data.groupId ? { connect: { id: data.groupId } } : undefined,
//                 guest: { connect: { id: guestId } },
//                 room: data.roomId ? { connect: { id: data.roomId } } : undefined,
//                 roomBlock: data.roomBlockId ? { connect: { id: data.roomBlockId } } : undefined, // ✅ جديد
//                 ratePlan: data.ratePlanId ? { connect: { id: data.ratePlanId } } : undefined,

//                 checkIn: new Date(data.checkIn),
//                 checkOut: new Date(data.checkOut),
//                 adults: data.adults,
//                 children: data.children,
//                 specialRequests: data.specialRequests,
//                 status: "Booked",
//             },
//             include: {
//                 group: true,
//                 property: true,
//                 guest: true,
//                 room: true,
//                 roomBlock: true, // ✅ جديد
//                 ratePlan: true,
//                 folio: true,
//                 company: true,
//                 extras: true,
//             },
//         });

//         // 📢 بث الحدث عبر socket بعد الإنشاء
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "GROUPBOOKING_CREATED", data: booking }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(booking), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }




// الكود الاعلى نسخة اصلية



import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const groupId = searchParams.get("groupId");
        if (!groupId) return new Response("GroupId is required", { status: 400 });

        const bookings = await prisma.booking.findMany({
            where: { groupId },
            include: {
                guest: true,
                property: true,
                room: true,
                ratePlan: true,
                folio: true,
                company: true,
                group: true,
                extras: true,
            },
        });

        return new Response(JSON.stringify(bookings), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch group bookings:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}


export async function POST(req) {
    try {
        const data = await req.json();

        // --- تحقق من وجود المجموعة ---
        const group = await prisma.groupMaster.findUnique({ where: { id: data.groupId } });
        if (!group) throw new Error("Group not found");

        // --- إنشاء Guest افتراضي إذا لم يُرسل guestId ---
        let guestId = data.guestId;
        if (!guestId) {
            const guest = await prisma.guest.create({
                data: {
                    firstName: "Group Guest",
                    lastName: group.name,
                    hotelGroupId: null,
                    propertyId: data.propertyId,
                },
            });
            guestId = guest.id;
        }

        // --- إنشاء الحجز ---
        const booking = await prisma.booking.create({
            data: {
                property: { connect: { id: data.propertyId } },
                group: data.groupId ? { connect: { id: data.groupId } } : undefined,
                guest: { connect: { id: guestId } },
                room: data.roomId ? { connect: { id: data.roomId } } : undefined,
                roomBlock: data.roomBlockId ? { connect: { id: data.roomBlockId } } : undefined,
                ratePlan: data.ratePlanId ? { connect: { id: data.ratePlanId } } : undefined,
                checkIn: new Date(data.checkIn),
                checkOut: new Date(data.checkOut),
                adults: data.adults ?? 1,
                children: data.children ?? 0,
                specialRequests: data.specialRequests || "",
                status: "Booked",
            },
            include: {
                group: true,
                property: true,
                guest: true,
                room: true,
                roomBlock: true,
                ratePlan: true,
                folio: true,      // قد يكون null بعد الإنشاء
                company: true,
                extras: true,
            },
        });

        // --- إنشاء Folio تلقائي ---
        let folio = await prisma.folio.create({
            data: {
                bookingId: booking.id,
                status: "Open",
                charges: [],
                payments: [],
            },
        });

        booking.folio = folio; // لإعادة Folio مع booking

        // --- إنشاء Extras إذا أرسلها المستخدم ---
        if (data.extras?.length) {
            const createdExtras = await Promise.all(
                data.extras.map(ex =>
                    prisma.extra.create({
                        data: { ...ex, bookingId: booking.id }
                    })
                )
            );
            booking.extras = createdExtras;
        }

        // --- بث الحدث عبر Socket ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUPBOOKING_CREATED", data: booking }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(booking), { status: 200 });

    } catch (err) {
        console.error("Create group booking failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
