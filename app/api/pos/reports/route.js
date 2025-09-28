'use server';
import prisma from '@/lib/prisma';

export async function GET(req) {
    try {
        const outlets = await prisma.POSOutlet.findMany({
            include: {
                sales: {
                    include: {
                        items: true, // POSSaleItem
                    },
                },
            },
        });

        const report = [];

        for (const ol of outlets) {
            const itemsMap = {};

            // جلب كل الأصناف المتعلقة بهذا الفرع (Outlet) للحصول على المخزون
            const outletItems = await prisma.POSItem.findMany({
                where: { outletId: ol.id },
            });

            // إعداد أصناف
            outletItems.forEach(i => {
                itemsMap[i.name] = {
                    name: i.name,
                    stock: i.stock ?? "N/A",
                    quantitySold: 0,
                    revenue: 0,
                    tax: 0,
                };
            });

            let totalRevenue = 0;
            let totalTax = 0;
            let totalQuantitySold = 0;

            // حساب المبيعات لكل صنف
            ol.sales.forEach(sale => {
                sale.items.forEach(i => {
                    const name = i.name ?? "N/A";
                    if (!itemsMap[name]) {
                        itemsMap[name] = { name, stock: "N/A", quantitySold: 0, revenue: 0, tax: 0 };
                    }
                    itemsMap[name].quantitySold += i.quantity;
                    const itemRevenue = Number(i.price) * i.quantity;
                    const itemTax = itemRevenue * (Number(i.tax) / 100);
                    itemsMap[name].revenue += itemRevenue;
                    itemsMap[name].tax += itemTax;

                    totalRevenue += itemRevenue;
                    totalTax += itemTax;
                    totalQuantitySold += i.quantity;
                });
            });

            report.push({
                outletId: ol.id,
                outletName: ol.name,
                totalRevenue,
                totalTax,
                totalQuantitySold,
                items: Object.values(itemsMap),
            });
        }

        return new Response(JSON.stringify(report), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response("Failed to fetch report", { status: 500 });
    }
}
