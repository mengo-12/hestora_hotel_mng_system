"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddInvoicePage() {
    const [bookings, setBookings] = useState([]);
    const [bookingId, setBookingId] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("OPEN");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchBookings() {
            const res = await fetch("/api/bookings");
            const data = await res.json();
            setBookings(data);
            setLoading(false);
        }
        fetchBookings();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!bookingId || !amount) {
            alert("يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }

        const data = {
            bookingId,
            amount: Number(amount),
            status,
        };

        const res = await fetch("/api/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/billing");
        } else {
            alert("حدث خطأ أثناء إضافة الفاتورة");
        }
    }

    if (loading) return <p>جاري التحميل...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">إضافة فاتورة جديدة</h1>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label>اختر رقم الحجز</label>
                    <select
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="">-- اختر الحجز --</option>
                        {bookings.map((booking) => (
                            <option key={booking.id} value={booking.id}>
                                {booking.id.slice(0, 8)} - {booking.guest?.fullName || "-"}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>المبلغ (ريال)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={0}
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
                        <option value="OPEN">مفتوحة</option>
                        <option value="PAID">مدفوعة</option>
                        <option value="CANCELLED">ملغاة</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    إضافة الفاتورة
                </button>
            </form>
        </div>
    );
}
