import prisma from "@/lib/prisma";

// --- PATCH تعديل RatePlan ---
export async function PATCH(req, { params }) {
    try {
        const { id } = params;
        const data = await req.json();

        const updatedPlan = await prisma.ratePlan.update({
            where: { id },
            data
        });

        // --- ✅ Broadcast بعد تعديل RatePlan ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATE_PLAN_UPDATED", data: updatedPlan }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedPlan), { status: 200 });
    } catch (err) {
        console.error("Failed to update rate plan:", err);
        return new Response(JSON.stringify({ error: "Failed to update rate plan" }), { status: 500 });
    }
}

// --- PUT تحديث RatePlan ---
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const data = await req.json();

        const updatedPlan = await prisma.ratePlan.update({
            where: { id },
            data
        });

        // Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATEPLAN_UPDATED", data: updatedPlan }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedPlan), { status: 200 });
    } catch (err) {
        console.error("Failed to update rate plan:", err);
        return new Response(JSON.stringify({ error: "Failed to update rate plan" }), { status: 500 });
    }
}

// --- DELETE حذف RatePlan ---
export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        const deletedPlan = await prisma.ratePlan.delete({ where: { id } });

        // --- ✅ Broadcast بعد حذف RatePlan ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATE_PLAN_DELETED", data: deletedPlan }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ message: "Rate plan deleted", deletedPlan }), { status: 200 });
    } catch (err) {
        console.error("Failed to delete rate plan:", err);
        return new Response(JSON.stringify({ error: "Failed to delete rate plan" }), { status: 500 });
    }
}
