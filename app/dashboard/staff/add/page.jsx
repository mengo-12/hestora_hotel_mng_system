"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddStaffPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("RECEPTIONIST");
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!name || !email || !password) {
            alert("يرجى تعبئة جميع الحقول");
            return;
        }

        const data = { name, email, password, role };

        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/staff");
        } else {
            alert("حدث خطأ أثناء إضافة الموظف");
        }
    }

    return (
        <div>
            <h1 className="text-3xl mb-6">إضافة موظف جديد</h1>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
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
                    <label>كلمة المرور</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    إضافة الموظف
                </button>
            </form>
        </div>
    );
}
