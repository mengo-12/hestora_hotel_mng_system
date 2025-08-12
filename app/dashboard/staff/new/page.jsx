"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AddUserPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("RECEPTIONIST");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) router.push("/login");
        else if (session.user.role !== "ADMIN") {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        }
    }, [session, status, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            if (!name || !email || !password) {
                alert("يرجى ملء الحقول المطلوبة");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في إضافة المستخدم");
            }

            alert("تمت إضافة المستخدم بنجاح");
            router.push("/dashboard/users");
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
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md bg-white dark:bg-gray-800" dir="rtl">
            <h1 className="text-2xl mb-6 font-bold text-center text-gray-900 dark:text-white">إضافة مستخدم جديد</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    الاسم الكامل <span className="text-red-600">*</span>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </label>

                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    البريد الإلكتروني <span className="text-red-600">*</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </label>

                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    كلمة المرور <span className="text-red-600">*</span>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </label>

                <label className="flex flex-col text-right text-gray-800 dark:text-gray-200">
                    الدور <span className="text-red-600">*</span>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">اختر الدور</option>
                        <option value="ADMIN">مدير</option>
                        <option value="RECEPTIONIST">استقبال</option>
                        <option value="ACCOUNTANT">محاسب</option>
                        <option value="HOUSEKEEPING">خدمات</option>
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
            </form>
        </div>

    );
}
