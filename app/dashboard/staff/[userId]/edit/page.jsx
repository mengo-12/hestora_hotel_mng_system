"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUserPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const userId = params.id;

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("RECEPTIONIST");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) router.push("/login");
        else if (session.user.role !== "ADMIN") {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchUser();
        }
    }, [session, status, router]);

    async function fetchUser() {
        try {
            const res = await fetch(`/api/users/${userId}`);
            if (!res.ok) throw new Error("فشل في جلب بيانات المستخدم");
            const data = await res.json();
            setName(data.name);
            setEmail(data.email);
            setRole(data.role);
        } catch (error) {
            alert(error.message);
            router.push("/dashboard/users");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, role }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في تحديث بيانات المستخدم");
            }

            alert("تم تحديث بيانات المستخدم بنجاح");
            router.push("/dashboard/users");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل بيانات المستخدم...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md" dir="rtl">
            <h1 className="text-2xl mb-4 font-bold text-center">تعديل بيانات المستخدم</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col text-right">
                    الاسم الكامل <span className="text-red-600">*</span>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    البريد الإلكتروني <span className="text-red-600">*</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    الدور <span className="text-red-600">*</span>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="ADMIN">مدير</option>
                        <option value="RECEPTIONIST">موظف استقبال</option>
                        <option value="ACCOUNTANT">محاسب</option>
                        <option value="HOUSEKEEPING">خدمة تنظيف</option>
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
