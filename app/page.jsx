'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowRightIcon, ArrowLeftOnRectangleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import {
    HomeIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    BellAlertIcon,
    WrenchScrewdriverIcon,
    SunIcon,
    MoonIcon,
    LogoutIcon,
} from '@heroicons/react/24/solid';

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [stats, setStats] = useState({
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        todaysBookings: 0,
    });
    const [bookings, setBookings] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [darkMode, setDarkMode] = useState(false);

    // تحميل البيانات من API
    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then((res) => res.json())
            .then((data) => setStats(data))
            .catch(() => { });
        fetch('/api/dashboard/todays-bookings')
            .then((res) => res.json())
            .then((data) => setBookings(data))
            .catch(() => { });
        fetch('/api/dashboard/alerts')
            .then((res) => res.json())
            .then((data) => setAlerts(data))
            .catch(() => { });
    }, []);

    // تحميل حالة الوضع الداكن من localStorage
    useEffect(() => {
        if (
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    // تبديل الوضع الداكن
    // const toggleDarkMode = useCallback(() => {
    //     setDarkMode((prev) => {
    //         const newMode = !prev;
    //         if (newMode) {
    //             document.documentElement.classList.add('dark');
    //             localStorage.setItem('theme', 'dark');
    //         } else {
    //             document.documentElement.classList.remove('dark');
    //             localStorage.setItem('theme', 'light');
    //         }
    //         return newMode;
    //     });
    // }, []);

    // بيانات كاردز الإحصائيات
    const tiles = [
        {
            title: 'الغرف المتاحة',
            value: stats.availableRooms,
            icon: HomeIcon,
            color: 'bg-green-600',
            link: '/rooms',
        },
        {
            title: 'الغرف المشغولة',
            value: stats.occupiedRooms,
            icon: UsersIcon,
            color: 'bg-red-600',
            link: '/rooms',
        },
        {
            title: 'تحت الصيانة',
            value: stats.maintenanceRooms,
            icon: WrenchScrewdriverIcon,
            color: 'bg-yellow-600',
            link: '/rooms',
        },
        {
            title: 'حجوزات اليوم',
            value: stats.todaysBookings,
            icon: ClipboardDocumentListIcon,
            color: 'bg-blue-600',
            link: '/bookings',
        },
    ];

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-700 dark:text-gray-300">
                جارٍ التحميل...
            </div>
        );
    }

    if (!session) {
        // لو ما في جلسة مسجلة، يعيد التوجيه لصفحة تسجيل الدخول
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
            {/* الهيدر */}
            {/* <header className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 p-4 shadow-md">
                <div>
                    <h1 className="text-xl font-bold">لوحة التحكم</h1>
                    <p className="text-sm mt-1">
                        المستخدم: <span className="font-semibold">{session.user.name}</span> | الدور:{' '}
                        <span className="font-semibold">{session.user.role ?? 'غير محدد'}</span>
                    </p>
                </div> */}

                {/* <div className="flex items-center space-x-4"> */}
                    {/* زر تبديل الوضع الداكن */}
                    {/* <button
                        aria-label="تبديل الوضع الداكن"
                        onClick={toggleDarkMode}
                        className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                    >
                        {darkMode ? (
                            <SunIcon className="w-6 h-6 text-yellow-400" />
                        ) : (
                            <MoonIcon className="w-6 h-6 text-gray-800" />
                        )}
                    </button> */}

                    {/* زر تسجيل الخروج */}
                    {/* <button
                        aria-label="تسجيل الخروج"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition flex items-center space-x-1"
                    >
                        <ArrowRightIcon className="w-6 h-6" />
                        <span className="hidden sm:inline">تسجيل خروج</span>
                    </button>
                </div>
            </header> */}

            {/* المحتوى */}
            <main className="flex-1 p-6 space-y-8">
                {/* إحصائيات */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiles.map(({ title, value, icon: Icon, color, link }, i) => (
                        <div
                            key={i}
                            onClick={() => router.push(link)}
                            className={`${color} cursor-pointer rounded-xl p-6 flex items-center justify-between shadow-lg hover:scale-105 transform transition`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') router.push(link);
                            }}
                        >
                            <div>
                                <h3 className="text-lg font-semibold">{title}</h3>
                                <p className="text-3xl font-bold">{value ?? 0}</p>
                            </div>
                            <Icon className="w-12 h-12 opacity-80" />
                        </div>
                    ))}
                </section>

                {/* حجوزات اليوم */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">حجوزات اليوم</h2>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
                        <table className="w-full text-right text-sm text-gray-800 dark:text-gray-200">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3">اسم النزيل</th>
                                    <th className="p-3">رقم الغرفة</th>
                                    <th className="p-3">وقت الدخول</th>
                                    <th className="p-3">وقت الخروج</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length > 0 ? (
                                    bookings.map((b, i) => (
                                        <tr key={i} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="p-3">{b.guestName}</td>
                                            <td className="p-3">{b.roomNumber}</td>
                                            <td className="p-3">{new Date(b.checkIn).toLocaleString()}</td>
                                            <td className="p-3">{new Date(b.checkOut).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center p-6 text-gray-500 dark:text-gray-400">
                                            لا توجد حجوزات لليوم
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* التنبيهات */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">الإشعارات</h2>
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 space-y-3">
                        {alerts.cleaningNeeded?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-red-500 mb-1">غرف تحتاج تنظيف:</h3>
                                <ul className="list-disc pr-6">
                                    {alerts.cleaningNeeded.map((r, i) => (
                                        <li key={i}>الغرفة {r.roomNumber}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {alerts.upcomingBookings?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-yellow-500 mb-1">حجوزات قادمة خلال ساعة:</h3>
                                <ul className="list-disc pr-6">
                                    {alerts.upcomingBookings.map((b, i) => (
                                        <li key={i}>
                                            {b.guestName} - الغرفة {b.roomNumber} (
                                            {new Date(b.checkIn).toLocaleTimeString()})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {alerts.cleaningNeeded?.length === 0 && alerts.upcomingBookings?.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400">لا توجد تنبيهات حالياً</p>
                        )}
                    </div>
                </section>

                {/* وصول سريع */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">وصول سريع</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <QuickButton title="إضافة غرفة" link="/rooms/new" />
                        <QuickButton title="إضافة حجز" link="/bookings/new" />
                        <QuickButton title="قائمة الغرف" link="/rooms" />
                        <QuickButton title="إدارة النزلاء" link="/guests" />
                    </div>
                </section>
            </main>
        </div>
    );
}

function QuickButton({ title, link }) {
    return (
        <Link href={link}>
            <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 text-center cursor-pointer select-none transition">
                {title}
            </div>
        </Link>
    );
}
