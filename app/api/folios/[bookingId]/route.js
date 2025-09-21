// import prisma from "@/lib/prisma";

// export async function GET(req, { params }) {
//     const { bookingId } = params;

//     try {
//         const booking = await prisma.booking.findUnique({
//             where: { id: bookingId },
//             include: { group: true }
//         });

//         if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

//         let folios = [];

//         if (booking.groupId) {
//             // جلب جميع الفواتير المرتبطة بالمجموعة
//             folios = await prisma.folio.findMany({
//                 where: { booking: { groupId: booking.groupId } },
//                 include: {
//                     charges: { include: { postedBy: true } },
//                     payments: { include: { postedBy: true } },
//                     guest: true,
//                     booking: { include: { room: true, guest: true } }
//                 },
//             });
//         } else {
//             // folio فردي
//             let folio = await prisma.folio.findUnique({
//                 where: { bookingId },
//                 include: {
//                     charges: { include: { postedBy: true } },
//                     payments: { include: { postedBy: true } },
//                     guest: true,
//                     booking: { include: { room: true, guest: true } }
//                 },
//             });

//             if (!folio) {
//                 // إذا لم يوجد folio فردي، نقوم بإنشائه
//                 folio = await prisma.folio.create({
//                     data: { bookingId },
//                     include: {
//                         charges: true,
//                         payments: true,
//                         guest: true,
//                         booking: true
//                     }
//                 });
//             }
//             folios.push(folio);
//         }

//         return new Response(JSON.stringify(folios), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
//     }
// }



// الكود الاعلى نسخة اصلية

import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    const { bookingId } = params;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                guest: true,
                room: true,
                company: true,
                group: true,
                property: true,
                ratePlan: true
            }
        });

        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        let folios = [];

        if (booking.groupId) {
            // folio المجموعة كما هو
            folios = await prisma.folio.findMany({
                where: { booking: { groupId: booking.groupId } },
                include: {
                    charges: { include: { postedBy: true } },
                    payments: { include: { postedBy: true } },
                    booking: { include: { room: true, guest: true } }
                },
            });
        } else if (booking.companyId) {
            // folio الشركة: نبحث عن folio الشركة
            let folio = await prisma.folio.findFirst({
                where: { companyId: booking.companyId },
                include: {
                    charges: { include: { postedBy: true } },
                    payments: { include: { postedBy: true } },
                    bookings: { include: { guest: true, room: true } }
                }
            });

            // إذا لم يوجد folio للشركة ننشئه
            if (!folio) {
                folio = await prisma.folio.create({
                    data: { companyId: booking.companyId },
                    include: {
                        charges: true,
                        payments: true,
                        bookings: { include: { guest: true, room: true } }
                    }
                });
            }

            // نضمن ظهور الحجز الحالي ضمن Folio الشركة
            folios.push(folio);
        } else {
            // folio فردي
            let folio = await prisma.folio.findUnique({
                where: { bookingId },
                include: {
                    charges: { include: { postedBy: true } },
                    payments: { include: { postedBy: true } },
                    booking: { include: { room: true, guest: true } }
                },
            });

            if (!folio) {
                folio = await prisma.folio.create({
                    data: { bookingId },
                    include: {
                        charges: true,
                        payments: true,
                        booking: { include: { guest: true, room: true } }
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


