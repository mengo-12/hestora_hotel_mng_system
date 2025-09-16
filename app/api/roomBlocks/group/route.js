import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const { groupId, roomTypeId, ratePlanId, propertyId } = await req.json();

        // التحقق من وجود المجموعة
        const group = await prisma.groupMaster.findUnique({
            where: { id: groupId },
            include: {
                leader: true,
                guests: true, // تأكد أنك عامل relation في schema
            }
        });
        if (!group) return new Response(JSON.stringify({ error: "Group not found" }), { status: 404 });

        // جلب أو إنشاء Folio للقائد
        let folio = await prisma.folio.findFirst({
            where: { guestId: group.leaderId }
        });
        if (!folio) {
            folio = await prisma.folio.create({
                data: {
                    guestId: group.leaderId,
                    bookingId: null, // إذا عندك bookingId للقائد اربطه هنا
                }
            });
        }

        // إنشاء Room Blocks لكل نزيل في المجموعة
        const createdBlocks = [];
        for (const guest of group.guests) {
            const block = await prisma.roomBlock.create({
                data: {
                    groupId,
                    propertyId,
                    roomTypeId,
                    ratePlanId,
                    totalRooms: 1, // غرفة واحدة لكل نزيل
                    pickedUp: 0,
                    folioId: folio.id,
                }
            });
            createdBlocks.push(block);
        }

        return new Response(JSON.stringify({ blocks: createdBlocks, folio }), { status: 201 });
    } catch (err) {
        console.error("Error creating group room blocks:", err);
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
