import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10); // 🔑 تشفير كلمة المرور

    const user = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            name: "Admin",
            email: "admin@example.com",
            password: hashedPassword, // ✅ نخزن كلمة مرور مشفرة
            role: "ADMIN",
            propertyId: "cmem62khn0000m1ecwp7p7xap", // 🔴 لازم تعطيه propertyId صالح من جدول Property
        },
    });

    console.log("✅ Admin created:", user);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
