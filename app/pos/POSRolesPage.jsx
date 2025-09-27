'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddOutletModal from "@/app/components/AddOutletModal";
import EditOutletModal from "@/app/components/EditOutletModal";

export default function POSOutletsPage({ session, userProperties }) {
    const [outlets, setOutlets] = useState([]);
    const [editOutlet, setEditOutlet] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const socket = useSocket();

    // ============================================
    // Role & Permissions
    // ============================================
    const role = session?.user?.role || "Guest";

    const canAdd = ["Admin", "Manager"].includes(role);
    const canEdit = ["Admin", "Manager"].includes(role);
    const canDelete = ["Admin"].includes(role);

    // ============================================
    // Fetch Outlets
    // ============================================
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
        fetchOutlets();

        if (!socket) return;
        socket.on("POS_OUTLET_CREATED", (o) => setOutlets(prev => [...prev, o]));
        socket.on("POS_OUTLET_UPDATED", (o) => setOutlets(prev => prev.map(oo => oo.id === o.id ? o : oo)));
        socket.on("POS_OUTLET_DELETED", ({ id }) => setOutlets(prev => prev.filter(oo => oo.id !== id)));

        return () => {
            socket.off("POS_OUTLET_CREATED");
            socket.off("POS_OUTLET_UPDATED");
            socket.off("POS_OUTLET_DELETED");
        };
    }, [socket]);

    // ============================================
    // Filtered Outlets
    // ============================================
    const filteredOutlets = useMemo(() => {
        return outlets.filter(o =>
            (!statusFilter || (statusFilter === "Active" ? o.active : !o.active)) &&
            (!searchTerm || o.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [outlets, searchTerm, statusFilter]);

    // ============================================
    // Delete Outlet
    // ============================================
    const handleDelete = async (id) => {
        if (!canDelete) return alert("ليس لديك صلاحية لحذف Outlet");
        if (!confirm("هل أنت متأكد من حذف Outlet؟")) return;

        try {
            const res = await fetch("/api/pos/outlets", {
                method: "DELETE",
                body: JSON.stringify({ id }),
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) throw new Error("Operation failed");
            setOutlets(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            alert(err.message || "Operation failed");
        }
    };

    // ============================================
    // Render
    // ============================================
    return (
        <div className="flex flex-col gap-6 mb-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Total Outlets</span>
                    <span className="text-2xl font-bold">{outlets.length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Active</span>
                    <span className="text-2xl font-bold">{outlets.filter(o => o.active).length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Inactive</span>
                    <span className="text-2xl font-bold">{outlets.filter(o => !o.active).length}</span>
                </div>
            </div>

            {/* Filters & Add Button */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search outlets..."
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

                {/* زر Add Outlet يظهر فقط إذا كان canAdd true */}
                {canAdd && (
                    <div className="flex w-full md:w-auto gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto"
                        >
                            + Add Outlet
                        </button>
                    </div>
                )}
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOutlets.length > 0 ? filteredOutlets.map(o => (
                    <div key={o.id} className="p-4 rounded-2xl shadow-lg cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105 hover:shadow-xl flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-lg font-semibold">{o.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-300">{o.type}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${o.active ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                                {o.active ? "Active" : "Inactive"}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {canEdit && (
                                <button
                                    onClick={e => { e.stopPropagation(); setEditOutlet(o); }}
                                    className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    ✏️ Edit
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(o.id); }}
                                    className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
                                >
                                    🗑 Delete
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <p className="col-span-full text-center text-gray-500">لا توجد Outlets متاحة 🔍</p>
                )}
            </div>

            {/* Modals */}
            {showAddModal && canAdd && <AddOutletModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
            {editOutlet && canEdit && <EditOutletModal outlet={editOutlet} isOpen={!!editOutlet} onClose={() => setEditOutlet(null)} />}
        </div>
    );
}
