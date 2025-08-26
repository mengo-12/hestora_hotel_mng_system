import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
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
        console.log("👤 إنشاء مستخدم جديد");

        const email = await askQuestion("Email: ");
        const name = await askQuestion("Name: ");
        const password = await askQuestion("Password: ");
        const role = await askQuestion("Role (ADMIN/STAFF/USER): ");
        const propertyId = await askQuestion("PropertyId (اختياري): ");

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role.toUpperCase(),
                propertyId: propertyId || null,
            },
        });

        console.log("✅ User created:", newUser);
    } catch (error) {
        console.error("❌ Error creating user:", error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

main();
