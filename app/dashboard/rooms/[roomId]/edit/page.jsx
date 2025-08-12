"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = params.id;

    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState(1);
    const [type, setType] = useState("SINGLE");
    const [statusRoom, setStatusRoom] = useState("VACANT");
    const [pricePerNight, setPricePerNight] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) router.push("/login");
        else if (!["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchRoom();
        }
    }, [session, status, router]);

    async function fetchRoom() {
        try {
            const res = await fetch(`/api/rooms/${roomId}`);
            if (!res.ok) throw new Error("فشل في جلب بيانات الغرفة");
            const data = await res.json();
            setRoomNumber(data.roomNumber);
            setFloor(data.floor);
            setType(data.type);
            setStatusRoom(data.status);
            setPricePerNight(data.pricePerNight);
        } catch (error) {
            alert(error.message);
            router.push("/dashboard/rooms");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomNumber,
                    floor: Number(floor),
                    type,
                    status: statusRoom,
                    pricePerNight: Number(pricePerNight),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في تحديث بيانات الغرفة");
            }

            alert("تم تحديث بيانات الغرفة بنجاح");
            router.push("/dashboard/rooms");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل بيانات الغرفة...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md" dir="rtl">
            <h1 className="text-2xl mb-4 font-bold text-center">تعديل بيانات الغرفة</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col text-right">
                    رقم الغرفة <span className="text-red-600">*</span>
                    <input
                        type="text"
                        required
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    الطابق <span className="text-red-600">*</span>
                    <input
                        type="number"
                        min={1}
                        required
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="border p-2 rounded"
                    />
                </label>

                <label className="flex flex-col text-right">
                    النوع <span className="text-red-600">*</span>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="SINGLE">فردية</option>
                        <option value="DOUBLE">ثنائية</option>
                        <option value="SUITE">جناح</option>
                    </select>
                </label>

                <label className="flex flex-col text-right">
                    الحالة <span className="text-red-600">*</span>
                    <select
                        value={statusRoom}
                        onChange={(e) => setStatusRoom(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="VACANT">فارغة</option>
                        <option value="OCCUPIED">مشغولة</option>
                        <option value="CLEANING">تنظيف</option>
                        <option value="OUT_OF_SERVICE">خارج الخدمة</option>
                    </select>
                </label>

                <label className="flex flex-col text-right">
                    السعر لكل ليلة <span className="text-red-600">*</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(e.target.value)}
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
