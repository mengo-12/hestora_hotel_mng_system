// app/api/pos/sales/route.js
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// export async function POST(req) {
//     try {
//         const { outletId, items, folioId, paymentMethod, discount, userId } = await req.json();

//         if (!outletId || !items?.length) {
//             return new Response(JSON.stringify({ error: "Outlet and items are required" }), { status: 400 });
//         }

//         // حساب القيم على السيرفر
//         const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
//         const tax = items.reduce((sum, i) => sum + (i.price * i.quantity * (i.tax / 100)), 0);
//         const discountAmount = (subtotal * (discount || 0)) / 100;
//         const total = subtotal + tax - discountAmount;

//         console.log("📌 Sale Data to Save:", {
//             outletId,
//             paymentMethod,
//             discount: discount || 0,
//             subtotal,
//             tax,
//             total,
//             userId
//         });

//         // إنشاء عملية البيع
//         const sale = await prisma.pOSSale.create({
//             data: {
//                 outletId,
//                 paymentMethod,
//                 discount: new Prisma.Decimal(discount || 0),
//                 subtotal: new Prisma.Decimal(subtotal),
//                 tax: new Prisma.Decimal(tax),
//                 total: new Prisma.Decimal(total),
//                 userId,
//                 items: {
//                     create: items.map(i => ({
//                         itemId: i.id,
//                         name: i.name,
//                         price: new Prisma.Decimal(i.price),
//                         tax: new Prisma.Decimal(i.tax),
//                         quantity: i.quantity,
//                         subtotal: new Prisma.Decimal(i.price * i.quantity),
//                     })),
//                 },
//             },
//             include: { items: true },
//         });

//         // إذا كان الدفع مربوط بـ Folio
//         if (folioId) {
//             await prisma.pOSCharge.create({
//                 data: {
//                     amount: new Prisma.Decimal(total),
//                     description: `POS Sale ${sale.id}`,
//                     outlet: { connect: { id: outletId } },
//                     postedBy: { connect: { id: userId } },
//                     folio: folioId ? { connect: { id: folioId } } : undefined,
//                 },
//             });

//             // تسجيل الدفع النقدي أو البطاقة
//             if (["Cash", "Card"].includes(paymentMethod)) {
//                 await prisma.payment.create({
//                     data: {
//                         folioId,
//                         method: paymentMethod,
//                         amount: new Prisma.Decimal(total),
//                         postedById: userId,
//                     },
//                 });
//             }
//         }

//         // تحويل Decimal إلى أرقام قبل الإرسال
//         const saleForFrontend = {
//             ...sale,
//             subtotal: Number(sale.subtotal),
//             tax: Number(sale.tax),
//             total: Number(sale.total),
//             items: sale.items.map(i => ({
//                 ...i,
//                 price: Number(i.price),
//                 tax: Number(i.tax),
//                 subtotal: Number(i.subtotal),
//             })),
//         };

//         return new Response(JSON.stringify(saleForFrontend), { status: 200 });

//     } catch (err) {
//         console.error("❌ POS Sale Error:", err);
//         return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
//     }
// }


export async function POST(req) {
    try {
        const { outletId, items, folioId, paymentMethod, discount, userId } = await req.json();

        if (!outletId || !items?.length) {
            return new Response(JSON.stringify({ error: "Outlet and items are required" }), { status: 400 });
        }

        // حساب القيم
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const tax = items.reduce((sum, i) => sum + (i.price * i.quantity * (i.tax / 100)), 0);
        const discountAmount = (subtotal * (discount || 0)) / 100;
        const total = subtotal + tax - discountAmount;

        // إنشاء Sale وربطه بالـ Folio إذا موجود
        const sale = await prisma.pOSSale.create({
            data: {
                outletId,
                userId,
                paymentMethod,
                discount: new Prisma.Decimal(discount || 0),
                subtotal: new Prisma.Decimal(subtotal),
                tax: new Prisma.Decimal(tax),
                total: new Prisma.Decimal(total),
                folioId: folioId || null, // ✅ ربط Folio
                items: {
                    create: items.map(i => ({
                        itemId: i.id,
                        name: i.name,
                        price: new Prisma.Decimal(i.price),
                        tax: new Prisma.Decimal(i.tax),
                        quantity: i.quantity,
                        subtotal: new Prisma.Decimal(i.price * i.quantity),
                    })),
                },
            },
            include: { items: true },
        });

        // إنشاء POSCharge مرتبط بالـ Sale و Folio إذا الدفع Room
        if (folioId) {
            await prisma.pOSCharge.create({
                data: {
                    amount: new Prisma.Decimal(total),
                    description: `POS Sale ${sale.id}`,
                    outlet: { connect: { id: outletId } },
                    postedBy: { connect: { id: userId } },
                    folio: folioId ? { connect: { id: folioId } } : undefined, // ✅ استخدم folio وليس folioId
                    saleId: sale.id,
                },
            });

            // تسجيل الدفع النقدي أو البطاقة
            if (["Cash", "Card"].includes(paymentMethod)) {
                await prisma.payment.create({
                    data: {
                        folio: folioId ? { connect: { id: folioId } } : undefined, // ربط الدفع بالـ Folio
                        method: paymentMethod,
                        amount: new Prisma.Decimal(total),
                        postedBy: { connect: { id: userId } },
                    },
                });
            }
        }

        // تحويل Decimal إلى أرقام قبل الإرسال
        const saleForFrontend = {
            ...sale,
            subtotal: Number(sale.subtotal),
            tax: Number(sale.tax),
            total: Number(sale.total),
            items: sale.items.map(i => ({
                ...i,
                price: Number(i.price),
                tax: Number(i.tax),
                subtotal: Number(i.subtotal),
            })),
        };

        return new Response(JSON.stringify(saleForFrontend), { status: 200 });

    } catch (err) {
        console.error("❌ POS Sale Error:", err);
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}


// GET جميع المبيعات
export async function GET(req) {
    try {
        const sales = await prisma.pOSSale.findMany({
            include: {
                items: {
                    include: { item: true }  // جلب معلومات العنصر المرتبط
                },
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
