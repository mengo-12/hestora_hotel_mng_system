import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { bookingId } = params;

        const folio = await prisma.folio.findUnique({
            where: { bookingId },
            include: {
                charges: { include: { postedBy: true } }, // جلب user
                payments: { include: { postedBy: true } }, // جلب user
                guest: true,
                booking: true,
            },
        });

        if (!folio) {
            return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(folio), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { bookingId } = params;
        const { status } = await req.json();

        const folio = await prisma.folio.update({
            where: { bookingId },
            data: { status },
        });

        return new Response(JSON.stringify(folio), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update folio" }), { status: 500 });
    }
}
