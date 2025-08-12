import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const staff = await prisma.user.findMany({
        where: { role: { not: "ADMIN" } }, // مثلاً لا تظهر المشرفين الآخرين
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    return new Response(JSON.stringify(staff), { status: 200 });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
        return new Response(JSON.stringify({ error: "بيانات غير كاملة" }), { status: 400 });
    }

    // تشفير كلمة المرور قبل الحفظ
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return new Response(JSON.stringify(newUser), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في إنشاء المستخدم" }), { status: 500 });
    }
}
