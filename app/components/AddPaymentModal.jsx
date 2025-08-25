'use client';
import { useState } from "react";

export default function AddPaymentModal({ folio, isOpen, onClose }) {
    const [method, setMethod] = useState("");
    const [amount, setAmount] = useState("");
    const [ref, setRef] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!method || !amount) return alert("Method and amount are required");

        setLoading(true);
        try {
            const res = await fetch(`/api/folios/${folio.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method,
                    amount: parseFloat(amount),
                    ref: ref || null,
                    postedById: folio.guestId // مؤقتًا
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to add payment");

            // البث العالمي سيتم من الـ API
            onClose();
            setMethod(""); setAmount(""); setRef("");
        } catch (err) {
            console.error(err);
            alert(err.message || "Error adding payment");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-96">
                <h2 className="text-xl font-bold mb-4">Add Payment</h2>
                <input
                    className="w-full mb-2 p-2 border rounded"
                    placeholder="Method"
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                />
                <input
                    type="number"
                    className="w-full mb-2 p-2 border rounded"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
                <input
                    className="w-full mb-4 p-2 border rounded"
                    placeholder="Reference (optional)"
                    value={ref}
                    onChange={e => setRef(e.target.value)}
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
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={loading}
                    >
                        {loading ? "Adding..." : "Add Payment"}
                    </button>
                </div>
            </div>
        </div>
    );
}
