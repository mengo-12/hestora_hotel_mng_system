// app/api/folios/[bookingId]/payments/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";


export async function GET(req, { params }) {
    try {
        const payments = await prisma.payment.findMany({
            where: { folio: { bookingId: params.bookingId } },
            include: {
                postedBy: {
                    select: { id: true, name: true, email: true }, // <<< جلب معلومات المستخدم
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return new Response(JSON.stringify(payments), { status: 200 });
    } catch (err) {
        console.error("Error fetching payments:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch payments" }), { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { method, amount, ref } = await req.json();
        if (!method || !amount) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const folio = await prisma.folio.findUnique({ where: { bookingId: params.bookingId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // تأكيد جلب المستخدم من DB
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

        const payment = await prisma.payment.create({
            data: {
                folioId: folio.id,
                method,
                amount: Number(amount),
                ref: ref || null,
                postedById: session.user.id,
            },
            include: { postedBy: true },
        });

        // بث عالمي
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

export async function DELETE(req, { params }) {
    try {
        const { bookingId } = params;
        const { paymentId } = await req.json();

        const folio = await prisma.folio.findUnique({ where: { bookingId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        await prisma.payment.delete({ where: { id: paymentId } });

        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "PAYMENT_DELETED", data: { folioId: folio.id, paymentId } }),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete payment" }), { status: 500 });
    }
}
