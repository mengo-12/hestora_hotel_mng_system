'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function EditCompanyModal({ isOpen, onClose, company, properties, onCompanyUpdated }) {
    const socket = useSocket();

    const [code, setCode] = useState(company?.code || "");
    const [name, setName] = useState(company?.name || "");
    const [propertyId, setPropertyId] = useState(company?.propertyId || "");
    const [creditLimit, setCreditLimit] = useState(company?.creditLimit || "");
    const [rateAgreement, setRateAgreement] = useState(company?.rateAgreement || "");

    useEffect(() => {
        if (company) {
            setCode(company.code || "");
            setName(company.name || "");
            setPropertyId(company.propertyId || "");
            setCreditLimit(company.creditLimit || "");
            setRateAgreement(company.rateAgreement || "");
        }
    }, [company]);

    const handleSubmit = async () => {
        if (!code || !name || !propertyId) {
            alert("Please fill all required fields.");
            return;
        }

        const payload = {
            code,
            name,
            propertyId,
            creditLimit: creditLimit || null,
            rateAgreement: rateAgreement || null,
        };

        try {
            const res = await fetch(`/api/companies/${company.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update company");
            }

            const updatedCompany = await res.json();
            onCompanyUpdated(updatedCompany);

            // بث عالمي فقط عبر socket
            if (socket) socket.emit("COMPANY_UPDATED", updatedCompany);

            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-lg w-[95%] max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Company</h2>

                <div className="space-y-3">
                    <div>
                        <label>Code *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label>Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label>Property *</label>
                        <select
                            value={propertyId}
                            onChange={e => setPropertyId(e.target.value)}
                            className="w-full border rounded p-2"
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Credit Limit</label>
                        <input
                            type="number"
                            value={creditLimit}
                            onChange={e => setCreditLimit(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label>Rate Agreement</label>
                        <input
                            type="text"
                            value={rateAgreement}
                            onChange={e => setRateAgreement(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
