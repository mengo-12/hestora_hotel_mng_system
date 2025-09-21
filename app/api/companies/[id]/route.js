// import prisma from "@/lib/prisma"; 

// export async function PUT(req, { params }) {
//     const { id } = params; // هذا هو companyId
//     try {
//         const body = await req.json();

//         // تحديث الشركة
//         const updatedCompany = await prisma.company.update({
//             where: { id },
//             data: {
//                 name: body.name,
//                 code: body.code,
//                 propertyId: body.propertyId,
//                 creditLimit: body.creditLimit ?? null,
//                 rateAgreement: body.rateAgreement ?? null
//             },
//         });

//         // --- البث بعد التحديث ---
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "COMPANY_UPDATED", data: updatedCompany }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(updatedCompany), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//     }
// }




// الكود الاعلى اصلي




import prisma from "@/lib/prisma"; 

export async function PUT(req, { params }) {
    const { id } = params; 
    try {
        const body = await req.json();

        const updatedCompany = await prisma.company.update({
            where: { id },
            data: {
                name: body.name,
                code: body.code,
                propertyId: body.propertyId,
                creditLimit: body.creditLimit ?? null,
                rateAgreement: body.rateAgreement ?? null
            },
        });

        // --- البث بعد التحديث ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "COMPANY_UPDATED", data: updatedCompany }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedCompany), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = params; 
    try {
        const deletedCompany = await prisma.company.delete({ where: { id } });

        // --- البث بعد الحذف ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "COMPANY_DELETED", data: { id } }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(deletedCompany), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
