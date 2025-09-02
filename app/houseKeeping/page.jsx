// app/housekeeping/page.jsx
import HousekeepingPage from "./HousekeepingPage";
import prisma from "@/lib/prisma"; // تأكد من مسار prisma

// مثال لجلب معرف المستخدم من session
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // ملف إعدادات next-auth الخاص بك

export default async function Page() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    let userProperties = [];
    if (userId) {
        userProperties = await prisma.property.findMany({
            where: {
                users: {
                    some: { id: userId }
                }
            },
            select: { id: true, name: true }
        });
    }

    return <HousekeepingPage userProperties={userProperties || []} />;
}
