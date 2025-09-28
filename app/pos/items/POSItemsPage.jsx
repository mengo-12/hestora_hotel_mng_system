'use client';
import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useSocket } from "@/app/components/SocketProvider";

export default function POSItemsPage({ session, userProperties }) {
    const [items, setItems] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedOutlet, setSelectedOutlet] = useState("All"); // فلتر حسب الـ Outlet
    const [filteredItemsList, setFilteredItemsList] = useState([]);
    const [kpis, setKpis] = useState({ active: 0, inactive: 0, total: 0 });
    const socket = useSocket();

    // Permissions
    const role = session?.user?.role || "Guest";
    const canAdd = ["Admin", "Manager"].includes(role);
    const canEdit = ["Admin", "Manager"].includes(role);
    const canDelete = ["Admin"].includes(role);

    // Fetch items & outlets
    const fetchItems = async () => {
        try {
            const res = await fetch("/api/pos/items");
            const data = await res.json();
            const filtered = Array.isArray(data) ? data : [];
            setItems(filtered);

            // Calculate KPIs
            const active = filtered.filter(i => i.active).length;
            const inactive = filtered.filter(i => !i.active).length;
            setKpis({ active, inactive, total: filtered.length });
        } catch {
            setItems([]);
            setKpis({ active: 0, inactive: 0, total: 0 });
        }
    };

    const fetchOutlets = async () => {
        try {
            const res = await fetch("/api/pos/outlets");
            const data = await res.json();
            setOutlets(Array.isArray(data) ? data : []);
        } catch {
            setOutlets([]);
        }
    };

    useEffect(() => {
        fetchItems();
        fetchOutlets();

        if (!socket) return;
        socket.on("POS_ITEM_CREATED", (i) => setItems(prev => [...prev, i]));
        socket.on("POS_ITEM_UPDATED", (i) => setItems(prev => prev.map(ii => ii.id === i.id ? i : ii)));
        socket.on("POS_ITEM_DELETED", ({ id }) => setItems(prev => prev.filter(ii => ii.id !== id)));

        return () => {
            socket.off("POS_ITEM_CREATED");
            socket.off("POS_ITEM_UPDATED");
            socket.off("POS_ITEM_DELETED");
        };
    }, [socket]);

    // Delete
    const handleDelete = async (id) => {
        if (!canDelete) return alert("You do not have permission to delete this item");
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch("/api/pos/items", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error("Failed to delete item");
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            alert(err.message || "Error deleting item");
        }
    };

    // Filter items
    const filteredItems = filteredItemsList.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "" || (statusFilter === "Active" && item.active) || (statusFilter === "Inactive" && !item.active);
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        if (selectedOutlet === "All") {
            setFilteredItemsList(items);
        } else {
            setFilteredItemsList(items.filter(i => i.outletId === selectedOutlet));
        }
    }, [selectedOutlet, items]);

    // ==============================
    // ItemModal Component
    // ==============================
    function ItemModal({ onClose, onSaved, editItem, outlets }) {
        const [form, setForm] = useState({
            code: editItem?.code || "",
            name: editItem?.name || "",
            description: editItem?.description || "",
            price: editItem?.price || 0,
            tax: editItem?.tax || 0,
            outletId: editItem?.outletId || (outlets[0]?.id || ""),
            active: editItem?.active ?? true,
        });
        const [loading, setLoading] = useState(false);
        const [errors, setErrors] = useState({}); // ✅ تتبع الأخطاء

        const handleSave = async () => {
            const newErrors = {};

            // Validation
            if (!form.code.trim()) newErrors.code = "Code is required";
            if (!form.name.trim()) newErrors.name = "Name is required";
            if (!form.outletId) newErrors.outletId = "Outlet is required";
            if (form.price === "" || form.price < 0) newErrors.price = "Price must be ≥ 0";

            setErrors(newErrors);

            if (Object.keys(newErrors).length > 0) return; // هناك أخطاء → توقف عن الحفظ

            setLoading(true);
            try {
                const method = editItem ? "PUT" : "POST";
                const res = await fetch("/api/pos/items", {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editItem ? { id: editItem.id, ...form } : form),
                });
                if (!res.ok) throw new Error("Failed to save item");
                await onSaved();
                onClose();
            } catch (err) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        };

        const inputClass = (field) =>
            `w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
            }`;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                        {editItem ? "✏️ Edit Item" : "➕ Add Item"}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Code *</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder="Enter code"
                                className={inputClass("code")}
                            />
                            {errors.code && <span className="text-red-500 text-xs">{errors.code}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Enter name"
                                className={inputClass("name")}
                            />
                            {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Enter description"
                                className={inputClass("description") + " resize-none h-24"}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Price *</label>
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                    placeholder="Enter price"
                                    className={inputClass("price")}
                                />
                                {errors.price && <span className="text-red-500 text-xs">{errors.price}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Tax %</label>
                                <input
                                    type="number"
                                    value={form.tax}
                                    onChange={e => setForm({ ...form, tax: parseFloat(e.target.value) })}
                                    placeholder="Enter tax"
                                    className={inputClass("tax")}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Outlet *</label>
                            <select
                                value={form.outletId}
                                onChange={e => setForm({ ...form, outletId: e.target.value })}
                                className={inputClass("outletId")}
                            >
                                <option value="">Select Outlet</option>
                                {outlets.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                            {errors.outletId && <span className="text-red-500 text-xs">{errors.outletId}</span>}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={e => setForm({ ...form, active: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-gray-600 dark:text-gray-300">{form.active ? "Active" : "Inactive"}</span>
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
                            {loading ? "Saving..." : (editItem ? "Update Item" : "Save Item")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Active</span>
                    <span className="text-2xl font-bold">{kpis.active}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Inactive</span>
                    <span className="text-2xl font-bold">{kpis.inactive}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Total Items</span>
                    <span className="text-2xl font-bold">{kpis.total}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Status</label>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Outlet</label>
                    <select
                        value={selectedOutlet}
                        onChange={e => setSelectedOutlet(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="All">All</option>
                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    {canAdd && (
                        <button
                            onClick={() => { setEditItem(null); setModalOpen(true); }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto"
                        >
                            + Add Item
                        </button>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-2xl">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left">Code</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-left">Price</th>
                            <th className="px-4 py-2 text-left">Outlet</th>
                            <th className="px-4 py-2 text-left">Active</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-2">{item.code}</td>
                                <td className="px-4 py-2">{item.name}</td>
                                <td className="px-4 py-2">{item.description}</td>
                                <td className="px-4 py-2">{item.price} SAR</td>
                                <td className="px-4 py-2">{item.outlet?.name}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${item.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                        {item.active ? "Yes" : "No"}
                                    </span>
                                </td>
                                <td className="px-4 py-2 flex gap-2 justify-center">
                                    {canEdit && (
                                        <button
                                            onClick={() => { setEditItem(item); setModalOpen(true); }}
                                            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center py-6 text-gray-500">
                                    No items found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <ItemModal
                    onClose={() => setModalOpen(false)}
                    onSaved={fetchItems}
                    editItem={editItem}
                    outlets={outlets}
                />
            )}
        </div>
    );
}
