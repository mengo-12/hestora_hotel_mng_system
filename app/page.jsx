'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    HomeIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    WrenchScrewdriverIcon,
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
    const [alerts, setAlerts] = useState({});
    const [darkMode, setDarkMode] = useState(false);
    const [error, setError] = useState(null);

    // تحميل البيانات من API
    useEffect(() => {
        async function fetchData() {
            try {
                const resStats = await fetch('/api/dashboard/stats');
                if (!resStats.ok) throw new Error('فشل تحميل الإحصائيات');
                const statsData = await resStats.json();
                setStats(statsData);

                const resBookings = await fetch('/api/dashboard/todays-bookings');
                if (resBookings.ok) {
                    const bookingsData = await resBookings.json();
                    setBookings(bookingsData);
                }

                const resAlerts = await fetch('/api/dashboard/alerts');
                if (resAlerts.ok) {
                    const alertsData = await resAlerts.json();
                    setAlerts(alertsData);
                }
            } catch (err) {
                console.error(err);
                setError('⚠️ فشل تحميل البيانات، حاول مجددًا');
            }
        }
        fetchData();
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
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
            <main className="flex-1 p-6 space-y-8">
                {/* إحصائيات */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiles.map(({ title, value, icon: Icon, color, link }, i) => (
                        <div
                            key={i}
                            onClick={() => router.push(link)}
                            className={`${color} cursor-pointer rounded-xl p-6 flex items-center justify-between shadow-lg hover:scale-105 transform transition`}
                        >
                            <div>
                                <h3 className="text-lg font-semibold">{title}</h3>
                                <p className="text-3xl font-bold">{value ?? 0}</p>
                            </div>
                            <Icon className="w-12 h-12 opacity-80" />
                        </div>
                    ))}
                </section>

                {/* رسالة خطأ */}
                {error && (
                    <div className="p-4 bg-red-500 text-white rounded-lg shadow">
                        {error}
                    </div>
                )}

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
                                    bookings.map((b, i) => {
                                        const guestFullName = b.guest
                                            ? `${b.guest.firstName} ${b.guest.lastName}`
                                            : (b.guestName || "—");

                                        return (
                                            <tr
                                                key={i}
                                                className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="p-3">{guestFullName}</td>
                                                <td className="p-3">{b.roomNumber}</td>
                                                <td className="p-3">{new Date(b.checkIn).toLocaleString()}</td>
                                                <td className="p-3">{new Date(b.checkOut).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="text-center p-6 text-gray-500 dark:text-gray-400"
                                        >
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

                        {(!alerts.cleaningNeeded || alerts.cleaningNeeded.length === 0) &&
                            (!alerts.upcomingBookings || alerts.upcomingBookings.length === 0) && (
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
