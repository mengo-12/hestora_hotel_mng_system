"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditBookingPage() {
    const router = useRouter();
    const { bookingId } = useParams();

    const [guestId, setGuestId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [createdById, setCreatedById] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [status, setStatus] = useState("PENDING");
    const [paymentStatus, setPaymentStatus] = useState("UNPAID");
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBooking() {
            const res = await fetch(`/api/bookings/${bookingId}`);
            if (res.ok) {
                const data = await res.json();
                setGuestId(data.guestId);
                setRoomId(data.roomId);
                setCreatedById(data.createdById || "");
                setCheckInDate(data.checkInDate.split("T")[0]);
                setCheckOutDate(data.checkOutDate.split("T")[0]);
                setStatus(data.status);
                setPaymentStatus(data.paymentStatus);
            } else {
                alert("الحجز غير موجود");
                router.push("/dashboard/bookings");
            }
        }

        async function fetchRelatedData() {
            const [guestsRes, roomsRes, usersRes] = await Promise.all([
                fetch("/api/guests"),
                fetch("/api/rooms"),
                fetch("/api/users"),
            ]);
            const guestsData = await guestsRes.json();
            const roomsData = await roomsRes.json();
            const usersData = await usersRes.json();

            setGuests(guestsData);
            setRooms(roomsData);
            setUsers(usersData);
            setLoading(false);
        }

        fetchBooking();
        fetchRelatedData();
    }, [bookingId]);

    async function handleUpdate(e) {
        e.preventDefault();

        const data = {
            guestId,
            roomId,
            createdById: createdById || null,
            checkInDate,
            checkOutDate,
            status,
            paymentStatus,
        };

        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/bookings");
        } else {
            alert("فشل تحديث الحجز");
        }
    }

    async function handleDelete() {
        if (!confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;

        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            router.push("/dashboard/bookings");
        } else {
            alert("فشل حذف الحجز");
        }
    }

    if (loading) return <p>جاري تحميل بيانات الحجز...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">تعديل بيانات الحجز</h1>
            <form onSubmit={handleUpdate} className="max-w-md space-y-4">
                <div>
                    <label>النزيل</label>
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
                    <label>الغرفة</label>
                    <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="">-- اختر الغرفة --</option>
                        {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                                {room.roomNumber} - {room.type}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>الموظف المسؤول (اختياري)</label>
                    <select
                        value={createdById}
                        onChange={(e) => setCreatedById(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="">-- لا يوجد --</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.role})
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
                    <label>حالة الحجز</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="CONFIRMED">مؤكد</option>
                        <option value="CHECKED_IN">تم الدخول</option>
                        <option value="CHECKED_OUT">تم الخروج</option>
                        <option value="CANCELLED">ملغى</option>
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
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    حفظ التعديلات
                </button>

                <button
                    type="button"
                    onClick={handleDelete}
                    className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    حذف الحجز
                </button>
            </form>
        </div>
    );
}
