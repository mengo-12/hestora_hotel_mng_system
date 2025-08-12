import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const invoices = await prisma.invoice.findMany({
        include: {
            booking: true,
            payments: true,
        },
    });

    return new Response(JSON.stringify(invoices), { status: 200 });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const data = await req.json();

    try {
        const newInvoice = await prisma.invoice.create({
            data: {
                bookingId: data.bookingId,
                amount: data.amount,
                status: data.status || "OPEN",
            },
        });
        return new Response(JSON.stringify(newInvoice), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في إنشاء الفاتورة" }), { status: 500 });
    }
}
