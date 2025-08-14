"use client";
import { useState, useEffect } from "react";
import AddGuestModal from "./AddGuestModal";

export default function NewBookingForm({ onClose, onBookingCreated }) {
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        guestId: "",
        roomId: "",
        checkInDate: "",
        checkOutDate: "",
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "",
        bookingSource: "",
        notes: "",
        pricePerNight: 0,
        totalPrice: 0,
    });

    const [showAddGuestModal, setShowAddGuestModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [resGuests, resRooms] = await Promise.all([
                    fetch("/api/guests"),
                    fetch("/api/rooms"),
                ]);

                if (!resGuests.ok) throw new Error("فشل جلب الضيوف");
                if (!resRooms.ok) throw new Error("فشل جلب الغرف");

                const guestsData = await resGuests.json();
                const roomsData = await resRooms.json();

                setGuests(guestsData);
                setRooms(roomsData);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // عندما يختار المستخدم غرفة، نعبي السعر تلقائياً حسب بيانات الغرفة
    useEffect(() => {
        const selectedRoom = rooms.find((r) => r.id === formData.roomId);
        if (selectedRoom && selectedRoom.pricePerNight) {
            setFormData((prev) => ({ ...prev, pricePerNight: selectedRoom.pricePerNight }));
        } else {
            setFormData((prev) => ({ ...prev, pricePerNight: 0 }));
        }
    }, [formData.roomId, rooms]);

    // حساب السعر الإجمالي بناءً على السعر لليلة وعدد الليالي
    useEffect(() => {
        if (!formData.checkInDate || !formData.checkOutDate || formData.pricePerNight <= 0) {
            setFormData((prev) => ({ ...prev, totalPrice: 0 }));
            return;
        }
        const checkIn = new Date(formData.checkInDate);
        const checkOut = new Date(formData.checkOutDate);
        if (checkOut <= checkIn) {
            setFormData((prev) => ({ ...prev, totalPrice: 0 }));
            return;
        }
        const diffDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total = diffDays * formData.pricePerNight;
        setFormData((prev) => ({ ...prev, totalPrice: total }));
    }, [formData.checkInDate, formData.checkOutDate, formData.pricePerNight]);

    function handleChange(e) {
        const { name, value } = e.target;
        // إذا كان السعر لليلة يتم تحويله لرقم لأن الإدخال نصي
        if (name === "pricePerNight") {
            const numericValue = Number(value);
            setFormData((prev) => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (
            !formData.guestId ||
            !formData.roomId ||
            !formData.checkInDate ||
            !formData.checkOutDate
        ) {
            alert("يرجى ملء جميع الحقول المطلوبة");
            return;
        }
        if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
            alert("تاريخ الخروج يجب أن يكون بعد تاريخ الدخول");
            return;
        }
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "فشل في إنشاء الحجز");
            }
            alert("تم إنشاء الحجز بنجاح");
            onBookingCreated();
            onClose();
        } catch (error) {
            alert(error.message);
        }
    }

    if (loading) return <p>جاري تحميل البيانات...</p>;

    return (
        <>
            <form
                onSubmit={handleSubmit}
                dir="rtl"
                className="bg-white p-6 rounded-lg shadow-lg max-w-4xl max-h-[80vh] overflow-auto"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "1.5rem",
                    alignItems: "center",
                }}
            >
                {/* اختر النزيل */}
                <label className="col-span-6 font-semibold text-gray-800">اختر النزيل</label>
                <select
                    name="guestId"
                    value={formData.guestId}
                    onChange={handleChange}
                    required
                    className="col-span-6 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">اختر النزيل</option>
                    {guests.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.firstName} {g.lastName}
                        </option>
                    ))}
                </select>

                {/* زر إضافة نزيل جديد */}
                <button
                    type="button"
                    onClick={() => setShowAddGuestModal(true)}
                    className="col-span-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-sm transition"
                >
                    إضافة نزيل جديد
                </button>

                {/* اختر الغرفة */}
                <label className="col-span-2 font-semibold text-gray-800">اختر الغرفة</label>
                <select
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleChange}
                    required
                    className="col-span-4 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">اختر الغرفة</option>
                    {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.roomNumber} - {r.pricePerNight ? r.pricePerNight + " ريال لليلة" : ""}
                        </option>
                    ))}
                </select>

                {/* سعر الليلة */}
                <label className="col-span-1 font-semibold text-gray-800">سعر الليلة (ريال)</label>
                <input
                    type="number"
                    min={0}
                    name="pricePerNight"
                    value={formData.pricePerNight}
                    onChange={handleChange}
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* تاريخ الدخول */}
                <label className="col-span-1 font-semibold text-gray-800">تاريخ الدخول</label>
                <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    required
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* تاريخ الخروج */}
                <label className="col-span-1 font-semibold text-gray-800">تاريخ الخروج</label>
                <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    required
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* حالة الحجز */}
                <label className="col-span-1 font-semibold text-gray-800">حالة الحجز</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="PENDING">قيد الانتظار</option>
                    <option value="CONFIRMED">مؤكد</option>
                    <option value="CANCELLED">ملغي</option>
                </select>

                {/* حالة الدفع */}
                <label className="col-span-1 font-semibold text-gray-800">حالة الدفع</label>
                <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    required
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="UNPAID">غير مدفوع</option>
                    <option value="PAID">مدفوع</option>
                    <option value="REFUNDED">مردود</option>
                </select>

                {/* نوع الدفع */}
                <label className="col-span-1 font-semibold text-gray-800">نوع الدفع</label>
                <input
                    name="paymentMethod"
                    placeholder="مثل: نقدي، بطاقة ائتمان، تحويل"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* مصدر الحجز */}
                <label className="col-span-1 font-semibold text-gray-800">مصدر الحجز</label>
                <input
                    name="bookingSource"
                    placeholder="مثل: موقع إلكتروني، مكتب استقبال"
                    value={formData.bookingSource}
                    onChange={handleChange}
                    className="col-span-2 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* الملاحظات */}
                <label className="col-span-6 font-semibold text-gray-800">ملاحظات</label>
                <textarea
                    name="notes"
                    placeholder="ملاحظات إضافية"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="col-span-6 border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {/* السعر الإجمالي */}
                <div className="col-span-6 text-right font-semibold text-gray-900 text-lg">
                    السعر الإجمالي:{" "}
                    <span className="text-green-600">
                        {formData.totalPrice.toLocaleString()} ريال
                    </span>
                </div>

                {/* أزرار التحكم */}
                <div className="col-span-6 flex justify-end gap-4 mt-4">
                    <button
                        type="button"
                        onClick={() => setShowAddGuestModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-sm transition"
                    >
                        إضافة نزيل جديد
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition"
                    >
                        حفظ الحجز
                    </button>
                </div>
            </form>

            {/* مودال إضافة النزيل */}
            {showAddGuestModal && (
                <AddGuestModal
                    isOpen={showAddGuestModal}
                    onClose={() => setShowAddGuestModal(false)}
                    onGuestAdded={(newGuest) => {
                        setGuests((prev) => [newGuest, ...prev]);
                        setFormData((prev) => ({ ...prev, guestId: newGuest.id }));
                        setShowAddGuestModal(false);
                    }}
                />
            )}
        </>
    );
}


