"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditGuestPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const guestId = params.id;

    const [fullName, setFullName] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) router.push("/login");
        else if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchGuest();
        }
    }, [session, status, router]);

    async function fetchGuest() {
        try {
            const res = await fetch(`/api/guests/${guestId}`);
            if (!res.ok) throw new Error("فشل في جلب بيانات الضيف");
            const data = await res.json();
            setFullName(data.fullName);
            setNationalId(data.nationalId || "");
            setPhone(data.phone);
            setEmail(data.email || "");
            setNotes(data.notes || "");
        } catch (error) {
            alert(error.message);
            router.push("/dashboard/guests");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/guests/${guestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, nationalId, phone, email, notes }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في تحديث بيانات الضيف");
            }

            alert("تم تحديث بيانات الضيف بنجاح");
            router.push("/dashboard/guests");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل بيانات الضيف...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md" dir="rtl">
            <h1 className="text-2xl mb-4 font-bold text-center">تعديل بيانات الضيف</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col text-right">
                    الاسم الكامل <span className="text-red-600">*</span>
                    <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    رقم الهوية
                    <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    رقم الهاتف <span className="text-red-600">*</span>
                    <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    البريد الإلكتروني
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    ملاحظات
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="border p-2 rounded"
                    />
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
