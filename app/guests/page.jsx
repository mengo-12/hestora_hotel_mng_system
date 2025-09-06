// ADMIN: يمكنه إضافة، تعديل، حذف، وعرض النزلاء.

// FrontDesk: يمكنه إضافة وتعديل النزلاء، لكن لا يمكنه الحذف.

// Manager: يمكنه عرض النزلاء فقط، لا إضافة ولا تعديل ولا حذف.

// أضفنا متغيرات الصلاحيات: canAddEdit, canDelete, canView.

// منع العرض أو الأزرار حسب الدور.

// FrontDesk يمكنه إضافة وتعديل، لا يمكن حذف.

// Manager يمكنه فقط عرض النزلاء.

import ProtectedPage from "@/app/components/ProtectedPage";
import GuestsPage from "./GuestsPage";
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
            allowedRoles={["ADMIN", "FrontDesk", "Manager"]}
        >
            <GuestsPage 
                userProperties={userProperties} 
                session={session} 
            />
        </ProtectedPage>
    );
}
