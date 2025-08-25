import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const folio = await prisma.folio.findUnique({
            where: { bookingId: params.bookingId },
            include: {
                guest: true,
                charges: { include: { postedBy: true } },
                payments: { include: { postedBy: true } }
            }
        });

        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        return new Response(JSON.stringify(folio), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch folio" }), { status: 500 });
    }
}
