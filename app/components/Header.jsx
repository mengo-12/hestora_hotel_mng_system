"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    ArrowRightIcon,
    HomeIcon,
    BuildingOffice2Icon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';

export default function Header() {
    const { data: session, status } = useSession();
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => {
            const newMode = !prev;
            if (newMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newMode;
        });
    }, []);

    const navLinks = [
        { label: 'الحجوزات', href: '/reservations', Icon: HomeIcon },
        { label: 'الغرف', href: '/rooms', Icon: BuildingOffice2Icon },
        { label: 'النزلاء', href: '/guests', Icon: UserGroupIcon },
        { label: 'الفواتير', href: '/billing', Icon: CurrencyDollarIcon },
        { label: 'التقارير', href: '/reports', Icon: ChartBarIcon },
    ];

    return (
        <header className="bg-gray-200 dark:bg-gray-800 p-4 shadow-md select-none">
            <div className="flex justify-between items-center mb-2">
                {/* بيانات المستخدم */}
                <div>
                    <h1 className="text-xl font-bold">لوحة التحكم</h1>
                    <p className="text-sm mt-1">
                        {status === 'loading' ? (
                            <span>جاري التحميل...</span>
                        ) : session?.user ? (
                            <>
                                المستخدم: <span className="font-semibold">{session.user.name}</span> | الدور:{' '}
                                <span className="font-semibold">{session.user.role ?? 'غير محدد'}</span>
                            </>
                        ) : (
                            <span>غير مسجل الدخول</span>
                        )}
                    </p>
                </div>

                {/* قائمة التنقل في المنتصف */}
                <nav className="flex-1 mx-8">
                    <ul className="flex justify-center space-x-8 rtl:space-x-reverse">
                        {navLinks.map(({ label, href, Icon }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:bg-blue-600 hover:text-white rounded px-3 py-1 transition cursor-pointer select-none"
                                >
                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                    <span>{label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* الأزرار يمين */}
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <button
                        aria-label="تبديل الوضع الداكن"
                        onClick={toggleDarkMode}
                        className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                    >
                        {darkMode ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-yellow-400"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 3v1m0 16v1m8.485-8.485h-1M4.515 12.515h-1m15.364 5.657l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M12 7a5 5 0 000 10a5 5 0 000-10z"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-gray-800"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
                                />
                            </svg>
                        )}
                    </button>

                    {session?.user && (
                        <button
                            aria-label="تسجيل الخروج"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition flex items-center space-x-1 rtl:space-x-reverse"
                        >
                            <ArrowRightIcon className="w-6 h-6" />
                            <span className="hidden sm:inline">تسجيل خروج</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
