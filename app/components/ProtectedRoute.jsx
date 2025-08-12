"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ allowedRoles, children }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return; // انتظر تحميل الجلسة

        if (!session) {
            router.push("/login"); // غير مسجل دخول
            return;
        }

        if (allowedRoles && !allowedRoles.includes(session.user.role)) {
            router.push("/unauthorized"); // لا يملك صلاحية
        }
    }, [session, status, router, allowedRoles]);

    if (status === "loading" || !session) {
        return <p>جاري التحقق من الصلاحيات...</p>;
    }

    return children;
}
