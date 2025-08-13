import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return new Response(
                JSON.stringify({ error: "جميع الحقول مطلوبة" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // تحقق إذا البريد مستخدم مسبقاً
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return new Response(
                JSON.stringify({ error: "البريد الإلكتروني مستخدم مسبقاً" }),
                { status: 409, headers: { "Content-Type": "application/json" } }
            );
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return new Response(
            JSON.stringify({ message: "تم إنشاء المستخدم بنجاح" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "فشل في إنشاء المستخدم" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
