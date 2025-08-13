'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return <p>جار تحميل بيانات المستخدم...</p>;
    }

    if (!session) {
        return null; // أو رسالة للمستخدم
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow text-center">
            <h1 className="text-2xl font-bold mb-4">مرحبا، {session.user?.name || session.user?.email}</h1>
            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-red-600 text-white rounded"
            >
                تسجيل الخروج
            </button>
        </div>
    );
}
