"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditGuestPage() {
    const router = useRouter();
    const { guestId } = useParams();

    const [fullName, setFullName] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGuest() {
            const res = await fetch(`/api/guests/${guestId}`);
            if (res.ok) {
                const data = await res.json();
                setFullName(data.fullName);
                setNationalId(data.nationalId || "");
                setPhone(data.phone);
                setEmail(data.email || "");
                setNotes(data.notes || "");
            } else {
                alert("النزيل غير موجود");
                router.push("/dashboard/guests");
            }
            setLoading(false);
        }
        fetchGuest();
    }, [guestId]);

    async function handleUpdate(e) {
        e.preventDefault();

        const data = { fullName, nationalId, phone, email, notes };

        const res = await fetch(`/api/guests/${guestId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/guests");
        } else {
            alert("فشل تحديث بيانات النزيل");
        }
    }

    async function handleDelete() {
        if (!confirm("هل أنت متأكد من حذف هذا النزيل؟")) return;

        const res = await fetch(`/api/guests/${guestId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            router.push("/dashboard/guests");
        } else {
            alert("فشل حذف النزيل");
        }
    }

    if (loading) return <p>جاري تحميل بيانات النزيل...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">تعديل بيانات النزيل</h1>
            <form onSubmit={handleUpdate} className="max-w-md space-y-4">
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
                    />
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
                    حذف النزيل
                </button>
            </form>
        </div>
    );
}
