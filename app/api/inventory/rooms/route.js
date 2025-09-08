// import prisma from "@/lib/prisma";

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const propertyId = searchParams.get("propertyId");
//         const start = searchParams.get("start");
//         const end = searchParams.get("end");

//         if (!propertyId || !start || !end) {
//             return new Response(JSON.stringify({ error: "Missing query params" }), { status: 400 });
//         }

//         const startDate = new Date(start);
//         const endDate = new Date(end);

//         // جلب كل RoomTypes للفندق
//         const roomTypes = await prisma.roomType.findMany({
//             where: { propertyId },
//             include: { rooms: true }
//         });

//         // توليد مصفوفة الأيام
//         const dates = [];
//         for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//             dates.push(d.toISOString().slice(0, 10));
//         }

//         // Batch query لكل Inventory
//         const inventories = await prisma.inventory.findMany({
//             where: {
//                 propertyId,
//                 date: { gte: startDate, lte: endDate }
//             }
//         });

//         const rows = roomTypes.map(rt => {
//             const cells = {};
//             dates.forEach(d => {
//                 const inv = inventories.find(i => i.roomTypeId === rt.id && i.date.toISOString().slice(0,10) === d);
//                 const totalRooms = rt.rooms.length;
//                 cells[d] = {
//                     total: inv ? inv.allotment : totalRooms,
//                     sold: inv ? inv.sold : 0,
//                     stopSell: inv ? inv.stopSell : false
//                 };
//             });

//             return {
//                 roomTypeId: rt.id,
//                 name: rt.name,
//                 floor: rt.rooms.length > 0 ? rt.rooms[0].floor || "Unknown" : "Unknown",
//                 cells,
//                 rooms: rt.rooms
//             };
//         });

//         return new Response(JSON.stringify({ dates, rows }), { status: 200 });
//     } catch (err) {
//         console.error("Inventory API error:", err);
//         return new Response(JSON.stringify({ error: "Failed to fetch inventory" }), { status: 500 });
//     }
// }

// export async function PATCH(req) {
//     try {
//         const body = await req.json();
//         const { propertyId, roomTypeId, date, field, value } = body;

//         if (!propertyId || !roomTypeId || !date || !field) {
//             return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
//         }

//         const inventoryDate = new Date(date);

//         // تحقق إذا يوجد سجل مسبقًا
//         const existing = await prisma.inventory.findUnique({
//             where: { propertyId_roomTypeId_date: { propertyId, roomTypeId, date: inventoryDate } }
//         });

//         if (existing) {
//             await prisma.inventory.update({
//                 where: { propertyId_roomTypeId_date: { propertyId, roomTypeId, date: inventoryDate } },
//                 data: { [field]: value }
//             });
//         } else {
//             await prisma.inventory.create({
//                 data: {
//                     propertyId,
//                     roomTypeId,
//                     date: inventoryDate,
//                     allotment: field === 'allotment' ? value : 0,
//                     sold: field === 'sold' ? value : 0,
//                     stopSell: field === 'stopSell' ? value : false
//                 }
//             });
//         }

//         return new Response(JSON.stringify({ success: true }), { status: 200 });
//     } catch (err) {
//         console.error("Inventory PATCH error:", err);
//         return new Response(JSON.stringify({ error: "Failed to update inventory" }), { status: 500 });
//     }
// }






import prisma from "@/lib/prisma";

// GET inventory data
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!propertyId || !start || !end) {
            return new Response(JSON.stringify({ error: "Missing query params" }), { status: 400 });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        // جلب أنواع الغرف + الغرف التابعة لها
        const roomTypes = await prisma.roomType.findMany({
            where: { propertyId },
            include: { rooms: true }
        });

        // مصفوفة الأيام
        const dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().slice(0, 10));
        }

        // جلب الـ inventories للفندق في الفترة
        const inventories = await prisma.inventory.findMany({
            where: {
                propertyId,
                date: { gte: startDate, lte: endDate }
            }
        });

        // بناء البيانات
        const rows = roomTypes.map(rt => {
            const roomsData = rt.rooms.map(room => {
                const cells = {};
                dates.forEach(d => {
                    const inv = inventories.find(i =>
                        i.roomId === room.id &&
                        i.date.toISOString().slice(0, 10) === d
                    );

                    cells[d] = {
                        total: inv ? inv.allotment : 1, // كل غرفة افتراضياً 1
                        sold: inv ? inv.sold : 0,
                        stopSell: inv ? inv.stopSell : false
                    };
                });

                return {
                    id: room.id,
                    number: room.number,
                    floor: room.floor || "Unknown",
                    cells
                };
            });

            return {
                roomTypeId: rt.id,
                name: rt.name,
                rooms: roomsData
            };
        });

        return new Response(JSON.stringify({ dates, rows }), { status: 200 });
    } catch (err) {
        console.error("Inventory API error:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch inventory" }), { status: 500 });
    }
}

// PATCH inventory update
export async function PATCH(req) {
    try {
        const body = await req.json();
        const { propertyId, roomTypeId, roomId, date, field, value } = body;

        if (!propertyId || !roomId || !date || !field) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        const inventoryDate = new Date(date);

        // المفتاح الفريد الصحيح (propertyId + roomId + date)
        const whereUnique = {
            propertyId_roomId_date: {
                propertyId,
                roomId,
                date: inventoryDate
            }
        };

        const existing = await prisma.inventory.findUnique({ where: whereUnique });

        if (existing) {
            await prisma.inventory.update({
                where: whereUnique,
                data: { [field]: value }
            });
        } else {
            await prisma.inventory.create({
                data: {
                    propertyId,
                    roomTypeId,
                    roomId,
                    date: inventoryDate,
                    allotment: field === "allotment" ? value : 1,
                    sold: field === "sold" ? value : 0,
                    stopSell: field === "stopSell" ? value : false
                }
            });
        }

                // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "INVENTORY_UPDATED",
                    data: {
                        propertyId,
                        roomTypeId,
                        roomId,
                        date,
                        field,
                        value
                    }
                })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Inventory PATCH error:", err);
        return new Response(JSON.stringify({ error: "Failed to update inventory" }), { status: 500 });
    }
}



