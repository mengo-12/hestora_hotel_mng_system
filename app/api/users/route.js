import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    return new Response(JSON.stringify(users), { status: 200 });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.email || !data.password || !data.role) {
        return new Response(JSON.stringify({ error: "بيانات غير كاملة" }), { status: 400 });
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
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
