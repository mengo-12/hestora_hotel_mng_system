// import prisma from "@/lib/prisma";

// export async function GET(req, { params }) {
//     try {
//         const { groupId } = params;

//         // جلب كل الحجوزات ضمن المجموعة مع الضيف والغرفة والفوليو
//         const bookings = await prisma.booking.findMany({
//             where: { groupId },
//             include: { 
//                 guest: true,
//                 room: true,
//                 folio: { 
//                     include: { 
//                         charges: true, 
//                         payments: true, 
//                         booking: { include: { guest: true, room: true } } 
//                     } 
//                 }
//             }
//         });

//         // جمع كل الفواتير الموجودة ضمن هذه الحجوزات
//         let folios = bookings
//             .map(b => b.folio)
//             .filter(f => f !== null)
//             .map(f => {
//                 // تأكد من أن كل folio يحتوي على booking، guest، room
//                 if(!f.booking && f.bookingId){
//                     const bookingData = bookings.find(b => b.id === f.bookingId);
//                     if(bookingData) f.booking = bookingData;
//                 }
//                 return f;
//             });

//         // إذا لم يوجد folio لأي حجز، يمكن إنشاء folio يمثل المجموعة
//         if (folios.length === 0 && bookings.length > 0) {
//             const folio = await prisma.folio.create({
//                 data: {
//                     bookingId: bookings[0].id,
//                     status: "Open"
//                 },
//                 include: { 
//                     charges: true, 
//                     payments: true, 
//                     booking: { include: { guest: true, room: true } } 
//                 }
//             });
//             folios = [folio];
//         }

//         return new Response(JSON.stringify(folios), { status: 200 });
//     } catch (err) {
//         console.error("Failed to fetch group folios:", err);
//         return new Response(JSON.stringify({ error: "Failed to fetch folios" }), { status: 500 });
//     }
// }




// الكود الاعلى اصلي




import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { groupId } = params;

        const bookings = await prisma.booking.findMany({
            where: { groupId },
            include: {
                guest: true,
                room: true,
                folio: { include: { charges: true, payments: true, booking: { include: { guest: true, room: true } } } }
            }
        });

        let folios = bookings
            .map(b => b.folio)
            .filter(f => f != null)
            .map(f => {
                if (!f.booking && f.bookingId) {
                    const bookingData = bookings.find(b => b.id === f.bookingId);
                    if (bookingData) f.booking = bookingData;
                }
                return f;
            });

        if (folios.length === 0 && bookings.length > 0) {
            const folio = await prisma.folio.create({
                data: { bookingId: bookings[0].id, status: "Open" },
                include: { charges: true, payments: true, booking: { include: { guest: true, room: true } } }
            });
            folios = [folio];
        }

        // حساب totals على مستوى المجموعة
        const allCharges = folios.flatMap(f => f.charges || []);
        const allPayments = folios.flatMap(f => f.payments || []);
        const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
        const totalCharges = subtotal + taxTotal;
        const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const balance = totalCharges - totalPayments;

        return new Response(JSON.stringify({ folios, groupTotals: { subtotal, taxTotal, totalCharges, totalPayments, balance } }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch folios" }), { status: 500 });
    }
}
