// // app/api/companies/route.js
// import prisma from "@/lib/prisma";

// export async function GET() {
//     try {
//         const companies = await prisma.company.findMany({
//             include: {
//                 property: true,
//                 bookings: { include: { folio: { include: { charges: true, payments: true, guests: true } } } },
//                 folios: { include: { charges: true, payments: true, guests: true } }, // جلب كل الفواتير
//                 groups: true,
//                 groupMasters: true,
//             },
//         });

//         // احتساب totals لكل شركة
//         const enriched = companies.map(c => {
//             const allFolios = [
//                 ...c.folios, // كل فواتير الشركة
//                 ...c.bookings.map(b => b.folio).filter(f => f !== null), // الفواتير الفردية إذا وجدت
//             ];

//             const allCharges = allFolios.flatMap(f => f.charges || []);
//             const allPayments = allFolios.flatMap(f => f.payments || []);
//             const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
//             const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
//             const totalCharges = subtotal + taxTotal;
//             const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
//             const balance = totalCharges - totalPayments;

//             return { ...c, companyTotals: { subtotal, taxTotal, totalCharges, totalPayments, balance } };
//         });

//         return new Response(JSON.stringify(enriched), { status: 200 });
//     } catch (err) {
//         console.error("Failed to fetch companies:", err);
//         return new Response(JSON.stringify({ error: "Failed to fetch companies" }), { status: 500 });
//     }
// }




// export async function POST(req) {
//     try {
//         const body = await req.json();
//         const newCompany = await prisma.company.create({
//             data: {
//                 name: body.name,
//                 code: body.code,
//                 creditLimit: body.creditLimit || null,
//                 rateAgreement: body.rateAgreement || null,
//                 propertyId: body.propertyId,
//             },
//         });

//         // 🔔 بث الشركة الجديدة
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "COMPANY_ADDED", data: newCompany }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(newCompany), { status: 201 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to create company" }), { status: 500 });
//     }
// }

// export async function PUT(req, { params }) {
//     try {
//         const body = await req.json();
//         const updatedCompany = await prisma.company.update({
//             where: { id: params.id },
//             data: {
//                 name: body.name,
//                 code: body.code,
//                 creditLimit: body.creditLimit || null,
//                 rateAgreement: body.rateAgreement || null,
//             },
//         });

//         // 🔔 بث تحديث الشركة
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "COMPANY_UPDATED", data: updatedCompany }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(updatedCompany));
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to update company" }), { status: 500 });
//     }
// }

// export async function DELETE(req, { params }) {
//     try {
//         const deletedCompany = await prisma.company.delete({ where: { id: params.id } });

//         // 🔔 بث حذف الشركة
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "COMPANY_DELETED", data: deletedCompany }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(deletedCompany));
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to delete company" }), { status: 500 });
//     }
// }



// الكود الاعلى اصلي




import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                property: true,
                bookings: {
                    include: {
                        folio: {
                            include: {
                                charges: true,
                                payments: true,
                                // guests: غير موجود هنا
                            }
                        }
                    }
                },
                folios: {
                    include: {
                        charges: true,
                        payments: true,
                        // guests: غير موجود هنا
                    }
                },
                groups: true,
                groupMasters: true,
            }
        });


        const enriched = companies.map(c => {
            const allFolios = [
                ...c.folios,
                ...c.bookings.map(b => b.folio).filter(f => f !== null),
            ];

            const allCharges = allFolios.flatMap(f => f.charges || []);
            const allPayments = allFolios.flatMap(f => f.payments || []);
            const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
            const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
            const totalCharges = subtotal + taxTotal;
            const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const balance = totalCharges - totalPayments;

            return { ...c, companyTotals: { subtotal, taxTotal, totalCharges, totalPayments, balance } };
        });

        return new Response(JSON.stringify(enriched), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch companies:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch companies" }), { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const newCompany = await prisma.company.create({
            data: {
                name: body.name,
                code: body.code,
                creditLimit: body.creditLimit || null,
                rateAgreement: body.rateAgreement || null,
                propertyId: body.propertyId,
            },
        });

        try { await fetch("http://localhost:3001/api/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "COMPANY_ADDED", data: newCompany }) }); }
        catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(newCompany), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create company" }), { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const body = await req.json();
        const updatedCompany = await prisma.company.update({
            where: { id: params.id },
            data: {
                name: body.name,
                code: body.code,
                creditLimit: body.creditLimit || null,
                rateAgreement: body.rateAgreement || null,
            },
        });

        try { await fetch("http://localhost:3001/api/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "COMPANY_UPDATED", data: updatedCompany }) }); }
        catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedCompany));
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update company" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const deletedCompany = await prisma.company.delete({ where: { id: params.id } });

        try { await fetch("http://localhost:3001/api/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "COMPANY_DELETED", data: deletedCompany }) }); }
        catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(deletedCompany));
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete company" }), { status: 500 });
    }
}
