'use client';
import { useState } from "react";

export default function AddCompanyModal({ isOpen, onClose, properties, onSaved }) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
    const [creditLimit, setCreditLimit] = useState("");
    const [rateAgreement, setRateAgreement] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !code.trim()) {
            alert("Name and Code are required");
            return;
        }

        setLoading(true);

        try {
            // 🔹 Create company
            const res = await fetch("/api/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code, propertyId, creditLimit, rateAgreement }),
            });

            const newCompany = await res.json();
            if (!res.ok) throw new Error(newCompany.error || "Failed to create company");

            // 🔹 Broadcast عالمي
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "COMPANY_CREATED", data: newCompany }),
                });
            } catch (err) {
                console.error("Socket broadcast failed:", err);
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">Add Company</h2>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Company Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                        type="text"
                        placeholder="Code"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <select
                        value={propertyId}
                        onChange={e => setPropertyId(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    >
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                        type="number"
                        placeholder="Credit Limit"
                        value={creditLimit}
                        onChange={e => setCreditLimit(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                        type="text"
                        placeholder="Rate Agreement"
                        value={rateAgreement}
                        onChange={e => setRateAgreement(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
