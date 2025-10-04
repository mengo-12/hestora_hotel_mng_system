import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Owner") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const properties = await prisma.property.findMany({
            include: { users: { select: { email: true, role: true } } }
        });

        return new Response(JSON.stringify(properties), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch hotels" }), { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.role !== "Owner") {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }

        const { name, phone, email, address, currency, timezone, code } = await req.json();

        if (!name || !code) {
            return new Response(JSON.stringify({ error: "Hotel name and code are required" }), { status: 400 });
        }

        const property = await prisma.property.create({
            data: { name, phone, email, address, currency, timezone, code }
        });

        // إنشاء المستخدم Admin للفندق
        // إذا تم إدخال بيانات Admin، ننشئ المستخدم
        if (adminEmail && adminPassword) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await prisma.user.create({
                data: {
                    name: "Admin",
                    email: adminEmail,
                    password: hashedPassword,
                    role: "Admin",
                    propertyId: property.id
                }
            });
        }


        return new Response(JSON.stringify(property), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create hotel" }), { status: 500 });
    }
}