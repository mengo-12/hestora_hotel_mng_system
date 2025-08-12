"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GuestsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const guestsPerPage = 10;

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
        } else if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchGuests();
        }
    }, [session, status, router]);

    async function fetchGuests() {
        try {
            const res = await fetch("/api/guests");
            if (!res.ok) throw new Error("خطأ في جلب النزلاء");
            const data = await res.json();
            setGuests(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    // Pagination calculations
    const indexOfLastGuest = currentPage * guestsPerPage;
    const indexOfFirstGuest = indexOfLastGuest - guestsPerPage;
    const currentGuests = guests.slice(indexOfFirstGuest, indexOfLastGuest);
    const totalPages = Math.ceil(guests.length / guestsPerPage);

    function goToPage(pageNumber) {
        setCurrentPage(pageNumber);
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل النزلاء...</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                إدارة النزلاء
            </h1>

            <button
                onClick={() => router.push("/dashboard/guests/new")}
                className="mb-4 bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
                + إضافة ضيف جديد
            </button>

            {guests.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">لا يوجد نزلاء حاليا.</p>
            ) : (
                <>
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-800">
                                <tr className="text-right">
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        الاسم الكامل
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        رقم الهوية
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        الهاتف
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        البريد الإلكتروني
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        ملاحظات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {currentGuests.map((guest) => (
                                    <tr
                                        key={guest.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/dashboard/guests/${guest.id}`)}
                                    >
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                            {guest.fullName}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                            {guest.nationalId || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                            {guest.phone}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                            {guest.email || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-200">
                                            {guest.notes || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-1 rounded-lg border transition-colors ${currentPage === page
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>

    );
}
