// app/api/folios/active/route.js
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");
        const folios = await prisma.folio.findMany({
            where: {
                status: "Open",
                OR: [
                    { booking: { propertyId } },
                    { guest: { propertyId } },
                    { group: { propertyId } },
                    { roomBlock: { propertyId } },
                ],
            },
            include: {
                guest: true,
                booking: { include: { guest: true, room: true } },
                group: true,
                roomBlock: true
            },
        });

        const formatted = folios.map(f => ({
            id: f.id,
            guestName: f.guest
                ? `${f.guest.firstName} ${f.guest.lastName}`
                : f.booking?.guest
                    ? `${f.booking.guest.firstName} ${f.booking.guest.lastName}`
                    : f.group
                        ? `${f.group.name}`
                        : "Walk-in",
            roomNumber: f.booking?.room?.number || f.roomBlock?.room?.number || "N/A",
        }));

        return new Response(JSON.stringify(formatted), { status: 200 });
    } catch (err) {
        console.error("❌ Error fetching active folios:", err);
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
}
