// app/api/settings/users/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req) {
    const users = await prisma.user.findMany({
        include: { property: true } // جلب بيانات الفندق المرتبط
    });
    return new Response(JSON.stringify(users), { status: 200 });
}

export async function POST(req) {
    try {
        const data = await req.json();
        const { name, email, password, role, propertyId } = data;

        if (!name || !email || !password || !propertyId) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                propertyId,
            },
            include: { property: true }
        });

        // 🔔 Broadcast
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "USERS_UPDATED", data: newUser }),
        });

        return new Response(JSON.stringify(newUser), { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const data = await req.json();
        const { name, email, role, password, propertyId } = data;

        const updateData = { name, email, role, propertyId };
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { property: true }
        });

        // 🔔 Broadcast
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "USERS_UPDATED", data: updatedUser }),
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update user" }), { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        const deletedUser = await prisma.user.delete({
            where: { id },
            select: { id: true }
        });

        // 🔔 Broadcast
        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "USERS_UPDATED", data: deletedUser }),
        });

        return new Response(JSON.stringify(deletedUser), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete user" }), { status: 500 });
    }
}
