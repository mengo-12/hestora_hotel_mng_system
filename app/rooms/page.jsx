'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomsPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [displayedRooms, setDisplayedRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // ✅ جلب كل الغرف مرة واحدة
    async function fetchRooms() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/rooms');
            if (!res.ok) throw new Error('فشل جلب بيانات الغرف');
            const data = await res.json();

            const roomsWithCurrentStatus = data.map(room => ({
                ...room,
                status:
                    room.statusLogs && room.statusLogs.length > 0
                        ? room.statusLogs[0].newStatus
                        : room.status,
            }));

            setRooms(roomsWithCurrentStatus);
            setDisplayedRooms(roomsWithCurrentStatus); // نعرض كل الغرف بالبداية
        } catch (err) {
            setError(err.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRooms();
    }, []);

    // ✅ تحديث العرض حسب الفلتر أو البحث مباشرة
    useEffect(() => {
        let filtered = [...rooms];

        if (filterStatus) {
            filtered = filtered.filter(room => room.status === filterStatus);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                room =>
                    room.roomNumber.toLowerCase().includes(q) ||
                    room.roomType.toLowerCase().includes(q)
            );
        }

        setDisplayedRooms(filtered);
    }, [filterStatus, searchQuery, rooms]);

    async function handleDelete(id) {
        if (!confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return;
        try {
            const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('فشل حذف الغرفة');
            alert('تم حذف الغرفة بنجاح');
            fetchRooms();
        } catch (err) {
            alert(err.message);
        }
    }

    function handleEdit(id) {
        router.push(`/rooms/${id}`);
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#1e1e1e] p-8 font-sans">
            <div className="max-w-6xl mx-auto bg-white dark:bg-[#252526] rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 select-none">
                        قائمة الغرف
                    </h1>
                    <button
                        onClick={() => router.push('/rooms/new')}
                        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-5 py-2 rounded-md shadow-md
              transition
              select-none
              focus:outline-none focus:ring-4 focus:ring-green-400"
                        aria-label="إضافة غرفة جديدة"
                    >
                        + إضافة غرفة
                    </button>
                </div>

                <form
                    onSubmit={e => e.preventDefault()}
                    className="flex flex-col sm:flex-row gap-4 mb-8 justify-center"
                    role="search"
                    aria-label="بحث وفلترة الغرف"
                >
                    <input
                        type="search"
                        placeholder="بحث برقم الغرفة أو النوع"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow max-w-sm px-4 py-3 rounded-md border border-gray-400 dark:border-gray-700
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition"
                        aria-label="بحث برقم الغرفة أو النوع"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-44 px-4 py-3 rounded-md border border-gray-400 dark:border-gray-700
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition"
                        aria-label="اختيار حالة الغرفة"
                    >
                        <option value="">كل الحالات</option>
                        <option value="AVAILABLE">متاحة</option>
                        <option value="OCCUPIED">مشغولة</option>
                        <option value="MAINTENANCE">تحت الصيانة</option>
                    </select>
                </form>

                {loading ? (
                    <p className="text-center text-gray-700 dark:text-gray-300 select-none">جار تحميل الغرف...</p>
                ) : error ? (
                    <p className="text-center text-red-600 select-none">{error}</p>
                ) : displayedRooms.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 select-none">لا توجد غرف مطابقة للبحث.</p>
                ) : (
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-center text-gray-900 dark:text-gray-100">
                        <thead>
                            <tr className="bg-gray-200 dark:bg-[#3a3a3a] select-none">
                                <th className="border border-gray-300 dark:border-gray-600 px-6 py-3 font-medium">رقم الغرفة</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-6 py-3 font-medium">نوع الغرفة</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-6 py-3 font-medium">الحالة</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-6 py-3 font-medium">سعر الليلة</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-6 py-3 font-medium">العمليات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRooms.map(({ id, roomNumber, roomType, status, pricePerNight }) => (
                                <tr
                                    key={id}
                                    className="hover:bg-gray-100 dark:hover:bg-[#2c2c2c] cursor-pointer transition"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(id); }}
                                >
                                    <td className="border border-gray-300 dark:border-gray-600 px-6 py-3">{roomNumber}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-6 py-3">{roomType}</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-6 py-3">
                                        {status === 'AVAILABLE' ? (
                                            <span className="text-green-700 font-semibold">متاحة</span>
                                        ) : status === 'OCCUPIED' ? (
                                            <span className="text-red-700 font-semibold">مشغولة</span>
                                        ) : (
                                            <span className="text-yellow-700 font-semibold">تحت الصيانة</span>
                                        )}
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-6 py-3">{pricePerNight} ر.س</td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-6 py-3 space-x-3">
                                        <button
                                            onClick={() => handleEdit(id)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                        text-white rounded-md shadow-md
                        transition
                        select-none
                        focus:outline-none focus:ring-4 focus:ring-blue-400"
                                            aria-label={`تعديل الغرفة رقم ${roomNumber}`}
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() => handleDelete(id)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800
                        text-white rounded-md shadow-md
                        transition
                        select-none
                        focus:outline-none focus:ring-4 focus:ring-red-400"
                                            aria-label={`حذف الغرفة رقم ${roomNumber}`}
                                        >
                                            حذف
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

