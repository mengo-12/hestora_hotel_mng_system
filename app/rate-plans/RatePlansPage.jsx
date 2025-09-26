// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import AddRatePlanModal from "@/app/components/AddRatePlanModal";
// import EditRatePlanModal from "@/app/components/EditRatePlanModal";
// import RateRulesModal from "@/app/components/RateRulesModal"; // ✅ استدعاء RateRulesModal

// export default function RatePlansPage({ session, userProperties }) {
//     const [ratePlans, setRatePlans] = useState([]);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [editRatePlan, setEditRatePlan] = useState(null);
//     const [rateRulesPlan, setRateRulesPlan] = useState(null); // ✅ الحالة لفتح RateRulesModal
//     const [searchTerm, setSearchTerm] = useState("");
//     const [selectedProperty, setSelectedProperty] = useState("");
//     const socket = useSocket();

//     const role = session?.user?.role || "Guest";
//     const canAddEdit = ["Admin", "FrontDesk"].includes(role);
//     const canDelete = role === "Admin";
//     const canView = ["Admin", "FrontDesk", "Manager"].includes(role);

//     useEffect(() => {
//         if (userProperties.length === 1) setSelectedProperty(userProperties[0].id);
//     }, [userProperties]);

//     const fetchRatePlans = async (propertyId) => {
//         if (!propertyId) return;
//         try {
//             const res = await fetch(`/api/rate-plans?propertyId=${propertyId}`);
//             const data = await res.json();
//             if (Array.isArray(data)) setRatePlans(data);
//             else setRatePlans([]);
//         } catch (err) {
//             console.error("Failed to fetch rate plans:", err);
//             setRatePlans([]);
//         }
//     };

//     useEffect(() => {
//         if (!canView || !selectedProperty) return;

//         fetchRatePlans(selectedProperty);

//         if (socket) {
//             socket.on("RATEPLAN_CREATED", (newPlan) => {
//                 if (newPlan.propertyId === selectedProperty)
//                     setRatePlans(prev => [...prev, newPlan]);
//             });
//             socket.on("RATEPLAN_UPDATED", (updatedPlan) => {
//                 if (updatedPlan.propertyId === selectedProperty)
//                     setRatePlans(prev => prev.map(r => r.id === updatedPlan.id ? updatedPlan : r));
//             });
//             socket.on("RATEPLAN_DELETED", (id) => {
//                 setRatePlans(prev => prev.filter(r => r.id !== id));
//             });
//         }

//         return () => {
//             if (socket) {
//                 socket.off("RATEPLAN_CREATED");
//                 socket.off("RATEPLAN_UPDATED");
//                 socket.off("RATEPLAN_DELETED");
//             }
//         };
//     }, [socket, canView, selectedProperty]);

//     const filteredRatePlans = ratePlans.filter(plan =>
//         plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         plan.code.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const deleteRatePlan = async (id) => {
//         if (!confirm("هل أنت متأكد من حذف خطة الأسعار؟")) return;
//         try {
//             const res = await fetch(`/api/rate-plans/${id}`, { method: "DELETE" });
//             if (res.ok) {
//                 setRatePlans(prev => prev.filter(r => r.id !== id));
//                 await fetch("http://localhost:3001/api/broadcast", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ event: "RATEPLAN_DELETED", data: id }),
//                 });
//             }
//         } catch (err) { console.error(err); }
//     };

//     return (
//         <div>
//             {/* اختيار الفندق */}
//             <div className="mb-4">
//                 <select
//                     className="border p-2 rounded w-full max-w-sm"
//                     value={selectedProperty}
//                     onChange={(e) => setSelectedProperty(e.target.value)}
//                 >
//                     <option value="">اختر الفندق</option>
//                     {userProperties.map(p => (
//                         <option key={p.id} value={p.id}>{p.name}</option>
//                     ))}
//                 </select>
//             </div>

//             {/* شريط البحث وإضافة خطة */}
//             <div className="flex justify-between mb-4 gap-2">
//                 <input
//                     type="text"
//                     placeholder="بحث..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="border p-2 rounded flex-1"
//                 />
//                 {canAddEdit && (
//                     <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowAddModal(true)}>
//                         إضافة خطة أسعار
//                     </button>
//                 )}
//             </div>

