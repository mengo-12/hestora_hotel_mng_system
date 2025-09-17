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



export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        // 1️⃣ جلب كل الحجوزات المرتبطة بالمجموعة
        const bookings = await prisma.booking.findMany({
            where: { groupId: id },
            select: { id: true },
        });

        const bookingIds = bookings.map(b => b.id);

        if (bookingIds.length > 0) {
            // 2️⃣ حذف كل الخدمات الإضافية المرتبطة بالحجوزات
            await prisma.extra.deleteMany({
                where: { bookingId: { in: bookingIds } },
            });

            // 3️⃣ حذف كل الفواتير المرتبطة بالحجوزات
            await prisma.folio.deleteMany({
                where: { bookingId: { in: bookingIds } },
            });

            // 4️⃣ حذف الحجوزات نفسها
            await prisma.booking.deleteMany({
                where: { id: { in: bookingIds } },
            });
        }

        // 5️⃣ حذف المجموعة نفسها
        await prisma.groupMaster.delete({
            where: { id },
        });

        // 🔔 بث حدث الحذف عبر Socket
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "GROUP_DELETED", data: { id } }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ message: "Group and all related bookings deleted" }), { status: 200 });
    } catch (err) {
        console.error("Delete group failed:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

