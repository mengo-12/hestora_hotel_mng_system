import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

// ✅ جلب غرفة واحدة مع آخر حالة من سجل الحالة
export async function GET(req, context) {
    try {
        await requireAuth(req);

        // ✅ هنا ننتظر context.params قبل استخدامه
        const { params } = await context;
        const { id } = params;

        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                statusLogs: {
                    orderBy: { changedAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!room) {
            return new Response(JSON.stringify({ error: "Room not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const currentStatus =
            room.statusLogs.length > 0 ? room.statusLogs[0].newStatus : room.status;

        return new Response(JSON.stringify({ ...room, status: currentStatus }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// ✅ تعديل بيانات الغرفة (من غير الحالة)
export async function PUT(req, context) {
    try {
        await requireAuth(req);

        const { params } = await context;
        const { id } = params;

        const body = await req.json();
        const updateData = {};

        if (body.roomNumber !== undefined) updateData.roomNumber = String(body.roomNumber);
        if (body.roomType !== undefined) updateData.roomType = String(body.roomType);
        if (body.pricePerNight !== undefined) updateData.pricePerNight = Number(body.pricePerNight);
        if (body.description !== undefined) updateData.description = body.description;

        if (body.status !== undefined) {
            return new Response(
                JSON.stringify({ error: "Use /status API to change room status" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const updated = await prisma.room.update({
            where: { id },
            data: updateData,
        });

        return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        if (err.code === "P2025") {
            return new Response(JSON.stringify({ error: "Room not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(JSON.stringify({ error: err.message || "Failed to update room" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// ✅ حذف الغرفة
export async function DELETE(req, context) {
    try {
        await requireAuth(req);

        const { params } = await context;
        const { id } = params;

        await prisma.room.delete({ where: { id } });

        return new Response(null, { status: 204 });
    } catch (err) {
        console.error(err);
        if (err.code === "P2025") {
            return new Response(JSON.stringify({ error: "Room not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(JSON.stringify({ error: err.message || "Failed to delete room" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
