
// ADMIN: كامل الصلاحيات (Check-in/out، Cancel، No-Show، فتح Folio).

// FrontDesk: Check-in/out، Cancel، No-Show، فتح Folio (لا حذف).

// Manager: عرض فقط، لا يمكن تعديل أي شيء.

// منع ظهور أزرار أو تنفيذ أفعال غير مصرح بها حسب الدور.




import ProtectedPage from "@/app/components/ProtectedPage";
import FrontDeskPage from "./FrontDeskPage";
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
            <FrontDeskPage 
                userProperties={userProperties} 
                session={session} 
            />
        </ProtectedPage>
    );
}
