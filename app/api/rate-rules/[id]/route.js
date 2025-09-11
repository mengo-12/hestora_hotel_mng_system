import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
    try {
        const { id } = params;
        const data = await req.json();

        const updatedRule = await prisma.rateRule.update({
            where: { id },
            data
        });

        // ✅ Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATE_RULE_UPDATED", data: updatedRule }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedRule), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update rate rule" }), { status: 500 });
    }
}

// DELETE RateRule
export async function DELETE(req, { params }) {
    try {
        const { id } = params;

        const deletedRule = await prisma.rateRule.delete({ where: { id } });

        // ✅ Broadcast
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "RATE_RULE_DELETED", data: deletedRule }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ message: "Rate rule deleted", deletedRule }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete rate rule" }), { status: 500 });
    }
}
