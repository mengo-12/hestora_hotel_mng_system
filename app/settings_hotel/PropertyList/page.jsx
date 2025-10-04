'use client';
import { useEffect, useState } from "react";

export default function PropertyListPage() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        currency: "",
        timezone: "",
        code: "",
        username: "",
        adminEmail: "",
        adminPassword: ""
    });

    const fetchProperties = async () => {
        setLoading(true);
        const res = await fetch("/api/settings_hotel/property");
        const data = await res.json();
        setProperties(data);
        setLoading(false);
    };

    useEffect(() => { fetchProperties(); }, []);

    const openModal = (property = null) => {
        setEditingProperty(property);
        if (property) {
            // عرض بيانات العميل عند التعديل
            setForm({
                name: property.name || "",
                phone: property.phone || "",
                email: property.email || "",
                address: property.address || "",
                currency: property.currency || "",
                timezone: property.timezone || "",
                code: property.code || "",
                username: property.admin?.username || "",
                adminEmail: property.admin?.email || "",
                adminPassword: "" // كلمة المرور تبقى فارغة لتغييرها فقط
            });
        } else {
            setForm({
                name: "",
                phone: "",
                email: "",
                address: "",
                currency: "",
                timezone: "",
                code: "",
                username: "",
                adminEmail: "",
                adminPassword: ""
            });
        }
        setModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async () => {
        try {
            let res;
            if (editingProperty) {
                // تعديل الفندق + Admin
                res = await fetch(`/api/settings_hotel/property/${editingProperty.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                });
            } else {
                // إضافة جديد
                res = await fetch("/api/settings_hotel/property", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Operation failed");

            alert(editingProperty ? "Hotel updated!" : "Hotel created!");
            setModalOpen(false);
            fetchProperties();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (propertyId) => {
        if (!confirm("Are you sure you want to delete this hotel and its Admin?")) return;
        try {
            const res = await fetch(`/api/settings_hotel/property/${propertyId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Delete failed");
            }
            alert("Hotel deleted successfully!");
            fetchProperties();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="text-center p-6">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
            <h2 className="text-2xl font-bold mb-4">🏨 Hotels Management</h2>

            <button onClick={() => openModal()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-4">
                + Add Hotel
            </button>

            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Phone</th>
                        <th className="border p-2">Currency</th>
                        <th className="border p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {properties.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="border p-2">{p.name}</td>
                            <td className="border p-2">{p.email}</td>
                            <td className="border p-2">{p.phone}</td>
                            <td className="border p-2">{p.currency}</td>
                            <td className="border p-2 flex gap-2">
                                <button onClick={() => openModal(p)} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Edit</button>
                                <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-3xl space-y-4">
                        <h3 className="text-xl font-bold">{editingProperty ? "Edit Hotel" : "Add Hotel"}</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input name="name" placeholder="Hotel Name" value={form.name} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="email" placeholder="Hotel Email" value={form.email} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="timezone" placeholder="Timezone" value={form.timezone} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="code" placeholder="Hotel Code" value={form.code} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg" />

                            {/* بيانات العميل سواء إضافة أو تعديل */}
                            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input name="adminEmail" placeholder="Admin Email" value={form.adminEmail} onChange={handleChange} className="p-3 border rounded-lg" />
                            <input type="password" name="adminPassword" placeholder="Admin Password (leave blank to keep current)" value={form.adminPassword} onChange={handleChange} className="p-3 border rounded-lg" />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition">Cancel</button>
                            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                {editingProperty ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
