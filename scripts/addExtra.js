import prisma from "../lib/prisma.js";
import readline from "readline";

// إعداد CLI للـ terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askQuestion(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
    try {
        console.log("➕ إضافة خدمة Extra يدوياً لحجز");

        const bookingId = await askQuestion("Booking ID: ");
        const name = await askQuestion("اسم الخدمة: ");
        const description = await askQuestion("وصف الخدمة (اختياري): ");
        const unitPriceInput = await askQuestion("سعر الوحدة: ");
        const quantityInput = await askQuestion("الكمية: ");
        const taxInput = await askQuestion("الضريبة (اختياري): ");

        const unitPrice = parseFloat(unitPriceInput);
        const quantity = parseInt(quantityInput);
        const tax = taxInput ? parseFloat(taxInput) : undefined;

        // جلب الحجز مع الفاتورة والنزيل
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { folio: true, guest: true },
        });

        if (!booking) throw new Error("Booking not found");

        // إنشاء الخدمة الإضافية
        const extra = await prisma.extra.create({
            data: {
                bookingId: booking.id,
                guestId: booking.guestId,
                name,
                description: description || null,
                unitPrice,
                quantity,
                tax,
                folioId: booking.folio?.id || null,
            },
        });

        // إضافة Charge تلقائيًا للفوليو إذا موجود
        if (booking.folio) {
            await prisma.charge.create({
                data: {
                    folioId: booking.folio.id,
                    code: "EXTRA",
                    description: name,
                    amount: unitPrice * quantity,
                    tax: tax || undefined,
                    postedById: booking.guestId, // يمكنك تغييره لموظف إذا أردت
                },
            });
        }

        console.log("✅ Extra service added:", extra);
    } catch (error) {
        console.error("❌ Error adding Extra service:", error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

main();
