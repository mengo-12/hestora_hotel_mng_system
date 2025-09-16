import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { groupId } = params;

        const group = await prisma.groupMaster.findUnique({
            where: { id: groupId },
            include: {
                leader: {
                    select: { id: true, firstName: true, lastName: true },
                },
                roomBlocks: {
                    include: {
                        bookings: {
                            include: {
                                guest: { select: { id: true, firstName: true, lastName: true } },
                                room: {
                                    select: {
                                        id: true,
                                        number: true,
                                        roomType: { select: { id: true, name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!group) {
            return new Response(JSON.stringify({ error: "Group not found" }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify(group), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch group data" }), {
            status: 500,
        });
    }
}
