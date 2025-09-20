import prisma from "@/lib/prisma";

// --- PUT: تعديل مجموعة ---
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const { name, code, description, propertyId, companyId, leaderId, roomBlockIds } = await req.json();

        const updatedGroup = await prisma.groupMaster.update({
            where: { id },
            data: {
                name,
                code,
                description,
                propertyId,
                companyId: companyId || null,
                leaderId: leaderId || null,
                roomBlocks: {
                    set: roomBlockIds?.map(id => ({ id })) || []
                }
            },
            include: { property: true, company: true, leader: true, roomBlocks: true }
        });

        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUP_UPDATED", data: updatedGroup }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedGroup), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// --- DELETE: حذف مجموعة ---
export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        const bookings = await prisma.booking.findMany({ where: { groupId: id }, select: { id: true } });
        const bookingIds = bookings.map(b => b.id);

        if (bookingIds.length > 0) {
            await prisma.extra.deleteMany({ where: { bookingId: { in: bookingIds } } });
            await prisma.folio.deleteMany({ where: { bookingId: { in: bookingIds } } });
            await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
        }

        await prisma.groupMaster.update({ where: { id }, data: { roomBlocks: { set: [] } } }); // فصل RoomBlocks
        await prisma.groupMaster.delete({ where: { id } });

        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUP_DELETED", data: { id } }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ message: "Group and all related bookings deleted" }), { status: 200 });
    } catch (err) {
        console.error("Delete group failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
