// app/api/loyalty/members/route.js
import prisma from "@/lib/prisma";

// GET: جلب جميع أعضاء الولاء أو فلترة حسب guestId
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const guestId = searchParams.get("guestId");

        const where = guestId ? { guestId } : {};

        const members = await prisma.loyaltyMember.findMany({
            where,
            include: {
                guest: true,
                loyaltyProgram: true,
                transactions: true,
            },
        });

        return new Response(JSON.stringify(members), { status: 200 });
    } catch (err) {
        console.error("Failed to fetch loyalty members:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}

// POST: إنشاء عضو ولاء جديد
export async function POST(req) {
    try {
        const { guestId, loyaltyProgramId } = await req.json();

        if (!guestId) {
            return new Response(JSON.stringify({ error: "guestId is required" }), { status: 400 });
        }

        // تحقق إذا العضو موجود مسبقًا
        const existingMember = await prisma.loyaltyMember.findUnique({
            where: { guestId },
        });

        if (existingMember) {
            return new Response(JSON.stringify({ error: "Guest is already a loyalty member" }), { status: 400 });
        }

        // إذا لم يتم تمرير loyaltyProgramId، نختار Bronze
        let programId = loyaltyProgramId;
        if (!programId) {
            const bronzeProgram = await prisma.loyaltyProgram.findFirst({ where: { name: "Bronze" } });
            if (!bronzeProgram) {
                return new Response(JSON.stringify({ error: "Bronze program not found" }), { status: 500 });
            }
            programId = bronzeProgram.id;
        }

        const newMember = await prisma.loyaltyMember.create({
            data: {
                guestId,
                loyaltyProgramId: programId,
                pointsBalance: 0,
            },
            include: {
                guest: true,
                loyaltyProgram: true,
                transactions: true,
            },
        });

        // بث الحدث عبر Socket
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "LOYALTY_MEMBER_CREATED", data: newMember }),
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(newMember), { status: 201 });
    } catch (error) {
        console.error("Failed to create loyalty member:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
