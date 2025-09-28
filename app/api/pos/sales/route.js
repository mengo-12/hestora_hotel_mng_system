'use server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req) {
    try {
        // جلب بيانات المستخدم من الجلسة
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "User not authenticated" }), { status: 401 });
        }
        const userId = session.user.id;

        // جلب بيانات الطلب
        const body = await req.json();
        const { outletId, items } = body;

        if (!outletId || !items || !items.length) {
            return new Response(JSON.stringify({ error: "Outlet and items are required" }), { status: 400 });
        }

        // حساب الإجمالي والضريبة
        let total = 0;
        let totalTax = 0;

        const itemsData = items.map(i => {
            const subtotal = i.price * i.quantity;
            const taxAmount = subtotal * (i.tax / 100); // الضريبة كنسبة مئوية
            total += subtotal;
            totalTax += taxAmount;

            return {
                itemId: i.id,
                quantity: i.quantity,
                price: i.price,
                tax: i.tax,
                subtotal
            };
        });

        // إنشاء POS Sale في قاعدة البيانات
        const sale = await prisma.pOSSale.create({
            data: {
                outletId,
                userId,
                total,
                tax: totalTax,
                items: {
                    create: itemsData
                }
            },
            include: { items: true }
        });

        // --- Broadcast عبر fetch ---
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "POS_SALE_CREATED", data: sale })
            });
        } catch (err) {
            console.error("Socket broadcast failed:", err);
        }

        return new Response(JSON.stringify(sale), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create sale" }), { status: 500 });
    }
}

// GET جميع المبيعات
export async function GET(req) {
    try {
        const sales = await prisma.POSSale.findMany({
            include: {
                items: true,
                outlet: true,
                user: true,
                folio: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return new Response(JSON.stringify(sales), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response("Failed to fetch POS Sales", { status: 500 });
    }
}
