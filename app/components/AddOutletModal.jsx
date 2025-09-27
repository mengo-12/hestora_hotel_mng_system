import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddOutletModal({ isOpen, onClose }) {
    const socket = useSocket();
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch("/api/properties");
                const data = await res.json();
                if (Array.isArray(data)) setProperties(data);
            } catch (err) {
                console.error("Failed to fetch properties:", err);
            }
        };
        fetchProperties();
    }, []);

    const handleSave = async () => {
        if (!name || !type || !selectedProperty) return alert("الرجاء ملء الحقول المطلوبة");

        setLoading(true);
        try {
            const res = await fetch("/api/pos/outlets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: selectedProperty, name, type, active })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create outlet");

            // Broadcast
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "POS_OUTLET_CREATED", data })
                });
            } catch (err) { console.error(err); }

            onClose();
        } catch (err) {
            alert(err.message || "حدث خطأ أثناء الإنشاء");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">➕ Add POS Outlet</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Property *</label>
                        <select
                            value={selectedProperty}
                            onChange={e => setSelectedProperty(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-gray-600"
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Outlet Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter outlet name"
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Outlet Type *</label>
                        <input
                            type="text"
                            value={type}
                            onChange={e => setType(e.target.value)}
                            placeholder="Enter outlet type"
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={e => setActive(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-600 dark:text-gray-300">{active ? "Active" : "Inactive"}</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        {loading ? "Saving..." : "Save Outlet"}
                    </button>
                </div>
            </div>
        </div>
    );
}
