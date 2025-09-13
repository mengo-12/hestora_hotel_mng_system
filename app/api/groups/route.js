// app/api/groups/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 🔹 Get all groups
export async function GET(req) {
    try {
        const groups = await prisma.groupMaster.findMany({
            include: {
                property: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
                leader: { select: { id: true, firstName: true, lastName: true } },
                roomBlocks: true,
                bookings: true,
                folios: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("❌ Error fetching groups:", error);
        return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }
}

// 🔹 Create a new group
export async function POST(req) {
    try {
        const data = await req.json();
        const { propertyId, name, leaderId, companyId, startDate, endDate, notes } = data;

        if (!propertyId || !name || !leaderId || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newGroup = await prisma.groupMaster.create({
            data: {
                propertyId,
                name,
                leaderId,
                companyId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                notes,
            },
        });

        // 🔹 جلب البيانات مع العلاقات كاملة للبث
        const newGroupWithRelations = await prisma.groupMaster.findUnique({
            where: { id: newGroup.id },
            include: {
                property: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
                leader: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        // 🔹 Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "GROUP_CREATED",
                    data: newGroupWithRelations,
                }),
            });
        } catch (err) {
            console.error("❌ Socket broadcast failed:", err);
        }

        return NextResponse.json(newGroupWithRelations, { status: 201 });
    } catch (error) {
        console.error("❌ Error creating group:", error);
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
}

// 🔹 Update group
export async function PUT(req) {
    try {
        const data = await req.json();
        const { id, name, leaderId, companyId, startDate, endDate, notes } = data;

        if (!id) return NextResponse.json({ error: "Missing group ID" }, { status: 400 });

        await prisma.groupMaster.update({
            where: { id },
            data: {
                name,
                leaderId,
                companyId,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                notes,
            },
        });

        // 🔹 جلب البيانات بعد التحديث مع العلاقات كاملة للبث
        const updatedGroup = await prisma.groupMaster.findUnique({
            where: { id },
            include: {
                property: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
                leader: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        // 🔹 Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "GROUP_UPDATED",
                    data: updatedGroup,
                }),
            });
        } catch (err) {
            console.error("❌ Socket broadcast failed:", err);
        }

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error("❌ Error updating group:", error);
        return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
    }
}

// 🔹 Delete group
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing group ID" }, { status: 400 });

        const deletedGroup = await prisma.groupMaster.delete({ where: { id } });

        // 🔹 Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "GROUP_DELETED",
                    data: { groupId: id },
                }),
            });
        } catch (err) {
            console.error("❌ Socket broadcast failed:", err);
        }

        return NextResponse.json({ message: "Group deleted", group: deletedGroup });
    } catch (error) {
        console.error("❌ Error deleting group:", error);
        return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
    }
}
