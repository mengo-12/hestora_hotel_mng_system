// import prisma from "@/lib/prisma";

// export async function DELETE(req, { params }) {
//     try {
//         const payment = await prisma.payment.delete({
//             where: { id: params.paymentId },
//         });

//         // بث عالمي
//         try {
//             await fetch("http://localhost:3001/api/broadcast", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ event: "PAYMENT_DELETED", data: payment }),
//             });
//         } catch (err) { console.error("Socket broadcast failed:", err); }

//         return new Response(JSON.stringify({ success: true }), { status: 200 });
//     } catch (err) {
//         console.error("Error deleting payment:", err);
//         return new Response(JSON.stringify({ error: "Failed to delete payment" }), { status: 500 });
//     }
// }
