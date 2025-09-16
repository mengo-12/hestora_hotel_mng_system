import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();

        const updatedGroup = await prisma.groupMaster.update({
            where: { id },
            data: {
                name: body.name,
                code: body.code,
                description: body.description,
                propertyId: body.propertyId,
                companyId: body.companyId || null,
                leaderId: body.leaderId || null
            },
            include: {
                property: true,
                company: true,
                leader: true
            }
        });

        // 🔔 بث التحديث عبر Socket
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUP_UPDATED", data: updatedGroup }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updatedGroup), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
