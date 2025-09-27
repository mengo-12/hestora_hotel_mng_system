import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PATCH(req, { params }) {
    try {
        const { orderId } = params;
        const { status } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const currentUserId = session.user.id;

        const updated = await prisma.pOSCharge.update({
            where: { id: orderId },
            data: { status }
        });

        // --- Broadcast ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_CHARGE_UPDATED", data: updated })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(updated), { status: 200 });

    } catch (err) {
        console.error("POS order update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update POS order" }), { status: 500 });
    }
}
