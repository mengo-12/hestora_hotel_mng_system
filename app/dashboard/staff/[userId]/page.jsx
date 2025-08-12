"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditUserPage() {
    const router = useRouter();
    const { userId } = useParams();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("RECEPTIONIST");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`/api/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setName(data.name);
                setEmail(data.email);
                setRole(data.role);
            } else {
                alert("الموظف غير موجود");
                router.push("/dashboard/staff");
            }
            setLoading(false);
        }
        fetchUser();
    }, [userId]);

    async function handleUpdate(e) {
        e.preventDefault();

        const data = { name, email, role };

        const res = await fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/staff");
        } else {
            alert("فشل تحديث بيانات الموظف");
        }
    }

    async function handleDelete() {
        if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;

        const res = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            router.push("/dashboard/staff");
        } else {
            alert("فشل حذف الموظف");
        }
    }

    if (loading) return <p>جاري تحميل بيانات الموظف...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">تعديل بيانات الموظف</h1>
            <form onSubmit={handleUpdate} className="max-w-md space-y-4">
                <div>
                    <label>الاسم</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div>
                    <label>البريد الإلكتروني</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div>
                    <label>الدور</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="ADMIN">مشرف</option>
                        <option value="RECEPTIONIST">استقبال</option>
                        <option value="ACCOUNTANT">محاسب</option>
                        <option value="HOUSEKEEPING">تنظيف</option>
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
                    حذف الموظف
                </button>
            </form>
        </div>
    );
}