//             {/* عرض RatePlans */}
//             {filteredRatePlans.map(plan => (
//                 <div key={plan.id} className="mb-4 p-4 border rounded shadow">
//                     <div className="flex justify-between items-center mb-2">
//                         <div>
//                             <strong>{plan.name}</strong> ({plan.code}) - {plan.currency} {plan.basePrice}
//                         </div>
//                         <div className="flex gap-2">
//                             {canAddEdit && (
//                                 <>
//                                     <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => setEditRatePlan(plan)}>تعديل</button>
//                                     <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={() => setRateRulesPlan(plan)}>Rate Rules</button>
//                                 </>
//                             )}
//                             {canDelete && (
//                                 <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => deleteRatePlan(plan.id)}>حذف</button>
//                             )}
//                         </div>
//                     </div>
//                     <div>نوع الغرفة: {plan.roomType?.name || "-"}</div>
//                     <div>Meal Plan: {plan.mealPlan || "-"}</div>
//                     <div>Public: {plan.isPublic ? "Yes" : "No"}</div>
//                     {plan.parentRatePlan && <div>Derived from: {plan.parentRatePlan.name}</div>}
//                 </div>
//             ))}

//             {/* Modals */}
//             {showAddModal && (
//                 <AddRatePlanModal
//                     session={session}
//                     userProperties={userProperties}
//                     selectedPropertyId={selectedProperty}
//                     onClose={() => setShowAddModal(false)}
//                     onCreated={(newPlan) => setRatePlans(prev => [...prev, newPlan])}
//                 />
//             )}
//             {editRatePlan && (
//                 <EditRatePlanModal
//                     ratePlan={editRatePlan}
//                     session={session}
//                     userProperties={userProperties}
//                     onClose={() => setEditRatePlan(null)}
//                     onUpdated={(updatedPlan) => setRatePlans(prev => prev.map(r => r.id === updatedPlan.id ? updatedPlan : r))}
//                 />
//             )}
//             {rateRulesPlan && (
//                 <RateRulesModal
//                     ratePlan={rateRulesPlan}
//                     onClose={() => setRateRulesPlan(null)}
//                 />
//             )}
//         </div>
//     );
// }




'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddRatePlanModal from "@/app/components/AddRatePlanModal";
import EditRatePlanModal from "@/app/components/EditRatePlanModal";
import RateRulesModal from "@/app/components/RateRulesModal";

