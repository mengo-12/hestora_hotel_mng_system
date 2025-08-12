"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditBookingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const bookingId = params.id;

    const [guestId, setGuestId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [statusBooking, setStatusBooking] = useState("PENDING");
    const [paymentStatus, setPaymentStatus] = useState("UNPAID");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) router.push("/login");
        else if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchBooking();
            fetchGuests();
            fetchRooms();
        }
    }, [session, status, router]);

    async function fetchBooking() {
        try {
            const res = await fetch(`/api/bookings/${bookingId}`);
            if (!res.ok) throw new Error("فشل في جلب بيانات الحجز");
            const data = await res.json();
            setGuestId(data.guestId);
            setRoomId(data.roomId);
            setCheckInDate(data.checkInDate.slice(0, 10));
            setCheckOutDate(data.checkOutDate.slice(0, 10));
            setStatusBooking(data.status);
            setPaymentStatus(data.paymentStatus);
        } catch (error) {
            alert(error.message);
            router.push("/dashboard/bookings");
        } finally {
            setLoading(false);
        }
    }

    async function fetchGuests() {
        try {
            const res = await fetch("/api/guests");
            if (!res.ok) throw new Error("فشل في جلب النزلاء");
            const data = await res.json();
            setGuests(data);
        } catch (error) {
            alert(error.message);
        }
    }

    async function fetchRooms() {
        try {
            const res = await fetch("/api/rooms");
            if (!res.ok) throw new Error("فشل في جلب الغرف");
            const data = await res.json();
            setRooms(data);
        } catch (error) {
            alert(error.message);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guestId,
                    roomId,
                    checkInDate,
                    checkOutDate,
                    status: statusBooking,
                    paymentStatus,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في تحديث بيانات الحجز");
            }

            alert("تم تحديث بيانات الحجز بنجاح");
            router.push("/dashboard/bookings");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل بيانات الحجز...</p>;
    }

    return (
        <div className="max-w-lg mx-auto p-6 border rounded mt-6 shadow-md" dir="rtl">
            <h1 className="text-2xl mb-4 font-bold text-center">تعديل بيانات الحجز</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col text-right">
                    اختر الضيف <span className="text-red-600">*</span>
                    <select
                        required
                        value={guestId}
                        onChange={(e) => setGuestId(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="">اختر ضيف</option>
                        {guests.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.fullName} - {g.phone}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col text-right">
                    اختر الغرفة <span className="text-red-600">*</span>
                    <select
                        required
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="">اختر غرفة</option>
                        {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.roomNumber} - {r.type}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col text-right">
                    تاريخ الدخول <span className="text-red-600">*</span>
                    <input
                        type="date"
                        required
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    تاريخ الخروج <span className="text-red-600">*</span>
                    <input
                        type="date"
                        required
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    حالة الحجز <span className="text-red-600">*</span>
                    <select
                        value={statusBooking}
                        onChange={(e) => setStatusBooking(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="CONFIRMED">مؤكد</option>
                        <option value="CHECKED_IN">تم الدخول</option>
                        <option value="CHECKED_OUT">تم الخروج</option>
                        <option value="CANCELLED">ملغى</option>
                    </select>
                </label>

                <label className="flex flex-col text-right">
                    حالة الدفع <span className="text-red-600">*</span>
                    <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="UNPAID">غير مدفوع</option>
                        <option value="PAID">مدفوع</option>
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
            </form>
        </div>
    );
}
