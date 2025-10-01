import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: جلب المدفوعات للشركة
export async function GET(req, context) {
    const { params } = context;
    const companyId = params.companyId;

    try {
        // جلب جميع الحجوزات المرتبطة بالشركة
        const bookings = await prisma.booking.findMany({
            where: { companyId },
            include: { guest: true, room: true }
        });
        if (!bookings.length) return new Response(JSON.stringify({ bookings: [], charges: [], payments: [] }), { status: 200 });

        // جلب كل الـ folios والمدفوعات لكل حجز
        const folios = await Promise.all(bookings.map(async (b) => {
            const folio = await prisma.folio.findFirst({ where: { bookingId: b.id } });
            if (!folio) return { booking: b, charges: [], payments: [] };

            const charges = await prisma.charge.findMany({ where: { folioId: folio.id }, orderBy: { createdAt: "desc" } });
            const payments = await prisma.payment.findMany({ where: { folioId: folio.id }, orderBy: { postedAt: "desc" } });

            return { booking: b, charges, payments };
        }));

        // دمج كل المدفوعات والرسوم في arrays منفصلة
        const allCharges = folios.flatMap(f => f.charges.map(c => ({ ...c, booking: f.booking })));
        const allPayments = folios.flatMap(f => f.payments.map(p => ({ ...p, booking: f.booking })));

        return new Response(JSON.stringify({
            bookings,
            charges: allCharges,
            payments: allPayments
        }), { status: 200 });

    } catch (err) {
        console.error("Error fetching company folio:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch company folio" }), { status: 500 });
    }
}

// POST: إضافة دفعة لشركة
export async function POST(req, context) {
    const { params } = context;
    const companyId = params.companyId;

    try {
        const { method, amount, ref, bookingId } = await req.json();
        if (!method || !amount) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

        // تأكد أن الحجز موجود للشركة
        const booking = await prisma.booking.findFirst({ where: { id: bookingId, companyId } });
        if (!booking) return new Response(JSON.stringify({ error: "Booking not found for this company" }), { status: 404 });

        // إيجاد أو إنشاء Folio
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

        // بث التحديث للـ Socket
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

// DELETE: حذف دفعة لشركة
export async function DELETE(req, context) {
    const { params } = context;
    const companyId = params.companyId;

    try {
        const { paymentId } = await req.json();

        // العثور على الـ payment والتحقق من ارتباطه بالشركة
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404 });

        const folio = await prisma.folio.findUnique({ where: { id: payment.folioId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        const booking = await prisma.booking.findUnique({ where: { id: folio.bookingId } });
        if (!booking || booking.companyId !== companyId) return new Response(JSON.stringify({ error: "Booking not associated with this company" }), { status: 403 });

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
