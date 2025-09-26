// 'use client';
// import { useState, useEffect } from "react";

// export default function RateRulesModal({ ratePlan, onClose, onUpdated }) {
//     const [rules, setRules] = useState([]);
//     const [editingRule, setEditingRule] = useState(null);

//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [priceOverride, setPriceOverride] = useState("");
//     const [minLOS, setMinLOS] = useState("");
//     const [maxLOS, setMaxLOS] = useState("");
//     const [minOccupancy, setMinOccupancy] = useState("");
//     const [maxOccupancy, setMaxOccupancy] = useState("");
//     const [closedToArrival, setClosedToArrival] = useState(false);
//     const [closedToDeparture, setClosedToDeparture] = useState(false);
//     const [policy, setPolicy] = useState("");
//     const [mealPlan, setMealPlan] = useState(ratePlan.mealPlan || "Room Only");
//     const [isPublic, setIsPublic] = useState(true);
//     const [loading, setLoading] = useState(false);

//     // --- جلب RateRules
//     const fetchRules = async () => {
//         try {
//             const res = await fetch(`/api/rate-rules?ratePlanId=${ratePlan.id}`);
//             const data = await res.json();
//             if (Array.isArray(data)) setRules(data);
//         } catch (err) { console.error(err); }
//     };

//     useEffect(() => { fetchRules(); }, [ratePlan]);

//     const handleSubmit = async () => {
//         if (!startDate || !endDate) return alert("حدد تاريخ البداية والنهاية");
//         setLoading(true);
//         try {
//             const payload = { ratePlanId: ratePlan.id, startDate, endDate, priceOverride, minLOS, maxLOS, minOccupancy, maxOccupancy, closedToArrival, closedToDeparture, policy, mealPlan, isPublic };
//             const url = editingRule ? `/api/rate-rules/${editingRule.id}` : `/api/rate-rules`;
//             const method = editingRule ? "PATCH" : "POST";
//             const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
//             const updated = await res.json();
//             if (res.ok) {
//                 fetchRules();
//                 setEditingRule(null);
//                 setStartDate(""); setEndDate(""); setPriceOverride(""); setMinLOS(""); setMaxLOS(""); setMinOccupancy(""); setMaxOccupancy(""); setClosedToArrival(false); setClosedToDeparture(false); setPolicy(""); setMealPlan(ratePlan.mealPlan || "Room Only"); setIsPublic(true);
//             } else alert(updated.error || "فشل حفظ القاعدة");
//         } catch (err) { console.error(err); }
//         setLoading(false);
//     };

//     const deleteRule = async (id) => {
//         if (!confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;
//         try {
//             const res = await fetch(`/api/rate-rules/${id}`, { method: "DELETE" });
//             if (res.ok) fetchRules();
//         } catch (err) { console.error(err); }
//     };

//     const editRule = (r) => {
//         setEditingRule(r);
//         setStartDate(new Date(r.startDate).toISOString().slice(0,10));
//         setEndDate(r.endDate ? new Date(r.endDate).toISOString().slice(0,10) : "");
//         setPriceOverride(r.priceOverride || "");
//         setMinLOS(r.minLOS || "");
//         setMaxLOS(r.maxLOS || "");
//         setMinOccupancy(r.minOccupancy || "");
//         setMaxOccupancy(r.maxOccupancy || "");
//         setClosedToArrival(r.closedToArrival);
//         setClosedToDeparture(r.closedToDeparture);
//         setPolicy(r.policy || "");
//         setMealPlan(r.mealPlan || ratePlan.mealPlan || "Room Only");
//         setIsPublic(r.isPublic ?? true);
//     };

//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 overflow-auto">
//             <div className="bg-white p-6 rounded shadow w-full max-w-2xl">
//                 <h2 className="text-lg font-bold mb-4">Rate Rules - {ratePlan.name}</h2>

