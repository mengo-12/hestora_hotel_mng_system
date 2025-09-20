import prisma from "@/lib/prisma";

// export async function PUT(req, { params }) {
//     const { id } = await params; // ✅ params لازم await

//     try {
//         const body = await req.json();

//         const updatedBooking = await prisma.booking.update({
//             where: { id },
//             data: {
//                 group: body.groupId ? { connect: { id: body.groupId } } : undefined,
//                 property: body.propertyId ? { connect: { id: body.propertyId } } : undefined,
//                 room: body.roomId ? { connect: { id: body.roomId } } : undefined,
//                 roomBlock: body.roomBlockId ? { connect: { id: body.roomBlockId } } : undefined, // ✅ جديد
//                 ratePlan: body.ratePlanId ? { connect: { id: body.ratePlanId } } : undefined,
//                 checkIn: body.checkIn ? new Date(body.checkIn) : null,
//                 checkOut: body.checkOut ? new Date(body.checkOut) : null,
//                 adults: body.adults ?? 1,
//                 children: body.children ?? 0,
//                 specialRequests: body.specialRequests || "",
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
//         // 📢 بث
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "GROUPBOOKING_UPDATED", data: updatedBooking }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(updatedBooking), { status: 200 });
//     } catch (err) {
//         console.error("Update group booking failed:", err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }


// الكود الاعلى نسخة اصلية


export async function PUT(req, { params }) {
    const { id } = params;

    try {
        const body = await req.json();

        // --- تحديث بيانات الحجز ---
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                property: body.propertyId ? { connect: { id: body.propertyId } } : undefined,
                group: body.groupId ? { connect: { id: body.groupId } } : undefined,
                room: body.roomId ? { connect: { id: body.roomId } } : undefined,
                roomBlock: body.roomBlockId ? { connect: { id: body.roomBlockId } } : undefined,
                ratePlan: body.ratePlanId ? { connect: { id: body.ratePlanId } } : undefined,
                checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
                checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
                adults: body.adults ?? undefined,
                children: body.children ?? undefined,
                specialRequests: body.specialRequests ?? undefined,
            },
            include: {
                group: true,
                property: true,
                guest: true,
                room: true,
                roomBlock: true,
                ratePlan: true,
                folio: true,
                company: true,
                extras: true,
            },
        });

        // --- تأكد أن Folio موجود ---
        let folio = updatedBooking.folio;
        if (!folio) {
            folio = await prisma.folio.create({
                data: { bookingId: updatedBooking.id, status: "Open", charges: [], payments: [] },
            });
        }

        updatedBooking.folio = folio;

        // --- تحديث أو إضافة Extras ---
        if (Array.isArray(body.extras)) {
            // حذف كل Extras القديمة أولاً
            await prisma.extra.deleteMany({ where: { bookingId: updatedBooking.id } });
            
            // إنشاء Extras جديدة
            const newExtras = await Promise.all(
                body.extras.map(ex => prisma.extra.create({ data: { ...ex, bookingId: updatedBooking.id } }))
            );
            updatedBooking.extras = newExtras;
        }

        // --- بث الحدث عبر Socket ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUPBOOKING_UPDATED", data: updatedBooking }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });

    } catch (err) {
        console.error("Update group booking failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}



export async function DELETE(req, { params }) {
    const { id } = await params; // ✅ params لازم await

    try {
        await prisma.booking.delete({ where: { id } });

        // 📢 بث
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUPBOOKING_DELETED", data: { id } }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ message: "Booking deleted" }), { status: 200 });
    } catch (err) {
        console.error("Delete group booking failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}