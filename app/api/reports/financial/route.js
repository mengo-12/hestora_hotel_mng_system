// import prisma from "@/lib/prisma";

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const propertyId = searchParams.get("propertyId");
//         const startDate = searchParams.get("startDate"); // YYYY-MM-DD
//         const endDate = searchParams.get("endDate");     // YYYY-MM-DD

//         if (!propertyId) {
//             return new Response(JSON.stringify({ error: "PropertyId is required" }), { status: 400 });
//         }

//         // ====== جلب Folios المرتبطة بالفندق ======
//         const folios = await prisma.folio.findMany({
//             where: {
//                 booking: { propertyId }
//             },
//             include: {
//                 charges: { include: { postedBy: true } },
//                 payments: { include: { postedBy: true } },
//                 extras: { include: { booking: { include: { guest: true } } } },
//                 booking: { include: { guest: true } }
//             }
//         });

//         let transactions = [];
//         let totalCharges = 0;
//         let totalPayments = 0;

//         folios.forEach(folio => {
//             // Charges
//             folio.charges.forEach(c => {
//                 const dateCheck = (!startDate || new Date(c.postedAt) >= new Date(startDate))
//                                && (!endDate || new Date(c.postedAt) <= new Date(endDate));
//                 if (!dateCheck) return;

//                 transactions.push({
//                     id: c.id,
//                     type: "Charge",
//                     description: c.description,
//                     amount: Number(c.amount),
//                     postedAt: c.postedAt,
//                     by: c.postedBy?.name || "Unknown",
//                     role: c.postedBy?.role || "Unknown",
//                     guest: folio.booking.guest ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}` : "-",
//                     bookingId: folio.bookingId
//                 });
//                 totalCharges += Number(c.amount);
//             });

//             // Payments
//             folio.payments.forEach(p => {
//                 const dateCheck = (!startDate || new Date(p.postedAt) >= new Date(startDate))
//                                && (!endDate || new Date(p.postedAt) <= new Date(endDate));
//                 if (!dateCheck) return;

//                 transactions.push({
//                     id: p.id,
//                     type: "Payment",
//                     description: p.method,
//                     amount: Number(p.amount),
//                     postedAt: p.postedAt,
//                     by: p.postedBy?.name || "Unknown",
//                     role: p.postedBy?.role || "Unknown",
//                     guest: folio.booking.guest ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}` : "-",
//                     bookingId: folio.bookingId
//                 });
//                 totalPayments += Number(p.amount);
//             });

//             // Extras (مدفوعة وغير مدفوعة)
//             folio.extras.forEach(e => {
//                 const dateCheck = (!startDate || new Date(e.createdAt) >= new Date(startDate))
//                                && (!endDate || new Date(e.createdAt) <= new Date(endDate));
//                 if (!dateCheck) return;

//                 const guestName = e.guest
//                     ? `${e.guest.firstName} ${e.guest.lastName}`
//                     : folio.booking.guest
//                         ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}`
//                         : "-";

//                 transactions.push({
//                     id: e.id,
//                     type: "Extra",
//                     description: e.name,
//                     amount: Number(e.unitPrice) * e.quantity,
//                     postedAt: e.createdAt,
//                     by: "-", // Extras عادة لا يكون لها موظف محدد
//                     role: "-",
//                     guest: guestName,
//                     bookingId: folio.bookingId
//                 });

//                 if (e.status === "Paid") totalPayments += Number(e.unitPrice) * e.quantity;
//                 else totalCharges += Number(e.unitPrice) * e.quantity;
//             });
//         });

//         // ترتيب العمليات حسب التاريخ نزولاً
//         transactions.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

//         const profitLoss = totalPayments - totalCharges;

//         return new Response(
//             JSON.stringify({
//                 transactions,
//                 totalCharges,
//                 totalPayments,
//                 profitLoss
//             }),
//             { status: 200 }
//         );

//     } catch (error) {
//         console.error(error);
//         return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
//     }
// }




