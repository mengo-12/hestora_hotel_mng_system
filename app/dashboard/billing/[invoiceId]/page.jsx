"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditInvoicePage() {
    const router = useRouter();
    const { invoiceId } = useParams();

    const [bookingId, setBookingId] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("OPEN");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvoice() {
            const res = await fetch(`/api/invoices/${invoiceId}`);
            if (res.ok) {
                const data = await res.json();
                setBookingId(data.bookingId);
                setAmount(data.amount);
                setStatus(data.status);
            } else {
                alert("الفاتورة غير موجودة");
                router.push("/dashboard/billing");
            }
        }

        async function fetchBookings() {
            const res = await fetch("/api/bookings");
            const data = await res.json();
            setBookings(data);
            setLoading(false);
        }

        fetchInvoice();
        fetchBookings();
    }, [invoiceId]);

    async function handleUpdate(e) {
        e.preventDefault();

        const data = {
            bookingId,
            amount: Number(amount),
            status,
        };

        const res = await fetch(`/api/invoices/${invoiceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/billing");
        } else {
            alert("فشل تحديث الفاتورة");
        }
    }

    async function handleDelete() {
        if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;

        const res = await fetch(`/api/invoices/${invoiceId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            router.push("/dashboard/billing");
        } else {
            alert("فشل حذف الفاتورة");
        }
    }

    if (loading) return <p>جاري تحميل بيانات الفاتورة...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">تعديل بيانات الفاتورة</h1>
            <form onSubmit={handleUpdate} className="max-w-md space-y-4">
                <div>
                    <label>رقم الحجز</label>
                    <select
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="">-- اختر الحجز --</option>
                        {bookings.map((booking) => (
                            <option key={booking.id} value={booking.id}>
                                {booking.id.slice(0, 8)}
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
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    حفظ التعديلات
                </button>

                <button
                    type="button"
                    onClick={handleDelete}
                    className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    حذف الفاتورة
                </button>
            </form>
        </div>
    );
}
