import prisma from "@/lib/prisma";

export async function GET(req) {
    const bookingId = new URL(req.url).searchParams.get("bookingId");
    if (!bookingId) {
        return new Response(JSON.stringify({ error: "bookingId required" }), { status: 400 });
    }

    const folio = await prisma.folio.findUnique({
        where: { bookingId },
        include: {
            charges: {
                include: { postedBy: true }, // جلب اسم المستخدم
            },
            payments: {
                include: { postedBy: true }, // جلب اسم المستخدم
            },
            guest: true,
            booking: true,
        },
    });

    return new Response(JSON.stringify(folio), { status: 200 });
}

export async function POST(req) {
    const { bookingId, guestId } = await req.json();
    if (!bookingId || !guestId) {
        return new Response(JSON.stringify({ error: "Missing bookingId or guestId" }), { status: 400 });
    }

    const folio = await prisma.folio.create({
        data: { bookingId, guestId },
        include: {
            charges: { include: { postedBy: true } },
            payments: { include: { postedBy: true } },
        },
    });

    // Broadcast عالمي
    try {
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "FOLIO_CREATED", data: folio }),
        });
    } catch (err) {
        console.error(err);
    }

    return new Response(JSON.stringify(folio), { status: 201 });
}
