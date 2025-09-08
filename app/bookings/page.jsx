// ADMIN: كامل الصلاحيات (إضافة، تحرير، حذف، check-in/out، cancel، noshow، folio)

// FrontDesk: إضافة، تحرير، check-in/out، cancel، folio (لا حذف)

// Manager: عرض الحجوزات فقط، لا يمكن تعديل أو حذف أو إجراء عمليات

// صلاحيات لكل زر ووظيفة حسب الدور.

// منع المستخدم من فتح المودالات أو تنفيذ أفعال غير مصرح بها.

// مرن ويمكن تعديل الأدوار أو الأذونات بسهولة (canAdd, canEdit, canDelete, إلخ).



import ProtectedPage from "@/app/components/ProtectedPage";
import BookingsPage from "./BookingsPage"; // ✨ تأكد عندك ملف BookingsPage.jsx فيه الكود الأصلي
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
            allowedRoles={["Admin", "FrontDesk", "Manager"]}
        >
            <BookingsPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}
