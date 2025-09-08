
// Admin: كامل الصلاحيات (يمكنه تعديل كل الحقول وحفظ الإعدادات).

// Manager: يمكنه تعديل معظم الحقول إلا بعض الإعدادات الحساسة (مثل العملة أو الصلاحيات المالية).

// FrontDesk / HK: يمكنهم فقط رؤية المعلومات، لا يمكنهم التعديل.


import ProtectedPage from "@/app/components/ProtectedPage";
import PropertySettingsPage from "./PropertySettingsPage"; // نسخة client-side
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page() {
    const session = await getServerSession(authOptions);

    let userProperties = [];
    if (session?.user?.id) {
        userProperties = await prisma.property.findMany({
            where: {
                users: { some: { id: session.user.id } }
            },
            select: { id: true, name: true }
        });
    }

    return (
        <ProtectedPage
            session={session}
            allowedRoles={["Admin", "Manager"]}
        >
            <PropertySettingsPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}
