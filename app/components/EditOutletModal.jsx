'use client';
import { useState, useEffect } from "react";

export default function EditOutletModal({ outlet, isOpen, onClose }) {
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (outlet) {
            setName(outlet.name || "");
            setType(outlet.type || "");
            setActive(outlet.active ?? true);
        }
    }, [outlet]);

    const handleUpdate = async () => {
        if (!name || !type) return alert("الرجاء ملء الحقول المطلوبة");

        setLoading(true);
        try {
            const res = await fetch(`/api/pos/outlets`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: outlet.id, name, type, active }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to update outlet");
            }

            const data = await res.json();
            onClose(data); // ممكن تمرر الـ updatedOutlet للصفحة الأم
        } catch (err) {
            alert(err.message || "حدث خطأ أثناء التحديث");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-[450px]">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    ✏️ Edit POS Outlet
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                            Outlet Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                            Outlet Type *
                        </label>
                        <input
                            type="text"
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={e => setActive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-600 dark:text-gray-300">Active</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update"}
                    </button>
                </div>
            </div>
        </div>
    );
}
