import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPass = process.env.ADMIN_PASSWORD || "password123";

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
        const hashed = bcrypt.hashSync(adminPass, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashed,
                name: "Admin",
                role: "ADMIN"
            }
        });
        console.log("Admin created:", adminEmail);
    } else {
        console.log("Admin exists");
    }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