//                 {/* Form */}
//                 <div className="grid grid-cols-2 gap-2 mb-4">
//                     <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border p-2 rounded" />
//                     <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border p-2 rounded" />
//                     <input type="number" placeholder="Price Override" value={priceOverride} onChange={e => setPriceOverride(e.target.value)} className="border p-2 rounded" />
//                     <input type="number" placeholder="Min LOS" value={minLOS} onChange={e => setMinLOS(e.target.value)} className="border p-2 rounded" />
//                     <input type="number" placeholder="Max LOS" value={maxLOS} onChange={e => setMaxLOS(e.target.value)} className="border p-2 rounded" />
//                     <input type="number" placeholder="Min Occupancy" value={minOccupancy} onChange={e => setMinOccupancy(e.target.value)} className="border p-2 rounded" />
//                     <input type="number" placeholder="Max Occupancy" value={maxOccupancy} onChange={e => setMaxOccupancy(e.target.value)} className="border p-2 rounded" />
//                     <label className="flex items-center gap-2"><input type="checkbox" checked={closedToArrival} onChange={e => setClosedToArrival(e.target.checked)} /> Closed to Arrival</label>
//                     <label className="flex items-center gap-2"><input type="checkbox" checked={closedToDeparture} onChange={e => setClosedToDeparture(e.target.checked)} /> Closed to Departure</label>
//                     <input placeholder="Policy" value={policy} onChange={e => setPolicy(e.target.value)} className="border p-2 rounded col-span-2" />
//                     <select value={mealPlan} onChange={e => setMealPlan(e.target.value)} className="border p-2 rounded col-span-2">
//                         <option value="Room Only">Room Only</option>
//                         <option value="BB">BB</option>
//                         <option value="HB">HB</option>
//                         <option value="FB">FB</option>
//                         <option value="All Inclusive">All Inclusive</option>
//                     </select>
//                     <label className="flex items-center gap-2 col-span-2">
//                         <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
//                         Public
//                     </label>
//                 </div>
//                 <div className="flex gap-2 mb-4">
//                     <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>إغلاق</button>
//                     <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit} disabled={loading}>
//                         {editingRule ? "تحديث القاعدة" : "إضافة القاعدة"}
//                     </button>
//                 </div>

//                 {/* Rules List */}
//                 <div className="space-y-2">
//                     {rules.map(r => (
//                         <div key={r.id} className="border p-2 rounded flex justify-between items-center">
//                             <div>
//                                 {new Date(r.startDate).toLocaleDateString()} - {r.endDate ? new Date(r.endDate).toLocaleDateString() : "-"}
//                                 , Price: {r.priceOverride ?? "-"}, LOS: {r.minLOS ?? "-"}-{r.maxLOS ?? "-"}
//                                 , Occupancy: {r.minOccupancy ?? "-"}-{r.maxOccupancy ?? "-"}
//                                 , Meal: {r.mealPlan ?? "-"}, Public: {r.isPublic ? "Yes" : "No"}
//                             </div>
//                             <div className="flex gap-1">
//                                 <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => editRule(r)}>تعديل</button>
//                                 <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteRule(r.id)}>حذف</button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }





'use client';
import { useState, useEffect } from "react";

