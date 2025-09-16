import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const companies = await prisma.company.findMany({
            include: {
                bookings: true,
                groups: true,
            },
        });
        return new Response(JSON.stringify(companies));
    } catch (err) {
        console.error(err);
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

        // 🔔 بث الشركة الجديدة
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "COMPANY_CREATED", data: newCompany }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

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

        // 🔔 بث تحديث الشركة
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "COMPANY_UPDATED", data: updatedCompany }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedCompany));
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update company" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const deletedCompany = await prisma.company.delete({ where: { id: params.id } });

        // 🔔 بث حذف الشركة
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "COMPANY_DELETED", data: deletedCompany }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(deletedCompany));
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete company" }), { status: 500 });
    }
}
