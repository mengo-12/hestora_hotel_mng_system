"use client";

import { useSession, signOut } from "next-auth/react";

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") return <p>جاري التحميل...</p>;

    if (!session) return <p>غير مسموح بالدخول، الرجاء تسجيل الدخول.</p>;

    return (
        <div>
            <h1>مرحباً، {session.user.name}</h1>
            <p>دورك: {session.user.role}</p>
            <button onClick={() => signOut()}>تسجيل خروج</button>
        </div>
    );
}
