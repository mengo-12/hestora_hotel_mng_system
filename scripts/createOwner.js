import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
    const hashedPassword = await bcrypt.hash("owner123", 10);

    const user = await prisma.user.upsert({
        where: { email: "owner@example.com" },
        update: {},
        create: {
            name: "Owner",
            email: "owner@example.com",
            password: hashedPassword,
            role: "Owner",
            propertyId: null, // غير مرتبط بأي فندق
        },
    });

    console.log("✅ Owner created:", user);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
