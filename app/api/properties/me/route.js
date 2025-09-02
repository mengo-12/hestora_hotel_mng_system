// app/api/properties/me/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { property: true }
    });

    return new Response(JSON.stringify({ property: user.property || null }));
}
