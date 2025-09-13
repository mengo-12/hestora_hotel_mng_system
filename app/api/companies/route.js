// app/api/companies/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 🔹 Get all companies
export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            include: { property: { select: { id: true, name: true } } },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(companies);
    } catch (error) {
        console.error("❌ Error fetching companies:", error);
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }
}

// 🔹 Create new company
export async function POST(req) {
    try {
        const { name, code, propertyId, creditLimit, rateAgreement } = await req.json();

        if (!name || !code || !propertyId)
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const newCompany = await prisma.company.create({
            data: { name, code, propertyId, creditLimit, rateAgreement },
        });

        // 🔹 Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "COMPANY_CREATED",
                    data: newCompany,
                }),
            });
        } catch (err) {
            console.error("❌ Socket broadcast failed:", err);
        }

        return NextResponse.json(newCompany, { status: 201 });
    } catch (error) {
        console.error("❌ Error creating company:", error);
        return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }
}

// 🔹 Update company
export async function PUT(req) {
    try {
        const data = await req.json();
        const { id, name, code, propertyId, creditLimit, rateAgreement } = data;

        if (!id) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

        const updatedCompany = await prisma.company.update({
            where: { id },
            data: {
                name,
                code,
                propertyId,
                creditLimit: creditLimit ? parseFloat(creditLimit) : null,
                rateAgreement,
            },
        });

        // 🔹 Broadcast عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "COMPANY_UPDATED",
                    data: updatedCompany
                }),
            });
        } catch (err) {
            console.error("❌ Global broadcast failed:", err);
        }

        return NextResponse.json(updatedCompany);

    } catch (error) {
        console.error("❌ Error updating company:", error);
        return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }
}

// 🔹 Delete company
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

        const deleted = await prisma.company.delete({ where: { id } });

        // 🔹 Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "COMPANY_DELETED",
                    data: { companyId: id },
                }),
            });
        } catch (err) {
            console.error("❌ Socket broadcast failed:", err);
        }

        return NextResponse.json({ message: "Company deleted", company: deleted });
    } catch (error) {
        console.error("❌ Error deleting company:", error);
        return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
    }
}
