import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { userId } = params;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) return new Response(JSON.stringify({ error: "المستخدم غير موجود" }), { status: 404 });

    return new Response(JSON.stringify(user), { status: 200 });
}

export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { userId } = params;
    const data = await req.json();

    try {
        const updateData = {
            name: data.name,
            email: data.email,
            role: data.role,
        };

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في تحديث المستخدم" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403 });
    }

    const { userId } = params;

    try {
        await prisma.user.delete({ where: { id: userId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "خطأ في حذف المستخدم" }), { status: 500 });
    }
}
