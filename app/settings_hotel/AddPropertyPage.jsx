'use client';
import { useState } from "react";

export default function AddPropertyPage() {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        currency: "",
        timezone: "",
        adminEmail: "",
        adminPassword: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings_hotel/property", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create hotel");

            alert(`Hotel "${data.name}" created successfully!`);
            setForm({
                name: "",
                phone: "",
                email: "",
                address: "",
                currency: "",
                timezone: "",
                adminEmail: "",
                adminPassword: ""
            });
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">🏨 Add New Hotel</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="name" placeholder="Hotel Name" value={form.name} onChange={handleChange} className="p-3 border rounded-lg" />
                <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="p-3 border rounded-lg" />
                <input name="email" placeholder="Hotel Email" value={form.email} onChange={handleChange} className="p-3 border rounded-lg" />
                <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="p-3 border rounded-lg" />
                <input name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} className="p-3 border rounded-lg" />
                <input name="timezone" placeholder="Timezone" value={form.timezone} onChange={handleChange} className="p-3 border rounded-lg" />
                <input name="adminEmail" placeholder="Admin Email" value={form.adminEmail} onChange={handleChange} className="p-3 border rounded-lg" />
                <input type="password" name="adminPassword" placeholder="Admin Password" value={form.adminPassword} onChange={handleChange} className="p-3 border rounded-lg" />
            </div>

            <button onClick={handleSubmit} disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                {loading ? "Creating..." : "Create Hotel"}
            </button>
        </div>
    );
}
