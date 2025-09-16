'use client';
import { useState, useEffect } from "react";

export default function AddCompanyModal({ isOpen, onClose, onCompanyAdded }) {
    const [selectedProperty, setSelectedProperty] = useState("");
    const [properties, setProperties] = useState([]);
    const [companyName, setCompanyName] = useState("");
    const [companyCode, setCompanyCode] = useState(""); // ← حقل جديد للكود
    const [creditLimit, setCreditLimit] = useState("");
    const [rateAgreement, setRateAgreement] = useState("");

    // --- Fetch properties from API ---
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch("/api/properties");
                const data = await res.json();
                setProperties(data || []);
            } catch (err) {
                console.error("Failed to fetch properties:", err);
            }
        };
        fetchProperties();
    }, []);

    const handleSubmit = async () => {
        if (!companyName || !selectedProperty || !companyCode) {
            alert("Please fill company name, code and select property.");
            return;
        }

        try {
            const payload = {
                name: companyName,
                code: companyCode, // ← إرسال الكود
                propertyId: selectedProperty,
                creditLimit: creditLimit ? Number(creditLimit) : null,
                rateAgreement: rateAgreement || null
            };

            const res = await fetch("/api/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create company");

            const newCompany = await res.json();
            if (onCompanyAdded) onCompanyAdded(newCompany);
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Add Company</h2>

                <div className="mb-3">
                    <label className="block mb-1">Company Name *</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Company Code *</label>
                    <input
                        type="text"
                        value={companyCode}
                        onChange={e => setCompanyCode(e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Property *</label>
                    <select
                        value={selectedProperty}
                        onChange={e => setSelectedProperty(e.target.value)}
                        className="w-full border rounded p-2"
                    >
                        <option value="">Select Property</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Credit Limit</label>
                    <input
                        type="number"
                        value={creditLimit}
                        onChange={e => setCreditLimit(e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Rate Agreement</label>
                    <input
                        type="text"
                        value={rateAgreement}
                        onChange={e => setRateAgreement(e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Add Company
                    </button>
                </div>
            </div>
        </div>
    );
}
