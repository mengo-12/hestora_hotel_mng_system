// app/components/withRoleProtection.jsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default function withRoleProtection(PageComponent, allowedRoles = []) {
    return async function ProtectedPage(props) {
        const session = await getServerSession(authOptions);

        // إذا ما في جلسة → رجع خطأ أو تحويل لصفحة تسجيل الدخول
        if (!session) {
            return <div className="p-6">❌ تحتاج تسجيل الدخول للوصول لهذه الصفحة.</div>;
        }

        // تحقق من الدور
        const userRole = session.user?.role;
        if (!allowedRoles.includes(userRole)) {
            return <div className="p-6">🚫 غير مسموح لك بالوصول إلى هذه الصفحة.</div>;
        }

        // مرر الـ props مع الجلسة
        return <PageComponent {...props} session={session} />;
    };
}
