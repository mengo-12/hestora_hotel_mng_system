'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    // useEffect(() => {
    //     router.replace('/ar'); // أو '/en' لو تريده افتراضي انجليزي
    // }, [router]);

    <div className="bg-red-500 text-white p-4">Test Tailwind</div>

    return null;
}