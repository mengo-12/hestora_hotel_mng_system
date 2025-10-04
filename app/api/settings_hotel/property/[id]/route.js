import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PATCH(req, { params }) {
    try {
        const propertyId = params.id;
        const { name, phone, email, address, currency, timezone, code, adminEmail, adminPassword } = await req.json();

        if (!name || !code) {
            return new Response(JSON.stringify({ error: "Hotel name and code are required" }), { status: 400 });
        }

        // تعديل بيانات الفندق
        const property = await prisma.property.update({
            where: { id: propertyId },
            data: { name, phone, email, address, currency, timezone, code }
        });

        // تحديث بيانات Admin إذا تم إدخالها
        if (adminEmail) {
            const existingAdmin = await prisma.user.findFirst({
                where: { propertyId: property.id, role: "ADMIN" }
            });

            if (existingAdmin) {
                // تحديث بيانات Admin
                await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: {
                        email: adminEmail,
                        password: adminPassword ? await bcrypt.hash(adminPassword, 10) : existingAdmin.password
                    }
                });
            } else if (adminPassword) {
                // إنشاء Admin جديد إذا لم يكن موجود
                await prisma.user.create({
                    data: {
                        name: "Admin",
                        email: adminEmail,
                        password: await bcrypt.hash(adminPassword, 10),
                        role: "Admin",
                        propertyId: property.id
                    }
                });
            }
        }

        return new Response(JSON.stringify(property), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
    }
}


export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        // تحقق أولاً من وجود الفندق
        const property = await prisma.property.findUnique({
            where: { id },
            include: { users: true } // جلب المستخدمين المرتبطين
        });

        if (!property) {
            return new Response(JSON.stringify({ error: "Property not found" }), { status: 404 });
        }

        // حذف المستخدمين المرتبطين بالفندق أولاً
        await prisma.user.deleteMany({
            where: { propertyId: id }
        });

        // حذف الفندق نفسه
        await prisma.property.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ message: "Property and related users deleted successfully" }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Failed to delete property" }), { status: 500 });
    }
}
