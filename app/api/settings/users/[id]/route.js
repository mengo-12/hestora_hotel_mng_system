// app/api/settings/users/[id]/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const data = await req.json();
        const { name, email, role, password, propertyId } = data;

        const updates = { name, email, role, propertyId };
        if (password) updates.password = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: updates,
            include: { property: true }
        });

        // 🔔 Broadcast update
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

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const deletedUser = await prisma.user.delete({
            where: { id: params.id },
            select: { id: true }
        });

        // 🔔 Broadcast deletion
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
