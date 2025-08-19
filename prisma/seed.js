// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";
// const prisma = new PrismaClient();

// async function main() {
//     const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
//     const adminPass = process.env.ADMIN_PASSWORD || "password123";

//     const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
//     if (!existing) {
//         const hashed = bcrypt.hashSync(adminPass, 10);
//         await prisma.user.create({
//             data: {
//                 email: adminEmail,
//                 password: hashed,
//                 name: "Admin",
//                 role: "ADMIN"
//             }
//         });
//         console.log("Admin created:", adminEmail);
//     } else {
//         console.log("Admin exists");
//     }
// }

// main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });


// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.extraService.createMany({
        data: [
            { name: "إفطار", price: 50 },
            { name: "غداء", price: 70 },
            { name: "عشاء", price: 60 },
            { name: "نقل من المطار", price: 120 },
            { name: "تنظيف خاص", price: 80 },
            { name: "تنظيف سريع", price: 50 },
            { name: "غسيل الملابس", price: 40 },
        ],
        skipDuplicates: true,
    });
}

main()
    .then(() => console.log("✅ تم إضافة كل الخدمات الإضافية"))
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
