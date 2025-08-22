"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/signin");
    }, [status, router]);

    if (status === "loading") return <p>Loading...</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">مرحباً، {session?.user?.name}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                    href="/dashboard/frontdesk/reservations"
                    className="p-6 bg-white rounded shadow hover:bg-blue-50 text-center"
                >
                    إدارة الحجوزات
                </a>
                <a
                    href="/dashboard/housekeeping"
                    className="p-6 bg-white rounded shadow hover:bg-blue-50 text-center"
                >
                    إدارة الغرف / Housekeeping
                </a>
            </div>

            <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
            >
                تسجيل الخروج
            </button>
        </div>
    );
}
