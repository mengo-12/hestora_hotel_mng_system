// import prisma from "@/lib/prisma";

// export async function GET(req, { params }) {
//     try {
//         const { bookingId } = params;

//         const folio = await prisma.folio.findUnique({
//             where: { bookingId },
//             include: {
//                 charges: { include: { postedBy: true } },
//                 payments: { include: { postedBy: true } },
//                 guest: true,              // بيانات النزيل
//                 booking: {                // بيانات الحجز
//                     include: {
//                         room: true,       // رقم الغرفة
//                         property: true,   // اسم الفندق
//                         guest: true,      // للتأكيد على بيانات النزيل
//                     }
//                 }
//             },
//         });

//         if (!folio) {
//             return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });
//         }

//         return new Response(JSON.stringify(folio), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
//     }
// }


// export async function PATCH(req, { params }) {
//     try {
//         const { bookingId } = params;
//         const { status } = await req.json();

//         const folio = await prisma.folio.update({
//             where: { bookingId },
//             data: { status },
//         });

//         return new Response(JSON.stringify(folio), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to update folio" }), { status: 500 });
//     }
// }



// الكود الاعلى نسخة اصلية

import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    const { bookingId } = params;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { group: true }
        });

        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        let folios = [];

        if (booking.groupId) {
            // جلب جميع الفواتير المرتبطة بالمجموعة
            folios = await prisma.folio.findMany({
                where: { booking: { groupId: booking.groupId } },
                include: {
                    charges: { include: { postedBy: true } },
                    payments: { include: { postedBy: true } },
                    guest: true,
                    booking: { include: { room: true, guest: true } }
                },
            });
        } else {
            // folio فردي
            let folio = await prisma.folio.findUnique({
                where: { bookingId },
                include: {
                    charges: { include: { postedBy: true } },
                    payments: { include: { postedBy: true } },
                    guest: true,
                    booking: { include: { room: true, guest: true } }
                },
            });

            if (!folio) {
                // إذا لم يوجد folio فردي، نقوم بإنشائه
                folio = await prisma.folio.create({
                    data: { bookingId },
                    include: {
                        charges: true,
                        payments: true,
                        guest: true,
                        booking: true
                    }
                });
            }
            folios.push(folio);
        }

        return new Response(JSON.stringify(folios), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
    }
}

