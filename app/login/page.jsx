'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/profile');
        }
    }, [status, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (res.error) {
            setErrorMsg('بيانات الدخول غير صحيحة');
        }
    };

    if (status === 'loading') {
        return <p>جار التحقق من الجلسة...</p>;
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
            <h1 className="text-2xl mb-4 font-bold text-center">تسجيل الدخول</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && <p className="text-red-600 text-center">{errorMsg}</p>}
                <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded"
                >
                    تسجيل الدخول
                </button>
            </form>
        </div>
    );
}
