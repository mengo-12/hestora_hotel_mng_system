'use client';
import { useState } from "react";
import { useSocket } from "./SocketProvider";

export default function FolioModal({ folio, onClose, onSaved }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const socket = useSocket();

    const addCharge = async () => {
        const res = await fetch(`/api/folios/${folio.id}/charge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount), description }),
        });
        const data = await res.json();
        if (socket) socket.emit('FOLIO_UPDATED', data);
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl font-bold mb-4">Add Charge</h2>
                <input type="number" className="w-full mb-2 p-2 border rounded" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                <input className="w-full mb-4 p-2 border rounded" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={addCharge} className="px-4 py-2 bg-yellow-500 text-white rounded">Add</button>
                </div>
            </div>
        </div>
    );
}
