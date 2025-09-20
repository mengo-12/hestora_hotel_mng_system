// import prisma from "@/lib/prisma";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// // --- GET: جلب كل المجموعات ---

// export async function GET() {
//     try {
//         const groups = await prisma.groupMaster.findMany({
//             include: {
//                 property: { select: { id: true, name: true } },
//                 company: { select: { id: true, name: true } },
//                 leader: { select: { id: true, firstName: true, lastName: true } },
//                 bookings: {
//                     include: {
//                         folio: {
//                             include: { charges: true, payments: true },
//                         },
//                     },
//                 },
//             },
//         });

//         // أضف field groupTotals لكل مجموعة
//         const enriched = groups.map(g => {
//             const allFolios = g.bookings
//                 .map(b => b.folio)
//                 .filter(f => f !== null);

//             const allCharges = allFolios.flatMap(f =>
//                 f.charges.map(c => ({
//                     ...c,
//                     folioId: f.id,
//                 }))
//             );
//             const allPayments = allFolios.flatMap(f =>
//                 f.payments.map(p => ({
//                     ...p,
//                     folioId: f.id,
//                 }))
//             );

//             const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
//             const taxTotal = allCharges.reduce(
//                 (sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100,
//                 0
//             );
//             const totalCharges = subtotal + taxTotal;
//             const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
//             const balance = totalCharges - totalPayments;

//             return {
//                 ...g,
//                 groupTotals: { subtotal, taxTotal, totalCharges, totalPayments, balance },
//             };
//         });

//         return new Response(JSON.stringify(enriched), { status: 200 });
//     } catch (err) {
//         console.error("Failed to fetch groups:", err);
//         return new Response(JSON.stringify({ error: "Failed to fetch groups" }), {
//             status: 500,
//         });
//     }
// }

// // --- POST: إنشاء مجموعة جديدة ---
// export async function POST(req) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

//         const { propertyId, companyId, leaderId, code, name, description, startDate, endDate, roomBlockIds } = await req.json();
//         if (!propertyId || !code || !name) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });

//         const newGroup = await prisma.groupMaster.create({
//             data: {
//                 propertyId,
//                 companyId: companyId || null,
//                 leaderId: leaderId || null,
//                 code,
//                 name,
//                 description: description || "",
//                 startDate: startDate ? new Date(startDate) : null,
//                 endDate: endDate ? new Date(endDate) : null,
//                 roomBlocks: {
//                     connect: roomBlockIds?.map(id => ({ id })) || []
//                 }
//             },
//             include: { property: true, company: true, leader: true, roomBlocks: true },
//         });

//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "GROUP_CREATED", data: newGroup }),
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify(newGroup), { status: 201 });
//     } catch (err) {
//         console.error("Failed to create group:", err);
//         return new Response(JSON.stringify({ error: "Failed to create group" }), { status: 500 });
//     }
// }


// // --- PATCH: تحديث مجموعة (Billing Instruction أو أي حقل) ---
// export async function PATCH(req, { params }) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) 
//             return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

//         const { id } = params;
//         const data = await req.json();

//         // تحديث الحقول المسموح بها فقط (مثل billingInstruction)
//         const allowedFields = ["name","code","description","startDate","endDate","companyId","leaderId","billingInstruction"];
//         const updateData = {};
//         allowedFields.forEach(f => {
//             if (data[f] !== undefined) updateData[f] = data[f];
//         });

//         const updatedGroup = await prisma.groupMaster.update({
//             where: { id },
//             data: updateData,
//             include: { property: true, company: true, leader: true, roomBlocks: true }
//         });

//         // broadcast
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "GROUP_UPDATED", data: updatedGroup }),
//             });
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify(updatedGroup), { status: 200 });
//     } catch (err) {
//         console.error("Failed to update group:", err);
//         return new Response(JSON.stringify({ error: "Failed to update group" }), { status: 500 });
//     }
// }



// // --- حذف مجموعة ---
// export async function DELETE(req, { params }) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

//         const { id } = params;

//         await prisma.groupMaster.delete({ where: { id } });

//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "GROUP_UPDATED", data: updatedGroup }), // أو GROUP_DELETED
//             });
//         } catch (err) {
//             console.error("Socket broadcast failed:", err);
//         }

//         return new Response(JSON.stringify({ success: true }), { status: 200 });
//     } catch (err) {
//         console.error("Failed to delete group:", err);
//         return new Response(JSON.stringify({ error: "Failed to delete group" }), { status: 500 });
//     }
// }



// الكود الاعلى اصلي





import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// --- GET: جلب كل المجموعات مع مجاميع الفواتير ---
export async function GET() {
    try {
        const groups = await prisma.groupMaster.findMany({
            include: {
                property: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
                leader: { select: { id: true, firstName: true, lastName: true } },
                bookings: {
                    include: {
                        folio: { include: { charges: true, payments: true } },
                    },
                },
            },
        });

        const enriched = groups.map(g => {
            const allFolios = g.bookings.map(b => b.folio).filter(f => f !== null);
            const allCharges = allFolios.flatMap(f => f.charges || []);
            const allPayments = allFolios.flatMap(f => f.payments || []);
            const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
            const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
            const totalCharges = subtotal + taxTotal;
            const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const balance = totalCharges - totalPayments;
            return { ...g, groupTotals: { subtotal, taxTotal, totalCharges, totalPayments, balance } };
        });

        return new Response(JSON.stringify(enriched), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch groups:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch groups" }), { status: 500 });
    }
}

// --- POST: إنشاء مجموعة جديدة ---
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { propertyId, companyId, leaderId, code, name, description, startDate, endDate, roomBlockIds } = await req.json();
        if (!propertyId || !code || !name) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });

        const newGroup = await prisma.groupMaster.create({
            data: {
                propertyId,
                companyId: companyId || null,
                leaderId: leaderId || null,
                code,
                name,
                description: description || "",
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                roomBlocks: { connect: roomBlockIds?.map(id => ({ id })) || [] }
            },
            include: { property: true, company: true, leader: true, roomBlocks: true },
        });

        // Broadcast
        try { await fetch("http://localhost:3001/api/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "GROUP_CREATED", data: newGroup }) }); } catch (err) { console.error(err); }

        return new Response(JSON.stringify(newGroup), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create group" }), { status: 500 });
    }
}




// --- DELETE ---
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const { id } = params;
        await prisma.groupMaster.delete({ where: { id } });

        try { await fetch("http://localhost:3001/api/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "GROUP_DELETED", data: { id } }) }); } catch { }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete group" }), { status: 500 });
    }
}