export default function RatePlansPage({ session, userProperties }) {
    const [ratePlans, setRatePlans] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editRatePlan, setEditRatePlan] = useState(null);
    const [rateRulesPlan, setRateRulesPlan] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProperty, setSelectedProperty] = useState("");
    const socket = useSocket();

    const role = session?.user?.role || "Guest";
    const canAddEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = role === "Admin";
    const canView = ["Admin", "FrontDesk", "Manager"].includes(role);

    useEffect(() => {
        if (userProperties.length === 1) setSelectedProperty(userProperties[0].id);
    }, [userProperties]);

    const fetchRatePlans = async (propertyId) => {
        if (!propertyId) return;
        try {
            const res = await fetch(`/api/rate-plans?propertyId=${propertyId}`);
            const data = await res.json();
            if (Array.isArray(data)) setRatePlans(data);
            else setRatePlans([]);
        } catch (err) { console.error(err); setRatePlans([]); }
    };

    useEffect(() => {
        if (!canView || !selectedProperty) return;

        fetchRatePlans(selectedProperty);

        if (socket) {
            socket.on("RATEPLAN_CREATED", (newPlan) => {
                if (newPlan.propertyId === selectedProperty)
                    setRatePlans(prev => [...prev, newPlan]);
            });
            socket.on("RATEPLAN_UPDATED", (updatedPlan) => {
                if (updatedPlan.propertyId === selectedProperty)
                    setRatePlans(prev => prev.map(r => r.id === updatedPlan.id ? updatedPlan : r));
            });
            socket.on("RATEPLAN_DELETED", (id) => {
                setRatePlans(prev => prev.filter(r => r.id !== id));
            });
        }

        return () => {
            if (socket) {
                socket.off("RATEPLAN_CREATED");
                socket.off("RATEPLAN_UPDATED");
                socket.off("RATEPLAN_DELETED");
            }
        };
    }, [socket, canView, selectedProperty]);

    const filteredRatePlans = ratePlans.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteRatePlan = async (id) => {
        if (!confirm("هل أنت متأكد من حذف خطة الأسعار؟")) return;
        try {
            const res = await fetch(`/api/rate-plans/${id}`, { method: "DELETE" });
            if (res.ok) setRatePlans(prev => prev.filter(r => r.id !== id));
        } catch (err) { console.error(err); }
    };

    const getStatusBadge = (plan) => {
        if (plan.parentRatePlan) return "Derived";
        return plan.isActive ? "Active" : "Inactive";
    };

    const getStatusColor = (plan) => {
        if (plan.parentRatePlan) return "bg-purple-500 text-white";
        return plan.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white";
    };

    return (
        <div className="p-6 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100 space-y-6">

            {/* Filters: Property + Search + Add Button in one row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg">
                <select
                    value={selectedProperty}
                    onChange={e => setSelectedProperty(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                    <option value="">اختر الفندق</option>
                    {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <input
                    type="text"
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                />

                {canAddEdit && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition"
                    >
                        إضافة خطة أسعار
                    </button>
                )}
            </div>

            {/* Rate Plans Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatePlans.length > 0 ? (
                    filteredRatePlans.map(plan => (
                        <div
                            key={plan.id}
                            className="p-4 rounded-2xl shadow-lg cursor-pointer dark:bg-gray-700 bg-white dark:text-white text-black transition transform hover:scale-105 hover:shadow-xl flex flex-col justify-between"
                        >
                            {/* Header: Name & Code */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Code: {plan.code}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(plan)}`}>
                                    {getStatusBadge(plan)}
                                </span>
                            </div>

                            {/* KPI / Summary */}
                            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Base Price</span>
                                    <span className="font-medium">{plan.currency} {plan.basePrice}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Room Type</span>
                                    <span className="font-medium">{plan.roomType?.name || "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Meal Plan</span>
                                    <span className="font-medium">{plan.mealPlan || "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 dark:text-gray-300 text-xs">Public</span>
                                    <span className="font-medium">{plan.isPublic ? "Yes" : "No"}</span>
                                </div>
                                {plan.parentRatePlan && (
                                    <div className="flex flex-col col-span-2">
                                        <span className="text-gray-400 dark:text-gray-300">Derived From</span>
                                        <span className="font-medium">{plan.parentRatePlan.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {canAddEdit && (
                                    <>
                                        <button onClick={() => setEditRatePlan(plan)} className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600">تعديل</button>
                                        <button onClick={() => setRateRulesPlan(plan)} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600">Rate Rules</button>
                                    </>
                                )}
                                {canDelete && (
                                    <button onClick={() => deleteRatePlan(plan.id)} className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">حذف</button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 py-10 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                        لا توجد خطط أسعار 🔍
                    </p>
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddRatePlanModal
                    session={session}
                    userProperties={userProperties}
                    selectedPropertyId={selectedProperty}
                    onClose={() => setShowAddModal(false)}
                    onCreated={(newPlan) => setRatePlans(prev => [...prev, newPlan])}
                />
            )}
            {editRatePlan && (
                <EditRatePlanModal
                    ratePlan={editRatePlan}
                    session={session}
                    userProperties={userProperties}
                    onClose={() => setEditRatePlan(null)}
                    onUpdated={(updatedPlan) => setRatePlans(prev => prev.map(r => r.id === updatedPlan.id ? updatedPlan : r))}
                />
            )}
            {rateRulesPlan && (
                <RateRulesModal
                    ratePlan={rateRulesPlan}
                    onClose={() => setRateRulesPlan(null)}
                />
            )}
        </div>
    );
}


