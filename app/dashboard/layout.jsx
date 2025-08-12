"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen flex">
            {/* القائمة الجانبية */}
            <aside className="w-64 bg-gray-800 text-white p-6">
                <h2 className="text-2xl mb-8">نظام إدارة الفندق</h2>
                <nav className="flex flex-col space-y-4">
                    <Link href="/dashboard/rooms" className="hover:text-blue-400">الغرف</Link>
                    <Link href="/dashboard/bookings" className="hover:text-blue-400">الحجوزات</Link>
                    <Link href="/dashboard/guests" className="hover:text-blue-400">النزلاء</Link>
                    <Link href="/dashboard/billing" className="hover:text-blue-400">الفواتير</Link>
                    <Link href="/dashboard/staff" className="hover:text-blue-400">الموظفون</Link>
                    <button
                        onClick={() => signOut()}
                        className="mt-8 bg-red-600 py-2 rounded hover:bg-red-700"
                    >
                        تسجيل خروج
                    </button>
                </nav>
            </aside>

            {/* المحتوى الرئيسي */}
            <main className="flex-1 p-8 bg-gray-100">{children}</main>
        </div>
    );
}
