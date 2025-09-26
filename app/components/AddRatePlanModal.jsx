// 'use client';
// import { useState, useEffect } from "react";

// export default function AddRatePlanModal({ session, userProperties, selectedPropertyId, onClose, onCreated }) {
//     const [name, setName] = useState("");
//     const [code, setCode] = useState("");
//     const [basePrice, setBasePrice] = useState("");
//     const [currency, setCurrency] = useState("SAR");
//     const [roomTypeId, setRoomTypeId] = useState("");
//     const [mealPlan, setMealPlan] = useState("Room Only");
//     const [isPublic, setIsPublic] = useState(true);
//     const [parentRatePlanId, setParentRatePlanId] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [roomTypes, setRoomTypes] = useState([]);
//     const [existingRatePlans, setExistingRatePlans] = useState([]);

//     useEffect(() => {
//         if (!selectedPropertyId) return;
//         const property = userProperties.find(p => p.id === selectedPropertyId);
//         if (property) {
//             const rTypes = property.roomTypes || [];
//             setRoomTypes(rTypes);
//             if (rTypes.length > 0) setRoomTypeId(rTypes[0].id);
//         }
//         // جلب RatePlans الحالية للفندق لاختيار Parent
//         fetch(`/api/rate-plans?propertyId=${selectedPropertyId}`)
//             .then(res => res.json())
//             .then(data => setExistingRatePlans(data || []));
//     }, [selectedPropertyId, userProperties]);

//     const handleSubmit = async () => {
//         if (!name || !code || !basePrice || !roomTypeId) return alert("الرجاء تعبئة كل الحقول");

//         setLoading(true);
//         try {
//             const res = await fetch("/api/rate-plans", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     name, code, basePrice, currency, roomTypeId,
//                     propertyId: selectedPropertyId,
//                     mealPlan, isPublic, parentRatePlanId: parentRatePlanId || null
//                 }),
//             });
//             const newPlan = await res.json();
//             if (res.ok) {
//                 onCreated?.(newPlan);
//                 await fetch("http://localhost:3001/api/broadcast", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ event: "RATEPLAN_CREATED", data: newPlan }),
//                 });
//                 onClose();
//             } else alert(newPlan.error || "فشل إنشاء خطة الأسعار");
//         } catch (err) { console.error(err); }
//         setLoading(false);
//     };

//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
//             <div className="bg-blue-300 p-6 rounded shadow w-full max-w-md">
//                 <h2 className="text-lg font-bold mb-4">إضافة خطة أسعار</h2>
//                 <div className="flex flex-col gap-2">
//                     <input className="border p-2 rounded" placeholder="الاسم" value={name} onChange={e => setName(e.target.value)} />
//                     <input className="border p-2 rounded" placeholder="الكود" value={code} onChange={e => setCode(e.target.value)} />
//                     <input type="number" className="border p-2 rounded" placeholder="السعر الأساسي" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
//                     <select className="border p-2 rounded" value={currency} onChange={e => setCurrency(e.target.value)}>
//                         <option value="SAR">SAR</option>
//                         <option value="USD">USD</option>
//                         <option value="EUR">EUR</option>
//                     </select>
//                     <select className="border p-2 rounded" value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)}>
//                         <option value="">اختر نوع الغرفة</option>
//                         {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
//                     </select>
//                     <select className="border p-2 rounded" value={mealPlan} onChange={e => setMealPlan(e.target.value)}>
//                         <option value="Room Only">Room Only</option>
//                         <option value="BB">BB</option>
//                         <option value="HB">HB</option>
//                         <option value="FB">FB</option>
//                         <option value="All Inclusive">All Inclusive</option>
//                     </select>
//                     <label className="flex items-center gap-2">
//                         <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
//                         عام (Public)
//                     </label>
//                     <select className="border p-2 rounded" value={parentRatePlanId} onChange={e => setParentRatePlanId(e.target.value)}>
//                         <option value="">لا يوجد خطة أساسية</option>
//                         {existingRatePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
//                     </select>
//                 </div>
//                 <div className="flex justify-end gap-2 mt-4">
//                     <button className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>إلغاء</button>
//                     <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSubmit} disabled={loading}>
//                         {loading ? "جاري الحفظ..." : "حفظ"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }




'use client';
import { useState, useEffect } from "react";

export default function AddRatePlanModal({ session, userProperties, selectedPropertyId, onClose, onCreated }) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [currency, setCurrency] = useState("SAR");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [mealPlan, setMealPlan] = useState("Room Only");
    const [isPublic, setIsPublic] = useState(true);
    const [parentRatePlanId, setParentRatePlanId] = useState("");
    const [loading, setLoading] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);
    const [existingRatePlans, setExistingRatePlans] = useState([]);

    useEffect(() => {
        if (!selectedPropertyId) return;
        const property = userProperties.find(p => p.id === selectedPropertyId);
        if (property) {
            const rTypes = property.roomTypes || [];
            setRoomTypes(rTypes);
            if (rTypes.length > 0) setRoomTypeId(rTypes[0].id);
        }
        // جلب RatePlans الحالية للفندق لاختيار Parent
        fetch(`/api/rate-plans?propertyId=${selectedPropertyId}`)
            .then(res => res.json())
            .then(data => setExistingRatePlans(data || []));
    }, [selectedPropertyId, userProperties]);

    const handleSubmit = async () => {
        if (!name || !code || !basePrice || !roomTypeId) return alert("الرجاء تعبئة كل الحقول");

        setLoading(true);
        try {
            const res = await fetch("/api/rate-plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, code, basePrice, currency, roomTypeId,
                    propertyId: selectedPropertyId,
                    mealPlan, isPublic, parentRatePlanId: parentRatePlanId || null
                }),
            });
            const newPlan = await res.json();
            if (res.ok) {
                onCreated?.(newPlan);
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "RATEPLAN_CREATED", data: newPlan }),
                });
                onClose();
            } else alert(newPlan.error || "فشل إنشاء خطة الأسعار");
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-[800px] max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">➕ إضافة خطة أسعار</h2>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">الاسم *</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                placeholder="اسم خطة الأسعار"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">الكود *</label>
                            <input
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                placeholder="كود الخطة"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">السعر الأساسي *</label>
                            <input
                                type="number"
                                value={basePrice}
                                onChange={e => setBasePrice(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">العملة</label>
                            <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="SAR">SAR</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">نوع الغرفة *</label>
                            <select
                                value={roomTypeId}
                                onChange={e => setRoomTypeId(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="">اختر نوع الغرفة</option>
                                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Meal Plan</label>
                            <select
                                value={mealPlan}
                                onChange={e => setMealPlan(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="Room Only">Room Only</option>
                                <option value="BB">BB</option>
                                <option value="HB">HB</option>
                                <option value="FB">FB</option>
                                <option value="All Inclusive">All Inclusive</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-blue-600" />
                            <label className="text-gray-700 dark:text-gray-200">عام (Public)</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">الخطة الأساسية</label>
                            <select
                                value={parentRatePlanId}
                                onChange={e => setParentRatePlanId(e.target.value)}
                                className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="">لا يوجد خطة أساسية</option>
                                {existingRatePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">إلغاء</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {loading ? "جاري الحفظ..." : "حفظ"}
                    </button>
                </div>
            </div>
        </div>
    );
}
