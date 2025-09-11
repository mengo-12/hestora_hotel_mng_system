'use client';
import { useState, useEffect } from "react";

export default function EditRatePlanModal({ ratePlan, session, userProperties, onClose, onUpdated }) {
    const [name, setName] = useState(ratePlan.name);
    const [code, setCode] = useState(ratePlan.code);
    const [basePrice, setBasePrice] = useState(ratePlan.basePrice);
    const [currency, setCurrency] = useState(ratePlan.currency);
    const [roomTypeId, setRoomTypeId] = useState(ratePlan.roomTypeId);
    const [mealPlan, setMealPlan] = useState(ratePlan.mealPlan || "Room Only");
    const [isPublic, setIsPublic] = useState(ratePlan.isPublic);
    const [parentRatePlanId, setParentRatePlanId] = useState(ratePlan.parentRatePlanId || "");
    const [loading, setLoading] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);
    const [existingRatePlans, setExistingRatePlans] = useState([]);

    useEffect(() => {
        const property = userProperties.find(p => p.id === ratePlan.propertyId);
        if (property) {
            setRoomTypes(property.roomTypes || []);
        }
        // جلب جميع RatePlans للفندق لتحديد parent
        fetch(`/api/rate-plans?propertyId=${ratePlan.propertyId}`)
            .then(res => res.json())
            .then(data => setExistingRatePlans(data.filter(rp => rp.id !== ratePlan.id) || []));
    }, [ratePlan, userProperties]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/rate-plans/${ratePlan.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, code, basePrice, currency, roomTypeId,
                    mealPlan, isPublic, parentRatePlanId: parentRatePlanId || null
                }),
            });
            const updated = await res.json();
            if (res.ok) {
                onUpdated?.(updated);
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "RATEPLAN_UPDATED", data: updated }),
                });
                onClose();
            } else alert(updated.error || "فشل تعديل خطة الأسعار");
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-blue-300 p-6 rounded shadow w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">تعديل خطة أسعار</h2>
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
                        <option value="">اختر نوع الغرفة</option>
                        {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                    <select className="border p-2 rounded" value={mealPlan} onChange={e => setMealPlan(e.target.value)}>
                        <option value="Room Only">Room Only</option>
                        <option value="BB">BB</option>
                        <option value="HB">HB</option>
                        <option value="FB">FB</option>
                        <option value="All Inclusive">All Inclusive</option>
                    </select>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                        عام (Public)
                    </label>
                    <select className="border p-2 rounded" value={parentRatePlanId} onChange={e => setParentRatePlanId(e.target.value)}>
                        <option value="">لا يوجد خطة أساسية</option>
                        {existingRatePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
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
