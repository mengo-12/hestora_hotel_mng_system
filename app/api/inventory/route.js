import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const roomTypeId = searchParams.get("roomTypeId");
        const statusFilter = searchParams.get("status"); // Vacant / Occupied / OutOfOrder
        const floor = searchParams.get("floor");

        if (!propertyId || !startDate || !endDate) {
            return new Response(
                JSON.stringify({ error: "propertyId, startDate, endDate are required" }),
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // جلب الغرف مع الفلترة
        const rooms = await prisma.room.findMany({
            where: {
                propertyId,
                ...(roomTypeId ? { roomTypeId } : {}),
                ...(floor ? { floor: parseInt(floor) } : {}),
            },
            include: { type: true },
        });

        // جلب الحجوزات للفترة
        const bookings = await prisma.booking.findMany({
            where: {
                propertyId,
                OR: [
                    {
                        checkIn: { lte: end },
                        checkOut: { gte: start },
                    },
                ],
            },
            include: { guest: true },
        });

        // تجهيز بيانات الغرف
        const inventory = rooms.map((room) => {
            let days = {};
            let current = new Date(start);

            while (current <= end) {
                const dateStr = current.toISOString().split("T")[0];

                const booking = bookings.find(
                    (b) =>
                        b.roomId === room.id &&
                        new Date(b.checkIn) <= current &&
                        new Date(b.checkOut) > current
                );

                let status = "Vacant";
                let bookingId = null;
                let guest = null;

                if (booking) {
                    status = "Occupied";
                    bookingId = booking.id;
                    guest = `${booking.guest?.firstName || ""} ${booking.guest?.lastName || ""}`.trim();
                }

                // (يمكن إضافة OutOfOrder و Dirty لاحقاً حسب Housekeeping)
                days[dateStr] = { status, bookingId, guest };

                current.setDate(current.getDate() + 1);
            }

            return {
                roomId: room.id,
                roomNumber: room.number,
                type: room.type?.name,
                floor: room.floor,
                days,
            };
        });

        // فلترة حسب حالة الغرفة (لو طلبها المستخدم)
        const filteredInventory = statusFilter
            ? inventory.filter((room) =>
                Object.values(room.days).some((d) => d.status === statusFilter)
            )
            : inventory;

        return new Response(JSON.stringify(filteredInventory), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
}
