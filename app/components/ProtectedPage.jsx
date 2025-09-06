"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage({ session, allowedRoles, children }) {
    const router = useRouter();

    // إذا ما في جلسة → تحويل لصفحة تسجيل الدخول
    useEffect(() => {
        if (!session) {
            router.replace("/auth/signin");
        }
    }, [session, router]);

    if (!session) {
        return <div className="p-6">⏳ جارٍ التحقق من الجلسة...</div>;
    }

    // تحقق من الدور
    if (!allowedRoles.includes(session.user?.role)) {
        return <div className="p-6">🚫 غير مسموح لك بالوصول إلى هذه الصفحة.</div>;
    }

    return <>{children}</>;
}
