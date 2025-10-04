import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ استيراد من lib/auth

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const property = await prisma.property.findFirst();
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


export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.role !== "Owner") {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }

        const { name, phone, email, address, currency, timezone, adminEmail, adminPassword } = await req.json();

        if (!name || !adminEmail || !adminPassword) {
            return new Response(JSON.stringify({ error: "Hotel name and admin credentials are required" }), { status: 400 });
        }

        // إنشاء الفندق
        const property = await prisma.property.create({
            data: { name, phone, email, address, currency, timezone }
        });

        // إنشاء Admin للعميل
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                role: "Admin",
                propertyId: property.id
            }
        });

        return new Response(JSON.stringify(property), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to create hotel" }), { status: 500 });
    }
}