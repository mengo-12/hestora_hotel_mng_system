'use client';

import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", role: "FrontDesk", password: "", propertyId: "" });
    const socket = useSocket();

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        const res = await fetch("/api/settings/users");
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    // Fetch properties
    const fetchProperties = async () => {
        const res = await fetch("/api/properties");
        const data = await res.json();
        setProperties(data);
    };

    useEffect(() => {
        fetchUsers();
        fetchProperties();

        if (socket) {
            const handler = () => fetchUsers();
            socket.on("USERS_UPDATED", handler);
            return () => socket.off("USERS_UPDATED", handler);
        }
    }, [socket]);

    const openAddModal = () => {
        setForm({ name: "", email: "", role: "FrontDesk", password: "", propertyId: "" });
        setEditingUser(null);
        setModalOpen(true);
    };

    const openEditModal = (user) => {
        setForm({ 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            password: "", 
            propertyId: user.propertyId 
        });
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const payload = { ...form };

        if (!editingUser && !payload.password) {
            alert("Password is required");
            return;
        }

        if (editingUser && !payload.password) delete payload.password;

        const url = editingUser ? `/api/settings/users?id=${editingUser.id}` : "/api/settings/users";
        const method = editingUser ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setModalOpen(false);
        // إعادة جلب المستخدمين ستتم تلقائيًا عبر broadcast
    };

    const handleDelete = async (id) => {
        if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
        await fetch(`/api/settings/users?id=${id}`, { method: "DELETE" });
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Users</h2>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add User
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table className="min-w-full bg-white dark:bg-gray-800 border">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                            <th className="px-4 py-2 border">Name</th>
                            <th className="px-4 py-2 border">Email</th>
                            <th className="px-4 py-2 border">Role</th>
                            <th className="px-4 py-2 border">Property</th>
                            <th className="px-4 py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b">
                                <td className="px-4 py-2">{user.name}</td>
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2">{user.role}</td>
                                <td className="px-4 py-2">{user.property?.name || "—"}</td>
                                <td className="px-4 py-2 space-x-2">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4">{editingUser ? "Edit User" : "Add User"}</h3>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="Admin">Admin</option>
                                <option value="FrontDesk">FrontDesk</option>
                                <option value="HK">HK</option>
                                <option value="Manager">Manager</option>
                            </select>

                            {/* Property Dropdown */}
                            <select
                                value={form.propertyId}
                                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="">Select Property</option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {editingUser ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
