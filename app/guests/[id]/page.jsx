'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GuestForm from '../../components/GuestForm';

export default function EditGuestPage() {
    const { id } = useParams();
    const router = useRouter();
    const [guest, setGuest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchGuest() {
            setLoading(true);
            try {
                const res = await fetch(`/api/guests/${id}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'فشل جلب بيانات النزيل');
                }
                const data = await res.json();
                setGuest(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGuest();
    }, [id]);

    if (loading) return <p className="p-4">جارٍ تحميل بيانات النزيل...</p>;
    if (error) return <p className="p-4 text-red-600">{error}</p>;
    if (!guest) return <p className="p-4 text-gray-600">النزيل غير موجود</p>;

    return (
        <div className="p-4 max-w-3xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 select-none">
                تعديل بيانات النزيل
            </h1>

            <GuestForm
                mode="edit"
                guestData={guest}
                onSuccess={() => router.push('/guests')}
            />
        </div>
    );
}
