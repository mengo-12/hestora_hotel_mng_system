import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!propertyId || !start || !end) {
            return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        // 1️⃣ جلب RoomTypes مع الغرف
        const roomTypes = await prisma.roomType.findMany({
            where: { propertyId },
            include: { rooms: true }
        });

        // 2️⃣ جلب Inventory لكل RoomType داخل الفترة
        const inventories = await prisma.inventory.findMany({
            where: {
                propertyId,
                date: { gte: startDate, lte: endDate }
            }
        });

        // 3️⃣ إنشاء مصفوفة التواريخ
        const dates = [];
        for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate()+1)) {
            dates.push(new Date(dt).toISOString().slice(0,10));
        }

        // 4️⃣ دمج البيانات لكل RoomType و Room
        const rows = roomTypes.map(rt => {
            const roomRows = rt.rooms.map(rm => {
                const cells = {};
                dates.forEach(d => {
                    // السجل الخاص بالغرفة الفردية
                    const roomInv = inventories.find(inv =>
                        inv.roomId === rm.id && inv.date.toISOString().slice(0,10) === d
                    );
                    // السجل العام للنوع (roomId = null)
                    const typeInv = inventories.find(inv =>
                        inv.roomTypeId === rt.id && !inv.roomId && inv.date.toISOString().slice(0,10) === d
                    );

                    // دمج القيم
                    const inv = roomInv || typeInv || {};
                    cells[d] = {
                        allotment: inv.allotment || 0,
                        sold: inv.sold || 0,
                        stopSell: inv.stopSell || false,
                        housekeeping: inv.housekeeping || null,
                        notes: inv.notes || null,
                        extraPrices: inv.extraPrices || {},
                        baseRate: inv.extraPrices?.baseRate || null,
                        taxes: inv.extraPrices?.taxes || null,
                        cta: inv.extraPrices?.cta || false,
                        ctd: inv.extraPrices?.ctd || false
                    };
                });
                return { id: rm.id, number: rm.number, cells };
            });

            return { roomTypeId: rt.id, name: rt.name, rooms: roomRows };
        });

        return new Response(JSON.stringify({ rows, dates }));

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}


export async function PATCH(req) {
    try {
        const body = await req.json();
        const { propertyId, roomTypeId, roomId, date, field, value } = body;
        if (!propertyId || !roomTypeId || !date) {
            return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
        }

        const targetDate = new Date(date);

        // 1️⃣ البحث عن السجل الموجود أولاً
        let inventory = await prisma.inventory.findFirst({
            where: {
                propertyId,
                roomTypeId,
                roomId: roomId || null,
                date: targetDate
            }
        });

        // 2️⃣ إذا لم يوجد، إنشاؤه
        if (!inventory) {
            inventory = await prisma.inventory.create({
                data: {
                    propertyId,
                    roomTypeId,
                    roomId: roomId || null,
                    date: targetDate,
                    allotment: 1,
                    sold: 0,
                    stopSell: false
                }
            });
        }

        // 3️⃣ تجهيز بيانات التحديث
        const updateData = {};
        const simpleFields = ['allotment','sold','stopSell','housekeeping','notes'];
        const extraFields = ['baseRate','taxes','cta','ctd'];

        if (simpleFields.includes(field)) {
            updateData[field] = value;
        } else if (extraFields.includes(field)) {
            const extraPrices = inventory.extraPrices || {};
            extraPrices[field] = value;
            updateData.extraPrices = extraPrices;
        }

        // 4️⃣ تطبيق التحديث
        const updatedInventory = await prisma.inventory.update({
            where: { id: inventory.id },
            data: updateData
        });

        return new Response(JSON.stringify(updatedInventory));
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
