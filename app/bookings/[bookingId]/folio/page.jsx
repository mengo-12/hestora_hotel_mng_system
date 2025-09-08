
// Admin: كامل الصلاحيات (إضافة/تعديل/حذف Charges & Payments، إغلاق/إعادة فتح الفاتورة).

// Manager: إضافة وتعديل Charges & Payments ضمن الخصائص التابعة له، يمكنه إغلاق الفاتورة لكنه لا يستطيع حذف بعض العمليات إذا أردت تحديدها لاحقًا.

// FrontDesk: يمكنه فقط إضافة Charges & Payments، لا يمكنه حذف أو غلق الفاتورة.

// HK أو غير مصرح له: عرض فقط.

// تعريف الصلاحيات حسب الدور (Admin, Manager, FrontDesk).

// التحكم في القدرة على إضافة/حذف Charges و Payments.

// التحكم في القدرة على غلق أو إعادة فتح الفاتورة.

// إخفاء أزرار Add/Delete للمستخدمين غير المخولين.

import ProtectedPage from "@/app/components/ProtectedPage";
import FolioPage from "./FolioPage"; // ✨ أنقل الكود الأصلي هنا
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page({ params }) {
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
            <FolioPage 
                bookingId={params.bookingId} 
                userProperties={userProperties} 
                session={session} 
            />
        </ProtectedPage>
    );
}
