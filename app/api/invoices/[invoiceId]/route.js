import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { invoiceId } = params;
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { booking: true, payments: true },
    });

    if (!invoice) return new Response(JSON.stringify({ error: "الفاتورة غير موجودة" }), { status: 404 });

    return new Response(JSON.stringify(invoice), { status: 200 });
}

export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { invoiceId } = params;
    const data = await req.json();

    try {
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                bookingId: data.bookingId,
                amount: data.amount,
                status: data.status,
            },
        });
        return new Response(JSON.stringify(updatedInvoice), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في تحديث الفاتورة" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { invoiceId } = params;

    try {
        await prisma.invoice.delete({ where: { id: invoiceId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في حذف الفاتورة" }), { status: 500 });
    }
}
