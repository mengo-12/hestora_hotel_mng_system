"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditRoomPage() {
    const router = useRouter();
    const params = useParams();
    const { roomId } = params;

    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState(1);
    const [type, setType] = useState("SINGLE");
    const [pricePerNight, setPricePerNight] = useState("");
    const [status, setStatus] = useState("VACANT");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRoom() {
            const res = await fetch(`/api/rooms/${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setRoomNumber(data.roomNumber);
                setFloor(data.floor);
                setType(data.type);
                setPricePerNight(data.pricePerNight);
                setStatus(data.status);
            } else {
                alert("الغرفة غير موجودة");
                router.push("/dashboard/rooms");
            }
            setLoading(false);
        }
        fetchRoom();
    }, [roomId]);

    async function handleUpdate(e) {
        e.preventDefault();

        const data = { roomNumber, floor: Number(floor), type, pricePerNight: Number(pricePerNight), status };

        const res = await fetch(`/api/rooms/${roomId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/rooms");
        } else {
            alert("فشل تحديث الغرفة");
        }
    }

    async function handleDelete() {
        if (!confirm("هل أنت متأكد من حذف هذه الغرفة؟")) return;

        const res = await fetch(`/api/rooms/${roomId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            router.push("/dashboard/rooms");
        } else {
            alert("فشل حذف الغرفة");
        }
    }

    if (loading) return <p>جاري تحميل بيانات الغرفة...</p>;

    return (
        <div>
            <h1 className="text-3xl mb-6">تعديل بيانات الغرفة</h1>
            <form onSubmit={handleUpdate} className="max-w-md space-y-4">
                {/* نفس حقول إضافة الغرفة مع القيم الحالية */}
                <div>
                    <label>رقم الغرفة</label>
                    <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>
                <div>
                    <label>الطابق</label>
                    <input
                        type="number"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>
                <div>
                    <label>نوع الغرفة</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="SINGLE">مفردة</option>
                        <option value="DOUBLE">مزدوجة</option>
                        <option value="SUITE">جناح</option>
                    </select>
                </div>
                <div>
                    <label>حالة الغرفة</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="VACANT">شاغرة</option>
                        <option value="OCCUPIED">مشغولة</option>
                        <option value="CLEANING">تنظيف</option>
                        <option value="OUT_OF_SERVICE">خارج الخدمة</option>
                    </select>
                </div>
                <div>
                    <label>سعر الليلة (ريال)</label>
                    <input
                        type="number"
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(e.target.value)}
                        min={0}
                        required
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
                    حذف الغرفة
                </button>
            </form>
        </div>
    );
}