import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const startDate = searchParams.get("startDate"); // YYYY-MM-DD
        const endDate = searchParams.get("endDate");     // YYYY-MM-DD
        const typeFilter = searchParams.get("type");     // Charge / Payment / Extra
        const employeeFilter = searchParams.get("employee"); // اسم الموظف

        if (!propertyId) {
            return new Response(JSON.stringify({ error: "PropertyId is required" }), { status: 400 });
        }

        // ====== جلب Folios المرتبطة بالفندق ======
        const folios = await prisma.folio.findMany({
            where: { booking: { propertyId } },
            include: {
                charges: { include: { postedBy: true } },
                payments: { include: { postedBy: true } },
                extras: { include: { guest: true, booking: { include: { guest: true } } } },
                booking: { include: { guest: true } }
            }
        });

        let transactions = [];
        let totalCharges = 0;
        let totalPayments = 0;
        let summaryByType = { Charge: 0, Payment: 0, Extra: 0 };

        folios.forEach(folio => {
            // Charges
            folio.charges.forEach(c => {
                const dateCheck = (!startDate || new Date(c.postedAt) >= new Date(startDate))
                               && (!endDate || new Date(c.postedAt) <= new Date(endDate));
                if (!dateCheck) return;
                if (typeFilter && typeFilter !== "Charge") return;
                if (employeeFilter && !c.postedBy?.name.toLowerCase().includes(employeeFilter.toLowerCase())) return;

                const amount = Number(c.amount);
                transactions.push({
                    id: c.id,
                    type: "Charge",
                    description: c.description,
                    amount,
                    postedAt: c.postedAt,
                    by: c.postedBy?.name || "Unknown",
                    role: c.postedBy?.role || "Unknown",
                    guest: folio.booking.guest ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}` : "-",
                    bookingId: folio.bookingId,
                    paymentMethod: "-",
                    status: "Paid"
                });
                totalCharges += amount;
                summaryByType.Charge += amount;
            });

            // Payments
            folio.payments.forEach(p => {
                const dateCheck = (!startDate || new Date(p.postedAt) >= new Date(startDate))
                               && (!endDate || new Date(p.postedAt) <= new Date(endDate));
                if (!dateCheck) return;
                if (typeFilter && typeFilter !== "Payment") return;
                if (employeeFilter && !p.postedBy?.name.toLowerCase().includes(employeeFilter.toLowerCase())) return;

                const amount = Number(p.amount);
                transactions.push({
                    id: p.id,
                    type: "Payment",
                    description: p.method,
                    amount,
                    postedAt: p.postedAt,
                    by: p.postedBy?.name || "Unknown",
                    role: p.postedBy?.role || "Unknown",
                    guest: folio.booking.guest ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}` : "-",
                    bookingId: folio.bookingId,
                    paymentMethod: p.method || "-",
                    status: "Paid"
                });
                totalPayments += amount;
                summaryByType.Payment += amount;
            });

            // Extras
            folio.extras.forEach(e => {
                const dateCheck = (!startDate || new Date(e.createdAt) >= new Date(startDate))
                               && (!endDate || new Date(e.createdAt) <= new Date(endDate));
                if (!dateCheck) return;
                if (typeFilter && typeFilter !== "Extra") return;

                const guestName = e.guest
                    ? `${e.guest.firstName} ${e.guest.lastName}`
                    : folio.booking.guest
                        ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}`
                        : "-";

                const amount = Number(e.unitPrice) * e.quantity;
                transactions.push({
                    id: e.id,
                    type: "Extra",
                    description: e.name,
                    amount,
                    postedAt: e.createdAt,
                    by: "-", // عادة لا يكون موظف محدد
                    role: "-",
                    guest: guestName,
                    bookingId: folio.bookingId,
                    paymentMethod: "-",
                    status: e.status || "Unpaid"
                });

                if (e.status === "Paid") totalPayments += amount;
                else totalCharges += amount;
                summaryByType.Extra += amount;
            });
        });

        // ترتيب العمليات حسب التاريخ نزولاً
        transactions.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

        const profitLoss = totalPayments - totalCharges;

        return new Response(
            JSON.stringify({
                transactions,
                totalCharges,
                totalPayments,
                profitLoss,
                summaryByType
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
