

// ADMIN: يمكنه كل شيء (تعديل الغرف، تغيير الحالة، إضافة/إغلاق المهام).

// FrontDesk: يمكنه تعديل حالة الغرفة فقط.

// HK (Housekeeping): يمكنه إضافة وإغلاق المهام، لا يمكنه تعديل الغرف أو حذف أي شيء.

// Manager: يمكنه عرض كل شيء فقط، لا تعديل ولا إضافة.


// app/housekeeping/page.jsx
import ProtectedPage from "@/app/components/ProtectedPage";
import HousekeepingPage from "./HousekeepingPage";
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

    // هنا نمرر JSX فقط
    return (
        <ProtectedPage
            session={session}
            allowedRoles={["ADMIN", "FrontDesk", "HK", "Manager"]}
        >
            <HousekeepingPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}


