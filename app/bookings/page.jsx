// 'use client';

// import { useState, useEffect } from 'react';
// import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';
// import { useRouter } from 'next/navigation';

// export default function BookingsPage() {
//     const [bookings, setBookings] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const router = useRouter();

//     async function fetchBookings() {
//         setLoading(true);
//         try {
//             const res = await fetch('/api/bookings');
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || 'فشل جلب الحجوزات');
//             setBookings(data);
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => { fetchBookings(); }, []);

//     const handleDelete = async (id) => {
//         if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
//         try {
//             const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || 'فشل الحذف');
//             fetchBookings();
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     return (
//         <div className="min-h-screen p-6 bg-gray-100 dark:bg-[#1e1e1e]">
//             <div className="max-w-7xl mx-auto bg-white dark:bg-[#252526] rounded-lg shadow-lg p-6 border border-gray-300 dark:border-gray-700">
//                 <div className="flex justify-between items-center mb-6">
//                     <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">إدارة الحجوزات</h1>
//                     <button
//                         onClick={() => router.push('/bookings/new')}
//                         className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md shadow-md"
//                     >
//                         + إضافة حجز جديد
//                     </button>
//                 </div>

//                 {loading ? (
//                     <p className="text-center text-gray-700 dark:text-gray-300">جارِ تحميل الحجوزات...</p>
//                 ) : error ? (
//                     <p className="text-center text-red-600">{error}</p>
//                 ) : bookings.length === 0 ? (
//                     <p className="text-center text-gray-600 dark:text-gray-400">لا توجد حجوزات.</p>
//                 ) : (
//                     <div className="overflow-x-auto">
//                         <table className="w-full text-center border-collapse border border-gray-300 dark:border-gray-600">
//                             <thead className="bg-gray-200 dark:bg-[#3a3a3a]">
//                                 <tr>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">النزيل</th>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">الغرفة</th>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">تاريخ الوصول</th>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">تاريخ المغادرة</th>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">الحالة</th>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">السعر</th>
//                                     <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">العمليات</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {bookings.map(b => (
//                                     <tr key={b.id} className="hover:bg-gray-100 dark:hover:bg-[#2c2c2c]">
//                                         <td className="border px-3 py-2">{b.guest.firstName} {b.guest.lastName}</td>
//                                         <td className="border px-3 py-2">{b.room.roomNumber}</td>
//                                         <td className="border px-3 py-2">{new Date(b.checkIn).toLocaleDateString()}</td>
//                                         <td className="border px-3 py-2">{new Date(b.checkOut).toLocaleDateString()}</td>
//                                         <td className="border px-3 py-2">{b.status}</td>
//                                         <td className="border px-3 py-2">{b.totalPrice} ر.س</td>
//                                         <td className="border px-3 py-2 flex justify-center gap-2">
//                                             <button
//                                                 onClick={() => router.push(`/bookings/${b.id}/edit`)}
//                                                 className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-white"
//                                             >
//                                                 <PencilSquareIcon className="w-5 h-5 inline" />
//                                             </button>
//                                             <button onClick={() => handleDelete(b.id)}
//                                                 className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-white">
//                                                 <TrashIcon className="w-5 h-5 inline" />
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }


'use client';

import { useState, useEffect } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    async function fetchBookings() {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل جلب الحجوزات');
            setBookings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchBookings(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل الحذف');
            fetchBookings();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-100 dark:bg-[#1e1e1e]">
            <div className="max-w-7xl mx-auto bg-white dark:bg-[#252526] rounded-lg shadow-lg p-6 border border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">إدارة الحجوزات</h1>
                    <button
                        onClick={() => router.push('/bookings/new')}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md shadow-md"
                    >
                        + إضافة حجز جديد
                    </button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-700 dark:text-gray-300">جارِ تحميل الحجوزات...</p>
                ) : error ? (
                    <p className="text-center text-red-600">{error}</p>
                ) : bookings.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400">لا توجد حجوزات.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse border border-gray-300 dark:border-gray-600">
                            <thead className="bg-gray-200 dark:bg-[#3a3a3a]">
                                <tr>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">النزيل</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">الغرفة</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">تاريخ الوصول</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">تاريخ المغادرة</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">الحالة</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">السعر</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">العمليات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-100 dark:hover:bg-[#2c2c2c]">
                                        <td className="border px-3 py-2">{b.guest.firstName} {b.guest.lastName}</td>
                                        <td className="border px-3 py-2">{b.room.roomNumber}</td>
                                        <td className="border px-3 py-2">{new Date(b.checkIn).toLocaleDateString()}</td>
                                        <td className="border px-3 py-2">{new Date(b.checkOut).toLocaleDateString()}</td>
                                        <td className="border px-3 py-2">{b.status}</td>
                                        <td className="border px-3 py-2">{b.totalPrice} ر.س</td>
                                        <td className="border px-3 py-2 flex justify-center gap-2">
                                            <button
                                                onClick={() => router.push(`/bookings/${b.id}/edit`)}
                                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-white"
                                            >
                                                <PencilSquareIcon className="w-5 h-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(b.id)}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-white"
                                            >
                                                <TrashIcon className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}





