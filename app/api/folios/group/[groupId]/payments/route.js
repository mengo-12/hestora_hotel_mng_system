import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: جلب المدفوعات
export async function GET(req, context) {
    const { params } = await context;
    const groupId = params.groupId;

    try {
        const booking = await prisma.booking.findFirst({ where: { groupId } });
        if (!booking) return new Response(JSON.stringify({ error: "No booking found for this group" }), { status: 404 });

        const folio = await prisma.folio.findFirst({ where: { bookingId: booking.id } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        const payments = await prisma.payment.findMany({
            where: { folioId: folio.id },
            include: { postedBy: true },
            orderBy: { postedAt: "desc" },
        });

        return new Response(JSON.stringify(payments), { status: 200 });
    } catch (err) {
        console.error("Error fetching payments:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch payments" }), { status: 500 });
    }
}

// POST: إضافة دفعة
export async function POST(req, context) {
    const { params } = await context;
    const groupId = params.groupId;

    try {
        const { method, amount, ref } = await req.json();
        if (!method || !amount) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

        const booking = await prisma.booking.findFirst({ where: { groupId } });
        if (!booking) return new Response(JSON.stringify({ error: "No booking found for this group" }), { status: 404 });

        let folio = await prisma.folio.findFirst({ where: { bookingId: booking.id } });
        if (!folio) folio = await prisma.folio.create({ data: { bookingId: booking.id, status: "Open" } });

        const payment = await prisma.payment.create({
            data: {
                folioId: folio.id,
                method,
                amount: Number(amount),
                ref: ref || null,
                postedById: user.id,
            },
            include: { postedBy: true },
        });

        // بث التحديث
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "PAYMENT_ADDED", data: { folioId: folio.id, payment } }),
        });

        return new Response(JSON.stringify(payment), { status: 201 });
    } catch (err) {
        console.error("Error adding payment:", err);
        return new Response(JSON.stringify({ error: "Failed to add payment" }), { status: 500 });
    }
}

// DELETE: حذف دفعة
export async function DELETE(req, context) {
    const { params } = await context;
    const groupId = params.groupId;

    try {
        const { paymentId } = await req.json();

        const booking = await prisma.booking.findFirst({ where: { groupId } });
        if (!booking) return new Response(JSON.stringify({ error: "No booking found for this group" }), { status: 404 });

        const folio = await prisma.folio.findFirst({ where: { bookingId: booking.id } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        await prisma.payment.delete({ where: { id: paymentId } });

        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "PAYMENT_DELETED", data: { folioId: folio.id, paymentId } }),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Error deleting payment:", err);
        return new Response(JSON.stringify({ error: "Failed to delete payment" }), { status: 500 });
    }
}
