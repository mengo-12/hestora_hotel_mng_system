"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddGuestPage() {
    const [fullName, setFullName] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!fullName || !phone) {
            alert("يرجى تعبئة الاسم ورقم الهاتف");
            return;
        }

        const data = { fullName, nationalId, phone, email, notes };

        const res = await fetch("/api/guests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/guests");
        } else {
            alert("حدث خطأ أثناء إضافة النزيل");
        }
    }

    return (
        <div>
            <h1 className="text-3xl mb-6">إضافة نزيل جديد</h1>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label>الاسم الكامل</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>
                <div>
                    <label>رقم الهوية الوطنية</label>
                    <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>
                <div>
                    <label>رقم الهاتف</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
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
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>
                <div>
                    <label>ملاحظات</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    إضافة النزيل
                </button>
            </form>
        </div>
    );
}
