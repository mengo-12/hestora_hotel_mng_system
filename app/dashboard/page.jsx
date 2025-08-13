'use client';

import { useRouter } from 'next/navigation';

const sections = [
    {
        title: 'إدارة الغرف',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M3 7v4a1 1 0 001 1h2v4a1 1 0 001 1h2" />
                <path d="M12 3v4a1 1 0 001 1h5a1 1 0 001-1V3" />
                <path d="M17 13v4a1 1 0 001 1h2v-4" />
            </svg>
        ),
        link: '/rooms',
        description: 'إضافة وتعديل وحذف الغرف',
        bgColor: 'bg-blue-600',
    },
    {
        title: 'إدارة الحجوزات',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M8 7V3M16 7V3M3 11h18M5 19h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
            </svg>
        ),
        link: '/bookings',
        description: 'متابعة وإدارة الحجوزات',
        bgColor: 'bg-green-600',
    },
    {
        title: 'إدارة العملاء',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M16 14a4 4 0 00-8 0v4h8v-4z" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
        link: '/customers',
        description: 'إدارة بيانات العملاء',
        bgColor: 'bg-yellow-600',
    },
    {
        title: 'الفواتير والمدفوعات',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M12 8c-1.333-1.333-4-1.333-5 0s-1.333 4 0 5 4 1.333 5 0 1.333-4 0-5z" />
                <path d="M12 12v4" />
                <path d="M12 16h4" />
            </svg>
        ),
        link: '/invoices',
        description: 'متابعة الفواتير والمدفوعات',
        bgColor: 'bg-red-600',
    },
    {
        title: 'التقارير والإحصائيات',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M3 3v18h18" />
                <path d="M9 17V9m4 8V5m4 12v-6" />
            </svg>
        ),
        link: '/reports',
        description: 'عرض تقارير مفصلة',
        bgColor: 'bg-purple-600',
    },
];

export default function Dashboard() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-4xl font-bold mb-8 text-center">لوحة التحكم الرئيسية</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {sections.map(({ title, icon, link, description, bgColor }) => (
                    <div
                        key={title}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(link)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') router.push(link);
                        }}
                        className={`${bgColor} cursor-pointer rounded-lg p-6 flex flex-col items-center text-white shadow-lg hover:scale-105 transition-transform duration-200`}
                    >
                        <div>{icon}</div>
                        <h2 className="mt-4 text-xl font-semibold">{title}</h2>
                        <p className="mt-2 text-sm text-white/80 text-center">{description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