export default function RateRulesModal({ ratePlan, onClose, onUpdated }) {
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [priceOverride, setPriceOverride] = useState("");
    const [minLOS, setMinLOS] = useState("");
    const [maxLOS, setMaxLOS] = useState("");
    const [minOccupancy, setMinOccupancy] = useState("");
    const [maxOccupancy, setMaxOccupancy] = useState("");
    const [closedToArrival, setClosedToArrival] = useState(false);
    const [closedToDeparture, setClosedToDeparture] = useState(false);
    const [policy, setPolicy] = useState("");
    const [mealPlan, setMealPlan] = useState(ratePlan.mealPlan || "Room Only");
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);

    const fetchRules = async () => {
        try {
            const res = await fetch(`/api/rate-rules?ratePlanId=${ratePlan.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setRules(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchRules(); }, [ratePlan]);

    const handleSubmit = async () => {
        if (!startDate || !endDate) return alert("حدد تاريخ البداية والنهاية");
        setLoading(true);
        try {
            const payload = { ratePlanId: ratePlan.id, startDate, endDate, priceOverride, minLOS, maxLOS, minOccupancy, maxOccupancy, closedToArrival, closedToDeparture, policy, mealPlan, isPublic };
            const url = editingRule ? `/api/rate-rules/${editingRule.id}` : `/api/rate-rules`;
            const method = editingRule ? "PATCH" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const updated = await res.json();
            if (res.ok) {
                fetchRules();
                setEditingRule(null);
                setStartDate(""); setEndDate(""); setPriceOverride(""); setMinLOS(""); setMaxLOS(""); setMinOccupancy(""); setMaxOccupancy(""); setClosedToArrival(false); setClosedToDeparture(false); setPolicy(""); setMealPlan(ratePlan.mealPlan || "Room Only"); setIsPublic(true);
                onUpdated?.();
            } else alert(updated.error || "فشل حفظ القاعدة");
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const deleteRule = async (id) => {
        if (!confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;
        try {
            const res = await fetch(`/api/rate-rules/${id}`, { method: "DELETE" });
            if (res.ok) fetchRules();
        } catch (err) { console.error(err); }
    };

    const editRule = (r) => {
        setEditingRule(r);
        setStartDate(new Date(r.startDate).toISOString().slice(0,10));
        setEndDate(r.endDate ? new Date(r.endDate).toISOString().slice(0,10) : "");
        setPriceOverride(r.priceOverride || "");
        setMinLOS(r.minLOS || "");
        setMaxLOS(r.maxLOS || "");
        setMinOccupancy(r.minOccupancy || "");
        setMaxOccupancy(r.maxOccupancy || "");
        setClosedToArrival(r.closedToArrival);
        setClosedToDeparture(r.closedToDeparture);
        setPolicy(r.policy || "");
        setMealPlan(r.mealPlan || ratePlan.mealPlan || "Room Only");
        setIsPublic(r.isPublic ?? true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-[900px] max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">📋 Rate Rules - {ratePlan.name}</h2>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Start Date *</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">End Date *</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Price Override</label>
                            <input type="number" value={priceOverride} onChange={e => setPriceOverride(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Min LOS</label>
                            <input type="number" value={minLOS} onChange={e => setMinLOS(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Max LOS</label>
                            <input type="number" value={maxLOS} onChange={e => setMaxLOS(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Min Occupancy</label>
                            <input type="number" value={minOccupancy} onChange={e => setMinOccupancy(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Max Occupancy</label>
                            <input type="number" value={maxOccupancy} onChange={e => setMaxOccupancy(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={closedToArrival} onChange={e => setClosedToArrival(e.target.checked)} className="accent-blue-600" />
                            Closed to Arrival
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={closedToDeparture} onChange={e => setClosedToDeparture(e.target.checked)} className="accent-blue-600" />
                            Closed to Departure
                        </label>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Policy</label>
                            <input type="text" value={policy} onChange={e => setPolicy(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Meal Plan</label>
                            <select value={mealPlan} onChange={e => setMealPlan(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                <option value="Room Only">Room Only</option>
                                <option value="BB">BB</option>
                                <option value="HB">HB</option>
                                <option value="FB">FB</option>
                                <option value="All Inclusive">All Inclusive</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-blue-600" />
                            Public
                        </label>
                    </div>
                </div>

                {/* Rules Table */}
                <div className="mt-6 overflow-y-auto max-h-[300px]">
                    <table className="w-full border rounded-lg text-sm overflow-hidden">
                        <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="p-2">Start</th>
                                <th className="p-2">End</th>
                                <th className="p-2">Price</th>
                                <th className="p-2">LOS</th>
                                <th className="p-2">Occupancy</th>
                                <th className="p-2">Meal</th>
                                <th className="p-2">Public</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map(r => (
                                <tr key={r.id} className="border-t dark:border-gray-600">
                                    <td className="p-2">{new Date(r.startDate).toLocaleDateString()}</td>
                                    <td className="p-2">{r.endDate ? new Date(r.endDate).toLocaleDateString() : "-"}</td>
                                    <td className="p-2">{r.priceOverride ?? "-"}</td>
                                    <td className="p-2">{r.minLOS ?? "-"}-{r.maxLOS ?? "-"}</td>
                                    <td className="p-2">{r.minOccupancy ?? "-"}-{r.maxOccupancy ?? "-"}</td>
                                    <td className="p-2">{r.mealPlan ?? "-"}</td>
                                    <td className="p-2">{r.isPublic ? "Yes" : "No"}</td>
                                    <td className="p-2 flex justify-center gap-2">
                                        <button onClick={() => editRule(r)} className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Edit</button>
                                        <button onClick={() => deleteRule(r.id)} className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingRule ? "Update Rule" : "Add Rule"}
                    </button>
                </div>
            </div>
        </div>
    );
}

