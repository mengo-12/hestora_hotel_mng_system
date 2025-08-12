"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
    const { data: session, status } = useSession();

    return (
        <header className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-900 shadow fixed top-0 left-0 w-full z-50">
            <Link
                href="/dashboard"
                className="text-xl font-bold text-gray-900 dark:text-white"
            >
                نظام إدارة الفنادق
            </Link>

            {status === "authenticated" ? (
                <div className="flex items-center gap-4">
                    <span className="text-gray-900 dark:text-gray-200">
                        {session.user.name} ({session.user.role})
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                    >
                        تسجيل خروج
                    </button>
                </div>
            ) : (
                <Link
                    href="/login"
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                    تسجيل الدخول
                </Link>
            )}
        </header>

    );
}
