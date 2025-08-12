"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewBookingPage() {
    const router = useRouter();

    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        guestId: "",
        roomId: "",
        checkInDate: "",
        checkOutDate: "",
    });

    // جلب الضيوف والغرف لملء القوائم المنسدلة
    useEffect(() => {
        async function fetchData() {
            try {
                const guestsRes = await fetch("/api/guests");
                const guestsData = await guestsRes.json();

                const roomsRes = await fetch("/api/rooms");
                const roomsData = await roomsRes.json();

                setGuests(guestsData);
                setRooms(roomsData);
            } catch (error) {
                alert("فشل في جلب البيانات: " + error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    function handleChange(e) {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.guestId || !formData.roomId || !formData.checkInDate || !formData.checkOutDate) {
            alert("يرجى ملء جميع الحقول");
            return;
        }

        if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
            alert("تاريخ الخروج يجب أن يكون بعد تاريخ الدخول");
            return;
        }

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("فشل في إنشاء الحجز");

            alert("تم إنشاء الحجز بنجاح");
            router.push("/dashboard/bookings");
        } catch (error) {
            alert(error.message);
        }
    }

    if (loading) return <p className="p-6">جاري تحميل البيانات...</p>;

    return (
        <div className="p-6 bg-gray-100 min-h-screen font-sans">
            <h1 className="text-2xl font-bold mb-6">إضافة حجز جديد</h1>
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow-md max-w-lg mx-auto"
                dir="rtl"
            >
                <div className="mb-4">
                    <label htmlFor="guestId" className="block mb-1 font-semibold">النزيل</label>
                    <select
                        id="guestId"
                        name="guestId"
                        value={formData.guestId}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        required
                    >
                        <option value="">اختر النزيل</option>
                        {guests.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.firstName} {g.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="roomId" className="block mb-1 font-semibold">الغرفة</label>
                    <select
                        id="roomId"
                        name="roomId"
                        value={formData.roomId}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        required
                    >
                        <option value="">اختر الغرفة</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.roomNumber} - {r.type}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="checkInDate" className="block mb-1 font-semibold">تاريخ الدخول</label>
                    <input
                        type="date"
                        id="checkInDate"
                        name="checkInDate"
                        value={formData.checkInDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="checkOutDate" className="block mb-1 font-semibold">تاريخ الخروج</label>
                    <input
                        type="date"
                        id="checkOutDate"
                        name="checkOutDate"
                        value={formData.checkOutDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    حفظ الحجز
                </button>
            </form>
        </div>
    );
}
