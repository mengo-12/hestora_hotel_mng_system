import prisma from "@/lib/prisma"; 

export async function PUT(req, { params }) {
    const { id } = params; // هذا هو companyId
    try {
        const body = await req.json();

        // تحديث الشركة
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
