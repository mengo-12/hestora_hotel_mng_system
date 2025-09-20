import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// --- GET: جلب كل المجموعات ---
export async function GET(req) {
    try {
        const groups = await prisma.groupMaster.findMany({
            include: {
                property: true,
                company: true,
                leader: true,
                roomBlocks: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return new Response(JSON.stringify(groups), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch groups:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch groups" }), { status: 500 });
    }
}

// --- POST: إنشاء مجموعة جديدة ---
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { propertyId, companyId, leaderId, code, name, description, startDate, endDate, roomBlockIds } = await req.json();
        if (!propertyId || !code || !name) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });

        const newGroup = await prisma.groupMaster.create({
            data: {
                propertyId,
                companyId: companyId || null,
                leaderId: leaderId || null,
                code,
                name,
                description: description || "",
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                roomBlocks: {
                    connect: roomBlockIds?.map(id => ({ id })) || []
                }
            },
            include: { property: true, company: true, leader: true, roomBlocks: true },
        });

        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUP_CREATED", data: newGroup }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(newGroup), { status: 201 });
    } catch (err) {
        console.error("Failed to create group:", err);
        return new Response(JSON.stringify({ error: "Failed to create group" }), { status: 500 });
    }
}



// --- حذف مجموعة ---
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { id } = params;

        await prisma.groupMaster.delete({ where: { id } });

        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUP_UPDATED", data: updatedGroup }), // أو GROUP_DELETED
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Failed to delete group:", err);
        return new Response(JSON.stringify({ error: "Failed to delete group" }), { status: 500 });
    }
}
