'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

export default function GuestsPage() {
    const router = useRouter();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    const [statusFilter, setStatusFilter] = useState('all'); // حالة النزيل

    // تحديث debouncedQ بعد 300ms من توقف الكتابة
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQ(q);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [q]);

    async function fetchGuests() {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (debouncedQ) params.append('q', debouncedQ);
            if (sortField) {
                params.append('sortField', sortField);
                params.append('sortOrder', sortOrder);
            }
            if (statusFilter && statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const res = await fetch(`/api/guests?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('فشل جلب بيانات النزلاء');
            const data = await res.json();

            // مباشرة استخدام البيانات القادمة من API بدون فلترة محلية
            setGuests(Array.isArray(data.items) ? data.items : []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(err.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchGuests();
    }, [page, sortField, sortOrder, debouncedQ, statusFilter]);

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setPage(1);
    };

    async function handleDelete(id) {
        if (!confirm('هل أنت متأكد من حذف هذا النزيل؟')) return;
        try {
            const res = await fetch(`/api/guests/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.error || 'فشل حذف النزيل');
            }
            fetchGuests();
        } catch (err) {
            alert(err.message);
        }
    }

    function handleEdit(id) {
        router.push(`/guests/${id}`);
    }

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? (
            <ChevronUpIcon className="w-4 h-4 inline ml-1" />
        ) : (
            <ChevronDownIcon className="w-4 h-4 inline ml-1" />
        );
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#1e1e1e] p-8 font-sans">
            <div className="max-w-7xl mx-auto bg-white dark:bg-[#252526] rounded-lg shadow-lg p-6 border border-gray-300 dark:border-gray-700">

                {/* رأس الصفحة */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 select-none">
                    <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
                        إدارة النزلاء
                    </h1>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="بحث بالاسم، الهاتف، الجواز، الجنسية"
                            className="flex-1 md:flex-none md:w-80 px-4 py-3 rounded-md border border-gray-400 dark:border-gray-700
                         bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
                         shadow-sm transition"
                            aria-label="بحث عن نزيل"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 rounded-md border border-gray-400 dark:border-gray-700 bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">كل الحالات</option>
                            <option value="current">مقيم حاليًا</option>
                            <option value="left">غادر</option>
                            <option value="upcoming">محجوز له غرفة مستقبلية</option>
                        </select>
                        {/* زر إضافة نزيل */}
                        <button
                            onClick={() => router.push('/guests/new')}
                            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-5 py-3 rounded-md shadow-md
                         transition focus:outline-none focus:ring-4 focus:ring-green-400"
                        >
                            + إضافة نزيل جديد
                        </button>
                    </div>
                </div>

                {/* المحتوى */}
                {loading ? (
                    <p className="text-center text-gray-700 dark:text-gray-300 select-none">جارِ تحميل النزلاء...</p>
                ) : error ? (
                    <p className="text-center text-red-600 select-none">{error}</p>
                ) : !guests || guests.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 select-none">لا توجد نتائج مطابقة.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-center text-gray-900 dark:text-gray-100">
                                <thead>
                                    <tr className="bg-gray-200 dark:bg-[#3a3a3a] select-none">
                                        <th
                                            className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium cursor-pointer"
                                            onClick={() => toggleSort('name')}
                                        >
                                            الاسم <SortIcon field="name" />
                                        </th>
                                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">الجنس</th>
                                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">تاريخ الميلاد</th>
                                        <th
                                            className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium cursor-pointer"
                                            onClick={() => toggleSort('phone')}
                                        >
                                            الهاتف <SortIcon field="phone" />
                                        </th>
                                        <th
                                            className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium cursor-pointer"
                                            onClick={() => toggleSort('nationality')}
                                        >
                                            الجنسية <SortIcon field="nationality" />
                                        </th>
                                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">رقم الجواز</th>
                                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">العمليات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {guests.map((g) => (
                                        <tr
                                            key={g.id}
                                            className="hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition"
                                        >
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap">
                                                {g.firstName} {g.lastName}
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                                                {g.gender === 'Male' ? 'ذكر' : g.gender === 'Female' ? 'أنثى' : g.gender || '-'}
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                                                {g.dateOfBirth ? new Date(g.dateOfBirth).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">{g.phone || '-'}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">{g.nationality || '-'}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">{g.passportNumber || '-'}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleEdit(g.id)}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md shadow-md
                                                                    transition focus:outline-none focus:ring-4 focus:ring-blue-400"
                                                    >
                                                        تعديل
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(g.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-md shadow-md
                                                                transition focus:outline-none focus:ring-4 focus:ring-red-400"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* أزرار Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex justify-center items-center gap-2 select-none">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                                >
                                    السابق
                                </button>
                                {[...Array(totalPages)].map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPage(idx + 1)}
                                        className={`px-3 py-1 rounded ${page === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                                >
                                    التالي
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
