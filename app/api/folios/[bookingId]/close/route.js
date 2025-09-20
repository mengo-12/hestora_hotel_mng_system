// import prisma from "@/lib/prisma";

// export async function POST(req, { params }) {
//     try {
//         const { bookingId } = params;
//         const folio = await prisma.folio.findUnique({ where: { bookingId } });
//         if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

//         const updatedFolio = await prisma.folio.update({
//             where: { id: folio.id },
//             data: { status: "Closed" },
//         });

//         // بث عالمي
//         await fetch("http://localhost:3001/api/broadcast", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ event: "FOLIO_CLOSED", data: { folioId: updatedFolio.id } }),
//         });


//         return new Response(JSON.stringify(updatedFolio), { status: 200 });
//     } catch (err) {
//         console.error(err);
//         return new Response(JSON.stringify({ error: "Failed to close folio" }), { status: 500 });
//     }
// }



// الكود الاعلى نسخة اصلية


import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
    try {
        const { bookingId } = params;
        const folio = await prisma.folio.findUnique({ where: { bookingId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        const updatedFolio = await prisma.folio.update({
            where: { id: folio.id },
            data: { status: folio.status === "Open" ? "Closed" : "Open" }
        });

        // بث عالمي
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "FOLIO_CLOSED", data: { folioId: updatedFolio.id } }),
        });


        return new Response(JSON.stringify(updatedFolio), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to close folio" }), { status: 500 });
    }
}

