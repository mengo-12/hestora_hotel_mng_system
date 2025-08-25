'use client';
import { useState } from "react";

export default function AddChargeModal({ folio, isOpen, onClose }) {
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!code || !description || !amount) return alert("All fields are required");

        setLoading(true);
        try {
            const res = await fetch(`/api/folios/${folio.id}/charges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    description,
                    amount: parseFloat(amount),
                    postedById: folio.guestId // مؤقتاً نفترض نفس الضيف
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to add charge");

            // البث العالمي سيتم من الـ API
            onClose();
            setCode(""); setDescription(""); setAmount("");
        } catch (err) {
            console.error(err);
            alert(err.message || "Error adding charge");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-96">
                <h2 className="text-xl font-bold mb-4">Add Charge</h2>
                <input
                    className="w-full mb-2 p-2 border rounded"
                    placeholder="Code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                />
                <input
                    className="w-full mb-2 p-2 border rounded"
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <input
                    type="number"
                    className="w-full mb-4 p-2 border rounded"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Adding..." : "Add Charge"}
                    </button>
                </div>
            </div>
        </div>
    );
}
