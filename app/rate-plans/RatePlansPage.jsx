'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddRatePlanModal from "@/app/components/AddRatePlanModal";
import EditRatePlanModal from "@/app/components/EditRatePlanModal";
import RateRulesModal from "@/app/components/RateRulesModal"; // ✅ استدعاء RateRulesModal

export default function RatePlansPage({ session, userProperties }) {
    const [ratePlans, setRatePlans] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editRatePlan, setEditRatePlan] = useState(null);
    const [rateRulesPlan, setRateRulesPlan] = useState(null); // ✅ الحالة لفتح RateRulesModal
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
        } catch (err) {
            console.error("Failed to fetch rate plans:", err);
            setRatePlans([]);
        }
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
            if (res.ok) {
                setRatePlans(prev => prev.filter(r => r.id !== id));
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "RATEPLAN_DELETED", data: id }),
                });
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            {/* اختيار الفندق */}
            <div className="mb-4">
                <select
                    className="border p-2 rounded w-full max-w-sm"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                >
                    <option value="">اختر الفندق</option>
                    {userProperties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* شريط البحث وإضافة خطة */}
            <div className="flex justify-between mb-4 gap-2">
                <input
                    type="text"
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border p-2 rounded flex-1"
                />
                {canAddEdit && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowAddModal(true)}>
                        إضافة خطة أسعار
                    </button>
                )}
            </div>

            {/* عرض RatePlans */}
            {filteredRatePlans.map(plan => (
                <div key={plan.id} className="mb-4 p-4 border rounded shadow">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <strong>{plan.name}</strong> ({plan.code}) - {plan.currency} {plan.basePrice}
                        </div>
                        <div className="flex gap-2">
                            {canAddEdit && (
                                <>
                                    <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => setEditRatePlan(plan)}>تعديل</button>
                                    <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={() => setRateRulesPlan(plan)}>Rate Rules</button>
                                </>
                            )}
                            {canDelete && (
                                <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => deleteRatePlan(plan.id)}>حذف</button>
                            )}
                        </div>
                    </div>
                    <div>نوع الغرفة: {plan.roomType?.name || "-"}</div>
                    <div>Meal Plan: {plan.mealPlan || "-"}</div>
                    <div>Public: {plan.isPublic ? "Yes" : "No"}</div>
                    {plan.parentRatePlan && <div>Derived from: {plan.parentRatePlan.name}</div>}
                </div>
            ))}

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
