'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoomAvailabilityCalendar from './RoomAvailabilityCalendar';
import GuestForm from './GuestForm';

export default function BookingForm({ booking = null }) {
    const mode = booking ? 'edit' : 'add';
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('selectGuest'); // 'selectGuest' أو 'addGuest'

    const [formData, setFormData] = useState({
        guestId: '',
        roomId: '',
        checkIn: '',
        checkOut: '',
        adults: 1,
        children: 0,
        extraBeds: 0,
        status: 'CONFIRMED',
        source: 'Walk-in',
        notes: '',
    });

    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [roomPrice, setRoomPrice] = useState(0);
    const [taxPercent, setTaxPercent] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [dailyPrices, setDailyPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Fetch guests and rooms
    useEffect(() => {
        async function fetchGuests() {
            try {
                const res = await fetch('/api/guests');
                const data = await res.json();
                setGuests(Array.isArray(data.items) ? data.items : []);
            } catch (err) {
                console.error('Failed to fetch guests:', err);
            }
        }

        async function fetchRooms() {
            try {
                const res = await fetch('/api/rooms');
                const data = await res.json();
                setRooms(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch rooms:', err);
            }
        }

        fetchGuests();
        fetchRooms();

        if (mode === 'edit' && booking) {
            setFormData({
                guestId: booking.guestId || '',
                roomId: booking.roomId || '',
                checkIn: booking.checkIn ? booking.checkIn.slice(0, 10) : '',
                checkOut: booking.checkOut ? booking.checkOut.slice(0, 10) : '',
                adults: booking.adults || 1,
                children: booking.children || 0,
                extraBeds: booking.extraBeds || 0,
                status: booking.status || 'CONFIRMED',
                source: booking.source || 'Walk-in',
                notes: booking.notes || '',
            });
            setRoomPrice(booking.roomPrice || 0);
            setTaxPercent(booking.taxPercent || 0);
            setDiscountPercent(booking.discountPercent || 0);
        }
    }, [mode, booking]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDiscountChange = (e) => {
        setDiscountPercent(parseFloat(e.target.value) || 0);
    };
    const handleTaxChange = (e) => {
        setTaxPercent(parseFloat(e.target.value) || 0);
    };

    // حساب الأسعار اليومية
    useEffect(() => {
        if (formData.roomId && formData.checkIn && formData.checkOut) {
            // البحث عن الغرفة الصحيحة
            const room = rooms.find(r => String(r.id) === String(formData.roomId));
            const basePrice = room ? Number(room.pricePerNight) || 0 : 0; // تم تعديل الاسم هنا

            const discountPct = parseFloat(discountPercent) || 0;
            const taxPct = parseFloat(taxPercent) || 0;

            const checkInDate = new Date(formData.checkIn);
            const checkOutDate = new Date(formData.checkOut);
            const nights = Math.max(Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)), 0);

            const dailyArr = [];
            let total = 0;

            for (let i = 0; i < nights; i++) {
                const current = new Date(checkInDate);
                current.setDate(current.getDate() + i);

                const discount = (basePrice * discountPct) / 100;
                const tax = ((basePrice - discount) * taxPct) / 100;
                const net = basePrice - discount + tax;

                dailyArr.push({
                    date: current.toISOString().slice(0, 10),
                    base: Number(basePrice.toFixed(2)),
                    discount: Number(discount.toFixed(2)),
                    tax: Number(tax.toFixed(2)),
                    net: Number(net.toFixed(2)),
                });

                total += net;
            }

            setRoomPrice(basePrice);
            setDailyPrices(dailyArr);
            setTotalPrice(Number(total.toFixed(2)));
        } else {
            setDailyPrices([]);
            setTotalPrice(0);
        }
    }, [formData.roomId, formData.checkIn, formData.checkOut, discountPercent, taxPercent, rooms]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            const url = mode === 'add' ? '/api/bookings' : `/api/bookings/${booking.id}`;
            const method = mode === 'add' ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, roomPrice, taxPercent, discountPercent, totalPrice, dailyPrices }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل العملية');

            setSuccessMsg(mode === 'add' ? 'تم إضافة الحجز بنجاح' : 'تم تحديث الحجز بنجاح');
            router.push('/bookings');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-start justify-center pt-10 bg-gray-100 dark:bg-[#1e1e1e]">
            <div className="w-full max-w-5xl p-6 space-y-6 rounded-lg border shadow-md bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-700">
                {/* Tabs */}
                <div className="flex border-b border-gray-300 dark:border-gray-600">
                    <button
                        className={`px-4 py-2 font-semibold ${activeTab === 'selectGuest' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab('selectGuest')}
                    >
                        اختر النزيل
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold ${activeTab === 'addGuest' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab('addGuest')}
                    >
                        إضافة نزيل
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'selectGuest' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 border rounded text-red-900 bg-red-200 border-red-400 dark:bg-red-900 dark:text-red-200 dark:border-red-700">{error}</div>}
                        {successMsg && <div className="p-3 border rounded text-green-900 bg-green-200 border-green-400 dark:bg-green-900 dark:text-green-200 dark:border-green-700">{successMsg}</div>}

                        {/* Guest Selector */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">اختر النزيل</label>
                                <select
                                    name="guestId"
                                    value={formData.guestId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">اختر النزيل</option>
                                    {guests.map(g => (
                                        <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Room Selector */}
                        <div>
                            <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">اختر الغرفة</label>
                            <select
                                name="roomId"
                                value={formData.roomId}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">اختر الغرفة</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.roomNumber} - {r.roomType} - {r.pricePerNight} ر.س/ليلة</option>
                                ))}
                            </select>
                        </div>

                        {formData.roomId && <RoomAvailabilityCalendar roomId={formData.roomId} />}

                        {/* Dates, Guests, Discount & Tax */}
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">تاريخ الوصول</label>
                                <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} required
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">تاريخ المغادرة</label>
                                <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} required
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">عدد البالغين</label>
                                <input type="number" min="1" name="adults" value={formData.adults} onChange={handleChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">عدد الأطفال</label>
                                <input type="number" min="0" name="children" value={formData.children} onChange={handleChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">عدد الأسرة الإضافية</label>
                                <input type="number" min="0" name="extraBeds" value={formData.extraBeds} onChange={handleChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">حالة الحجز</label>
                                <select name="status" value={formData.status} onChange={handleChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="CONFIRMED">مؤكد</option>
                                    <option value="PENDING">قيد الانتظار</option>
                                    <option value="CANCELLED">ملغي</option>
                                </select>
                            </div>
                        </div>

                        {/* مصدر الحجز وملاحظات */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">مصدر الحجز</label>
                                <input type="text" name="source" value={formData.source} onChange={handleChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">ملاحظات الحجز</label>
                                <input type="text" name="notes" value={formData.notes} onChange={handleChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        {/* خصم وضرائب */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">الخصم %</label>
                                <input type="number" min="0" max="100" value={discountPercent} onChange={handleDiscountChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">الضرائب %</label>
                                <input type="number" min="0" max="100" value={taxPercent} onChange={handleTaxChange}
                                    className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        {/* Daily Price Table */}
                        {dailyPrices.length > 0 && (
                            <div className="overflow-x-auto border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                                            <th className="px-3 py-2 border">التاريخ</th>
                                            <th className="px-3 py-2 border">سعر الغرفة</th>
                                            <th className="px-3 py-2 border">الخصم</th>
                                            <th className="px-3 py-2 border">الضرائب</th>
                                            <th className="px-3 py-2 border">الصافي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyPrices.map((d, idx) => (
                                            <tr key={idx} className="text-gray-900 dark:text-gray-100">
                                                <td className="px-3 py-2 border">{d.date}</td>
                                                <td className="px-3 py-2 border">{d.base.toFixed(2)} ر.س</td>
                                                <td className="px-3 py-2 border">{d.discount.toFixed(2)} ر.س</td>
                                                <td className="px-3 py-2 border">{d.tax.toFixed(2)} ر.س</td>
                                                <td className="px-3 py-2 border font-semibold">{d.net.toFixed(2)} ر.س</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-200 dark:bg-gray-600 font-bold text-gray-900 dark:text-gray-100">
                                            <td className="px-3 py-2 border text-right" colSpan="4">الإجمالي</td>
                                            <td className="px-3 py-2 border">{totalPrice.toFixed(2)} ر.س</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 mt-4 rounded-md bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 active:shadow-inner transition disabled:opacity-50"
                        >
                            {loading ? (mode === 'add' ? 'جارٍ الإضافة...' : 'جارٍ التحديث...') : mode === 'add' ? 'إضافة الحجز' : 'تحديث الحجز'}
                        </button>

                        {/* زر تسجيل الخروج */}
{mode === 'edit' && formData.status !== 'CHECKED_OUT' && (
    <button
        type="button"
        disabled={loading}
        onClick={async () => {
            if (!confirm('هل أنت متأكد من تسجيل الخروج وإنهاء الحجز؟')) return;
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/bookings/${booking.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'CHECKED_OUT' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'فشل تسجيل الخروج');

                setSuccessMsg('تم تسجيل الخروج بنجاح، الغرفة الآن تحت التنظيف.');
                setFormData(prev => ({ ...prev, status: 'CHECKED_OUT' }));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }}
        className="w-full py-2 mt-2 rounded-md bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 active:shadow-inner transition disabled:opacity-50"
    >
        تسجيل الخروج
    </button>
)}
                    </form>
                )}

                {activeTab === 'addGuest' && (
                    <GuestForm onSuccess={(newGuest) => {
                        setFormData(prev => ({ ...prev, guestId: newGuest.id }));
                        setActiveTab('selectGuest');
                        setGuests(prev => [...prev, newGuest]);
                    }} />
                )}
            </div>
        </div>
    );
}



