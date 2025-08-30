import prisma from "@/lib/prisma";

// --- جلب كل الخدمات لحجز معين ---
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("bookingId");

        if (!bookingId) return new Response(JSON.stringify({ error: "bookingId required" }), { status: 400 });

        const extras = await prisma.extra.findMany({
            where: { bookingId },
        });

        return new Response(JSON.stringify(extras), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch extras" }), { status: 500 });
    }
}

// --- إضافة خدمة جديدة ---
export async function POST(req) {
    try {
        const { bookingId, guestId, name, description, price, quantity, tax } = await req.json();

        if (!bookingId || !name || !price || !quantity) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const extra = await prisma.extra.create({
            data: {
                bookingId,
                guestId: guestId || null,
                name,
                description: description || null,
                price,
                quantity,
                tax: tax || 0,
                status: "Unpaid"
            }
        });

                // 2. البحث عن الفوليو المرتبط بالحجز
        let folio = await prisma.folio.findFirst({ where: { bookingId } });
        if (!folio) {
            // إذا ما في فوليو نعمل واحد جديد
            folio = await prisma.folio.create({
                data: { bookingId, status: "Open" },
            });
        }

        // 3. إضافة Charge للفوليو
        const charge = await prisma.charge.create({
            data: {
                folioId: folio.id,
                code: "EXTRA",
                description: `${name} - ${description || ""}`,
                amount: Number(price) * Number(quantity),
                tax: tax || 0,
                userId: guestId || null,
            },
        });


        // --- Broadcast عالمي ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "EXTRA_ADDED", data: extra }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(extra), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to add extra" }), { status: 500 });
    }
}

// --- تحديث خدمة ---
export async function PUT(req) {
    try {
        const { id, name, description, price, quantity, tax, status } = await req.json();

        if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

        const extra = await prisma.extra.update({
            where: { id },
            data: {
                name,
                description,
                price,
                quantity,
                tax,
                status
            }
        });

        // --- Broadcast عالمي ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "EXTRA_UPDATED", data: extra }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(extra), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update extra" }), { status: 500 });
    }
}

// --- حذف خدمة ---
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

        await prisma.extra.delete({ where: { id } });

        // --- Broadcast عالمي ---
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
