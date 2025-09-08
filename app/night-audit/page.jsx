
// ADMIN: يمكنه كل شيء (تشغيل الـ Night Audit، تصدير، عرض البيانات).

// Manager: يمكنه تشغيل الـ Night Audit وعرض البيانات، تصدير PDF/CSV.

// Roles أخرى أو غير مصرح لها: يمكنهم فقط عرض رسالة عدم صلاحية.

// canRunAudit للتحكم بمن يمكنه تشغيل الـ Night Audit.

// canExport للتحكم بمن يمكنه تصدير/طباعة التقارير.

// canView لمن يمكنه عرض الصفحة.

// الأزرار المقابلة مُعطلة أو تُظهر رسالة إذا لم يكن لدى المستخدم صلاحية.

import ProtectedPage from "@/app/components/ProtectedPage";
import NightAuditPageClient from "./NightAuditPageClient"; // نسخة client-side
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
            <NightAuditPageClient
                initialProperties={userProperties}
                initialPropertyId={userProperties?.[0]?.id || ""}
                session={session}
            />
        </ProtectedPage>
    );
}
