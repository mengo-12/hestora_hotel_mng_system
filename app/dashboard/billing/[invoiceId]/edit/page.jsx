"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditInvoicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id;

    const [bookingId, setBookingId] = useState("");
    const [amount, setAmount] = useState("");
    const [statusInvoice, setStatusInvoice] = useState("OPEN");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) router.push("/login");
        else if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchInvoice();
            fetchBookings();
        }
    }, [session, status, router]);

    async function fetchInvoice() {
        try {
            const res = await fetch(`/api/invoices/${invoiceId}`);
            if (!res.ok) throw new Error("فشل في جلب بيانات الفاتورة");
            const data = await res.json();
            setBookingId(data.bookingId);
            setAmount(data.amount);
            setStatusInvoice(data.status);
        } catch (error) {
            alert(error.message);
            router.push("/dashboard/invoices");
        } finally {
            setLoading(false);
        }
    }

    async function fetchBookings() {
        try {
            const res = await fetch("/api/bookings");
            if (!res.ok) throw new Error("فشل في جلب الحجوزات");
            const data = await res.json();
            setBookings(data);
        } catch (error) {
            alert(error.message);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    amount: Number(amount),
                    status: statusInvoice,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في تحديث بيانات الفاتورة");
            }

            alert("تم تحديث بيانات الفاتورة بنجاح");
            router.push("/dashboard/invoices");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل بيانات الفاتورة...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md" dir="rtl">
            <h1 className="text-2xl mb-4 font-bold text-center">تعديل بيانات الفاتورة</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col text-right">
                    اختر الحجز <span className="text-red-600">*</span>
                    <select
                        required
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="">اختر حجز</option>
                        {bookings.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.guest.fullName} - {b.room.roomNumber}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col text-right">
                    المبلغ <span className="text-red-600">*</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    الحالة <span className="text-red-600">*</span>
                    <select
                        value={statusInvoice}
                        onChange={(e) => setStatusInvoice(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="OPEN">مفتوحة</option>
                        <option value="PAID">مدفوعة</option>
                        <option value="CANCELLED">ملغاة</option>
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
