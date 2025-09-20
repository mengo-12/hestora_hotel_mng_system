// import prisma from "@/lib/prisma";

// export async function GET(req) {
//     const bookingId = new URL(req.url).searchParams.get("bookingId");
//     if (!bookingId) {
//         return new Response(JSON.stringify({ error: "bookingId required" }), { status: 400 });
//     }

//     const folio = await prisma.folio.findUnique({
//         where: { bookingId },
//         include: {
//             charges: {
//                 include: { postedBy: true }, // جلب اسم المستخدم
//             },
//             payments: {
//                 include: { postedBy: true }, // جلب اسم المستخدم
//             },
//             guest: true,
//             booking: true,
//         },
//     });

//     return new Response(JSON.stringify(folio), { status: 200 });
// }

// export async function POST(req) {
//     const { bookingId, guestId } = await req.json();
//     if (!bookingId || !guestId) {
//         return new Response(JSON.stringify({ error: "Missing bookingId or guestId" }), { status: 400 });
//     }

//     const folio = await prisma.folio.create({
//         data: { bookingId, guestId },
//         include: {
//             charges: { include: { postedBy: true } },
//             payments: { include: { postedBy: true } },
//         },
//     });

//     // Broadcast عالمي
//     try {
//         await fetch("http://localhost:3001/api/broadcast", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ event: "FOLIO_CREATED", data: folio }),
//         });
//     } catch (err) {
//         console.error(err);
//     }

//     return new Response(JSON.stringify(folio), { status: 201 });
// }


// الكود الاعلى نسخة اصلية



import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    const { bookingId } = params;

    if (!bookingId) {
        return new Response(JSON.stringify({ error: "bookingId is required" }), { status: 400 });
    }

    try {
        // جلب الحجز أو group مع الفواتير
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                guest: true,
                company: true,
                room: true,
                property: true,
                ratePlan: true,
                folio: {
                    include: {
                        charges: true,
                        payments: true,
                        extras: true
                    }
                },
                extras: true // Extras مرتبطة بالحجز مباشرة
            }
        });

        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        // إذا Folio غير موجود، ننشئ هيكل فارغ لتجنب مشاكل العرض
        const folioData = {
            ...booking,
            charges: booking.folio?.charges || [],
            payments: booking.folio?.payments || [],
            extras: booking.folio?.extras?.length > 0 ? booking.folio.extras : booking.extras || [],
        };

        return new Response(JSON.stringify(folioData), { status: 200 });

    } catch (err) {
        console.error("Failed to fetch folio:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
    }
}


