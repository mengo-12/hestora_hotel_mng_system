// app/api/settings/property/route.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const property = await prisma.property.findFirst(); // يمكن تعديلها حسب الفندق المرتبط بالمستخدم
        return new Response(JSON.stringify(property), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch property" }), { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || !["Admin", "Owner"].includes(user.role)) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }

        const data = await req.json();
        const updatedProperty = await prisma.property.update({
            where: { id: user.propertyId },
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                address: data.address,
                logo: data.logo,
                currency: data.currency,
                timezone: data.timezone,
                checkInTime: data.checkInTime,
                checkOutTime: data.checkOutTime,
                cancellationPolicy: data.cancellationPolicy,
                depositPolicy: data.depositPolicy
            },
        });

        return new Response(JSON.stringify(updatedProperty), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to update property" }), { status: 500 });
    }
}
