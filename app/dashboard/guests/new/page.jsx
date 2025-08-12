"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AddGuestPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) router.push("/login");
        else if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        }
    }, [session, status, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/guests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, nationalId, phone, email, notes }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في إضافة الضيف");
            }

            alert("تمت إضافة الضيف بنجاح");
            router.push("/dashboard/guests");
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
        <div className="max-w-md mx-auto p-6 border border-gray-200 dark:border-gray-700 rounded-lg mt-6 shadow-lg bg-white dark:bg-gray-900">
            <h1 className="text-2xl mb-6 font-bold text-center text-gray-900 dark:text-white">
                إضافة ضيف جديد
            </h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* الاسم الكامل */}
                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    الاسم الكامل <span className="text-red-500">*</span>
                    <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        dir="rtl"
                    />
                </label>

                {/* رقم الهوية */}
                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    رقم الهوية
                    <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        dir="rtl"
                    />
                </label>

                {/* رقم الهاتف */}
                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    رقم الهاتف <span className="text-red-500">*</span>
                    <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        dir="rtl"
                    />
                </label>

                {/* البريد الإلكتروني */}
                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    البريد الإلكتروني
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        dir="rtl"
                    />
                </label>

                {/* الملاحظات */}
                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    ملاحظات
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        dir="rtl"
                    />
                </label>

                {/* زر الإضافة */}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-200"
                >
                    {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
            </form>
        </div>

    );
}
