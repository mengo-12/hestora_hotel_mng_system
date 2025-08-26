// import prisma from "@/lib/prisma";

// export async function DELETE(req, { params }) {
//     try {
//         const charge = await prisma.charge.delete({
//             where: { id: params.chargeId },
//         });

//         // بث عالمي
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "CHARGE_DELETED", data: charge }),
//             });
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify({ success: true }), { status: 200 });
//     } catch (err) {
//         console.error("Error deleting charge:", err);
//         return new Response(JSON.stringify({ error: "Failed to delete charge" }), { status: 500 });
//     }
// }
