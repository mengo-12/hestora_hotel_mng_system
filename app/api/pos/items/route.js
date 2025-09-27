import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 🔹 جلب جميع الـ Items
export async function GET(req) {
    try {
        const items = await prisma.pOSItem.findMany({
            include: { outlet: true },
        });
        return new Response(JSON.stringify(items), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch POS items:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch POS items" }), { status: 500 });
    }
}

// 🔹 إضافة Item جديد
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { outletId, code, name, description, price, tax, active } = await req.json();

        const item = await prisma.pOSItem.create({
            data: { outletId, code, name, description, price, tax, active },
            include: { outlet: true },
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_ITEM_CREATED", data: item })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(item), { status: 201 });
    } catch (err) {
        console.error("Failed to create POS item:", err);
        return new Response(JSON.stringify({ error: "Failed to create POS item" }), { status: 500 });
    }
}

// 🔹 تعديل Item
export async function PUT(req) {
    try {
        const { id, code, name, description, price, tax, active } = await req.json();

        const updatedItem = await prisma.pOSItem.update({
            where: { id },
            data: { code, name, description, price, tax, active },
            include: { outlet: true },
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_ITEM_UPDATED", data: updatedItem })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedItem), { status: 200 });
    } catch (err) {
        console.error("Failed to update POS item:", err);
        return new Response(JSON.stringify({ error: "Failed to update POS item" }), { status: 500 });
    }
}

// 🔹 حذف Item
export async function DELETE(req) {
    try {
        const { id } = await req.json();

        const deletedItem = await prisma.pOSItem.delete({
            where: { id },
            include: { outlet: true },
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_ITEM_DELETED", data: deletedItem })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(deletedItem), { status: 200 });
    } catch (err) {
        console.error("Failed to delete POS item:", err);
        return new Response(JSON.stringify({ error: "Failed to delete POS item" }), { status: 500 });
    }
}
