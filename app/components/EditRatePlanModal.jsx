'use client';
import { useState, useEffect } from "react";

export default function EditRatePlanModal({ ratePlan, session, userProperties, onClose, onUpdated }) {
    const [name, setName] = useState(ratePlan.name || "");
    const [code, setCode] = useState(ratePlan.code || "");
    const [basePrice, setBasePrice] = useState(ratePlan.basePrice || "");
    const [currency, setCurrency] = useState(ratePlan.currency || "SAR");
    const [roomTypeId, setRoomTypeId] = useState(ratePlan.roomTypeId || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(ratePlan.name || "");
        setCode(ratePlan.code || "");
        setBasePrice(ratePlan.basePrice || "");
        setCurrency(ratePlan.currency || "SAR");
        setRoomTypeId(ratePlan.roomTypeId || "");
    }, [ratePlan]);

    const handleSubmit = async () => {
        if (!name || !code || !basePrice || !roomTypeId) return alert("الرجاء تعبئة كل الحقول");

        setLoading(true);
        try {
            const res = await fetch(`/api/rate-plans/${ratePlan.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code, basePrice, currency, roomTypeId }),
            });
            const updatedPlan = await res.json();
            if (res.ok) {
                onUpdated?.(updatedPlan);
                // Broadcast
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "RATEPLAN_UPDATED", data: updatedPlan }),
                });
                onClose();
            } else {
                alert(updatedPlan.error || "فشل تعديل خطة الأسعار");
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">تعديل خطة الأسعار</h2>
                <div className="flex flex-col gap-2">
                    <input className="border p-2 rounded" placeholder="الاسم" value={name} onChange={e => setName(e.target.value)} />
                    <input className="border p-2 rounded" placeholder="الكود" value={code} onChange={e => setCode(e.target.value)} />
                    <input type="number" className="border p-2 rounded" placeholder="السعر الأساسي" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
                    <select className="border p-2 rounded" value={currency} onChange={e => setCurrency(e.target.value)}>
                        <option value="SAR">SAR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                    <select className="border p-2 rounded" value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)}>
                        {userProperties.flatMap(p => p.roomTypes || []).map(rt => (
                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>إلغاء</button>
                    <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSubmit} disabled={loading}>
                        {loading ? "جاري الحفظ..." : "حفظ"}
                    </button>
                </div>
            </div>
        </div>
    );
}
