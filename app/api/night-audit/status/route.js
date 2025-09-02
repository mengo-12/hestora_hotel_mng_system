// app/api/night-audit/status/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
        return NextResponse.json({ error: "Property required" }, { status: 400 });
    }

    const logs = await prisma.auditLog.findMany({
        where: { propertyId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return NextResponse.json({ logs });
}
