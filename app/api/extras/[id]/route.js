import prisma from "@/lib/prisma";

// --- جلب Extra ---
export async function GET(req, { params }) {
    try {
        const extra = await prisma.extra.findUnique({
            where: { id: params.id }
        });
        if (!extra) return new Response(JSON.stringify({ error: "Extra not found" }), { status: 404 });
        return new Response(JSON.stringify(extra), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch extra" }), { status: 500 });
    }
}

// --- تحديث Extra ---
export async function PUT(req, { params }) {
    try {
        const { name, description, price, tax, isPaid } = await req.json();

        const updatedExtra = await prisma.extra.update({
            where: { id: params.id },
            data: {
                name,
                description: description || null,
                price: price !== undefined ? Number(price) : undefined,
                tax: tax !== undefined ? Number(tax) : undefined,
                isPaid: isPaid !== undefined ? isPaid : undefined
            }
        });

        // بث عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "EXTRA_UPDATED", data: updatedExtra }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedExtra), { status: 200 });
    } catch (err) {
        console.error("Extra update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update extra" }), { status: 500 });
    }
}

// --- حذف Extra ---
export async function DELETE(req, { params }) {
    try {
        const id = params.id;
        await prisma.extra.delete({ where: { id } });

        // بث عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "EXTRA_DELETED", data: { id } }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete extra" }), { status: 500 });
    }
}
