"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvoicesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
        } else if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchInvoices();
        }
    }, [session, status, router]);

    async function fetchInvoices() {
        try {
            const res = await fetch("/api/invoices");
            if (!res.ok) throw new Error("خطأ في جلب الفواتير");
            const data = await res.json();
            setInvoices(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return <p>جاري تحميل الفواتير...</p>;
    }

    return (
        <div className="p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    إدارة الفواتير
                </h1>
                <button
                    onClick={() => router.push('/dashboard/billing/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    إضافة فاتورة
                </button>
            </div>

            {invoices.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">لا يوجد فواتير حاليا.</p>
            ) : (
                <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    الحجز
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    المبلغ
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    الحالة
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    تاريخ الإنشاء
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                        {invoice.bookingId}
                                    </td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                        {invoice.amount}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === "مدفوع"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                                    : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                                }`}
                                        >
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>


    );
}
