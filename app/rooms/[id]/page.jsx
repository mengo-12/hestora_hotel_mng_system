'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditRoomPage() {
  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState({
    roomNumber: '',
    roomType: '',
    status: 'AVAILABLE',
    pricePerNight: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${id}`);
        if (!res.ok) throw new Error('فشل جلب بيانات الغرفة');
        const data = await res.json();
        setForm({
          roomNumber: data.roomNumber,
          roomType: data.roomType,
          status: data.status,
          pricePerNight: data.pricePerNight,
          description: data.description || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل تعديل الغرفة');
      }
      alert('تم تحديث بيانات الغرفة');
      router.push('/rooms');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-700 dark:text-gray-300 select-none">
        جار تحميل بيانات الغرفة...
      </p>
    );
  if (error)
    return (
      <p className="text-center mt-20 text-red-600 select-none">{error}</p>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1e1e1e] p-8 font-sans flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl w-full bg-white dark:bg-[#252526] rounded-lg shadow-lg p-8
          select-none
          "
        aria-label="نموذج تعديل بيانات الغرفة"
      >
        <h2 className="text-4xl font-semibold mb-8 text-gray-900 dark:text-gray-100 select-none">
          تعديل بيانات الغرفة
        </h2>

        {/* رقم الغرفة */}
        <div className="mb-6">
          <label
            htmlFor="roomNumber"
            className="block mb-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            رقم الغرفة
          </label>
          <input
            id="roomNumber"
            name="roomNumber"
            value={form.roomNumber}
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-400 dark:border-gray-700 rounded-md
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition
            "
            placeholder="أدخل رقم الغرفة"
            aria-required="true"
          />
        </div>

        {/* نوع الغرفة */}
        <div className="mb-6">
          <label
            htmlFor="roomType"
            className="block mb-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            نوع الغرفة
          </label>
          <input
            id="roomType"
            name="roomType"
            value={form.roomType}
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-400 dark:border-gray-700 rounded-md
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition
            "
            placeholder="أدخل نوع الغرفة"
            aria-required="true"
          />
        </div>

        {/* الحالة */}
        <div className="mb-6">
          <label
            htmlFor="status"
            className="block mb-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            حالة الغرفة
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-400 dark:border-gray-700 rounded-md
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition
            "
            aria-required="true"
          >
            <option value="AVAILABLE">متاحة</option>
            <option value="OCCUPIED">مشغولة</option>
            <option value="MAINTENANCE">تحت الصيانة</option>
          </select>
        </div>

        {/* سعر الليلة */}
        <div className="mb-6">
          <label
            htmlFor="pricePerNight"
            className="block mb-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            سعر الليلة (ر.س)
          </label>
          <input
            id="pricePerNight"
            type="number"
            name="pricePerNight"
            value={form.pricePerNight}
            onChange={handleChange}
            required
            min={0}
            className="w-full p-4 border border-gray-400 dark:border-gray-700 rounded-md
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition
            "
            placeholder="أدخل سعر الليلة"
            aria-required="true"
          />
        </div>

        {/* وصف الغرفة */}
        <div className="mb-8">
          <label
            htmlFor="description"
            className="block mb-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            وصف الغرفة (اختياري)
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="w-full p-4 border border-gray-400 dark:border-gray-700 rounded-md
              bg-gray-50 dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400
              shadow-sm
              transition
            "
            placeholder="أدخل وصفًا مختصرًا للغرفة"
          />
        </div>

        {/* زر الحفظ */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            className="px-6 py-3 bg-gray-400 hover:bg-gray-500 active:bg-gray-600
              text-white rounded-md shadow-md select-none
              focus:outline-none focus:ring-4 focus:ring-gray-300
              transition
            "
            aria-label="إلغاء التعديل"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              text-white rounded-md shadow-md select-none
              focus:outline-none focus:ring-4 focus:ring-blue-400
              transition
            "
            aria-label="حفظ التعديلات"
          >
            حفظ التعديلات
          </button>
        </div>
      </form>
    </div>
  );
}
