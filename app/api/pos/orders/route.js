import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const outletId = searchParams.get('outletId');
        const status = searchParams.get('status');

        const where = {};
        if (outletId) where.outletId = outletId;
        if (status) where.folio = { status: status }; // إذا أردنا تصفية حسب حالة الفاتورة

        const orders = await prisma.pOSCharge.findMany({
            where,
            include: {
                outlet: true,
                guest: true,
                folio: true,
                postedBy: true
            },
            orderBy: { postedAt: 'desc' }
        });

        return new Response(JSON.stringify(orders), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}



export async function POST(req) {
    try {
        const { outletId, folioId, guestId, bookingId, items } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const currentUserId = session.user.id;

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: "No items provided" }), { status: 400 });
        }

        // إنشاء charges لكل عنصر
        const charges = await Promise.all(items.map(item =>
            prisma.pOSCharge.create({
                data: {
                    outletId,
                    folioId,
                    guestId,
                    description: item.name,
                    amount: item.unitPrice * item.quantity,
                    tax: item.tax || 0,
                    postedById: currentUserId
                }
            })
        ));

        // --- Broadcast ---
        try {
            for (let charge of charges) {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "POS_CHARGE_CREATED", data: charge })
                });
            }
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify({ charges }), { status: 201 });

    } catch (err) {
        console.error("POS order creation failed:", err);
        return new Response(JSON.stringify({ error: "Failed to create POS order" }), { status: 500 });
    }
}