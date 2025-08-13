// app/rooms/RoomForm.jsx
'use client';
import { useState } from "react";

export default function RoomForm({ initialData = null, onClose }) {
    const [roomNumber, setRoomNumber] = useState(initialData?.roomNumber || "");
    const [roomType, setRoomType] = useState(initialData?.roomType || "");
    const [status, setStatus] = useState(initialData?.status || "AVAILABLE");
    const [pricePerNight, setPricePerNight] = useState(initialData?.pricePerNight || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = { roomNumber, roomType, status, pricePerNight: Number(pricePerNight), description };

        try {
            if (initialData) {
                const res = await fetch(`/api/rooms?id=${initialData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("فشل التحديث");
            } else {
                const res = await fetch(`/api/rooms`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err?.error || "فشل الإنشاء");
                }
            }

            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4">{initialData ? "تعديل الغرفة" : "إضافة غرفة"}</h2>

            {error && <div className="mb-3 text-red-600">{error}</div>}

            <div className="grid grid-cols-1 gap-3">
                <input className="border p-2 rounded" placeholder="رقم الغرفة" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
                <input className="border p-2 rounded" placeholder="نوع الغرفة (مثال: فردية، مزدوجة، جناح)" value={roomType} onChange={e => setRoomType(e.target.value)} required />
                <input type="number" className="border p-2 rounded" placeholder="سعر الليلة" value={pricePerNight} onChange={e => setPricePerNight(e.target.value)} required />
                <select className="border p-2 rounded" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="AVAILABLE">متاحة</option>
                    <option value="OCCUPIED">مشغولة</option>
                    <option value="MAINTENANCE">تحت الصيانة</option>
                </select>
                <textarea className="border p-2 rounded" placeholder="وصف الغرفة (اختياري)" value={description} onChange={e => setDescription(e.target.value)} />

                <div className="flex justify-end gap-2 mt-3">
                    <button type="button" className="px-4 py-2 border rounded" onClick={onClose} disabled={saving}>إلغاء</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>
                        {saving ? "جارٍ الحفظ..." : "حفظ"}
                    </button>
                </div>
            </div>
        </form>
    );
}
