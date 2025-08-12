"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AddInvoicePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [bookingId, setBookingId] = useState("");
    const [amount, setAmount] = useState("");
    const [statusInvoice, setStatusInvoice] = useState("OPEN");
    const [loading, setLoading] = useState(false);

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) router.push("/login");
        else if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchBookings();
        }
    }, [session, status, router]);

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
        setLoading(true);

        try {
            if (!bookingId || !amount) {
                alert("يرجى ملء الحقول المطلوبة");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    amount: parseFloat(amount),
                    status: statusInvoice,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في إضافة الفاتورة");
            }

            alert("تمت إضافة الفاتورة بنجاح");
            router.push("/dashboard/invoices");
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading") {
        return <p className="text-center mt-10">جاري التحقق من الصلاحيات...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md bg-white dark:bg-gray-900" dir="rtl">
            <h1 className="text-2xl mb-6 font-bold text-center text-gray-900 dark:text-white">إضافة فاتورة جديدة</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                <label className="flex flex-col text-right text-gray-900 dark:text-gray-200">
                    اختر الحجز <span className="text-red-600">*</span>
                    <select
                        required
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        className="border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-800"
                    >
                        <option value="">اختر حجز</option>
                        {bookings.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.id} - {b.checkInDate.slice(0, 10)} إلى {b.checkOutDate.slice(0, 10)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col text-right text-gray-900 dark:text-gray-200">
                    المبلغ <span className="text-red-600">*</span>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </label>

                <label className="flex flex-col text-right text-gray-900 dark:text-gray-200">
                    حالة الفاتورة <span className="text-red-600">*</span>
                    <select
                        value={statusInvoice}
                        onChange={(e) => setStatusInvoice(e.target.value)}
                        className="border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-800"
                    >
                        <option value="OPEN">مفتوحة</option>
                        <option value="PAID">مدفوعة</option>
                        <option value="CANCELLED">ملغاة</option>
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
            </form>
        </div>

    );
}
