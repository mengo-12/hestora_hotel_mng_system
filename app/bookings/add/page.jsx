"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddBookingPage() {
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [guestId, setGuestId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [status, setStatus] = useState("PENDING");
    const [paymentStatus, setPaymentStatus] = useState("UNPAID");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const guestsRes = await fetch("/api/guests");
            const guestsData = await guestsRes.json();
            setGuests(guestsData);

            const roomsRes = await fetch("/api/rooms");
            const roomsData = await roomsRes.json();
            setRooms(roomsData);

            setLoading(false);
        }
        fetchData();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!guestId || !roomId || !checkInDate || !checkOutDate) {
            alert("يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }

        if (new Date(checkInDate) >= new Date(checkOutDate)) {
            alert("تاريخ الخروج يجب أن يكون بعد تاريخ الدخول");
            return;
        }

        const data = {
            guestId,
            roomId,
            checkInDate,
            checkOutDate,
            status,
            paymentStatus,
            // createdById يمكن إضافة id المستخدم الحالي إذا أردت لاحقًا
        };

        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/bookings");
        } else {
            alert("حدث خطأ أثناء إضافة الحجز");
        }
    }

    if (loading) return <p>جاري التحميل...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">إضافة حجز جديد</h1>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label>اختر النزيل</label>
                    <select
                        value={guestId}
                        onChange={(e) => setGuestId(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="">-- اختر النزيل --</option>
                        {guests.map((guest) => (
                            <option key={guest.id} value={guest.id}>
                                {guest.fullName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>اختر الغرفة</label>
                    <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="">-- اختر الغرفة --</option>
                        {rooms
                            .filter((room) => room.status === "VACANT")
                            .map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.roomNumber} - {room.type}
                                </option>
                            ))}
                    </select>
                </div>

                <div>
                    <label>تاريخ الدخول</label>
                    <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div>
                    <label>تاريخ الخروج</label>
                    <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div>
                    <label>الحالة</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="PENDING">معلق</option>
                        <option value="CONFIRMED">مؤكد</option>
                        <option value="CHECKED_IN">مسجل دخول</option>
                        <option value="CHECKED_OUT">مسجل خروج</option>
                        <option value="CANCELLED">ملغي</option>
                    </select>
                </div>

                <div>
                    <label>حالة الدفع</label>
                    <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="UNPAID">غير مدفوع</option>
                        <option value="PAID">مدفوع</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    إضافة الحجز
                </button>
            </form>
        </div>
    );
}
