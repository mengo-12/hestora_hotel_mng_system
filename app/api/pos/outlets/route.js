import  prisma  from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: جلب جميع الـ POS Outlets
export async function GET(req) {
    try {
        const outlets = await prisma.POSOutlet.findMany();
        return new Response(JSON.stringify(outlets), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch POS outlets:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch POS outlets" }), { status: 500 });
    }
}

// POST: إنشاء Outlet جديد مع Broadcast
export async function POST(req) {
    try {
        const { propertyId, name, type, active = true } = await req.json();

        if (!propertyId || !name || !type) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const outlet = await prisma.POSOutlet.create({
            data: { propertyId, name, type, active }
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_OUTLET_CREATED", data: outlet })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(outlet), { status: 201 });

    } catch (err) {
        console.error("Failed to create POS outlet:", err);
        return new Response(JSON.stringify({ error: "Failed to create POS outlet" }), { status: 500 });
    }
}



export async function PUT(req) {
    try {
        const { id, name, type, active } = await req.json();

        const updatedOutlet = await prisma.pOSOutlet.update({
            where: { id },
            data: { name, type, active }
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "POS_OUTLET_UPDATED",
                    data: updatedOutlet,
                }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedOutlet), { status: 200 });
    } catch (err) {
        console.error("Failed to update POS outlet:", err);
        return new Response(
            JSON.stringify({ error: "Failed to update POS outlet" }),
            { status: 500 }
        );
    }
}




// PATCH: تحديث Outlet مع Broadcast
export async function PATCH(req) {
    try {
        const { id, name, type, active } = await req.json();

        if (!id) return new Response(JSON.stringify({ error: "Missing outlet ID" }), { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const updated = await prisma.POSOutlet.update({
            where: { id },
            data: { name, type, active }
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_OUTLET_UPDATED", data: updated })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updated), { status: 200 });

    } catch (err) {
        console.error("Failed to update POS outlet:", err);
        return new Response(JSON.stringify({ error: "Failed to update POS outlet" }), { status: 500 });
    }
}

// DELETE: حذف Outlet مع Broadcast
export async function DELETE(req) {
    try {
        const { id } = await req.json();
        if (!id) return new Response(JSON.stringify({ error: "Missing outlet ID" }), { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const deleted = await prisma.POSOutlet.delete({ where: { id } });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_OUTLET_DELETED", data: deleted })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(deleted), { status: 200 });

    } catch (err) {
        console.error("Failed to delete POS outlet:", err);
        return new Response(JSON.stringify({ error: "Failed to delete POS outlet" }), { status: 500 });
    }
}
