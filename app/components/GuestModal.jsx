'use client';
import { useState } from "react";
import { useSocket } from "./SocketProvider";

export default function GuestModal({ guest, onClose, onSaved }) {
    const [firstName, setFirstName] = useState(guest?.firstName || '');
    const [lastName, setLastName] = useState(guest?.lastName || '');
    const [phone, setPhone] = useState(guest?.phone || '');
    const [email, setEmail] = useState(guest?.email || '');
    const socket = useSocket();

    const saveGuest = async () => {
        const res = await fetch('/api/guests', {
            method: guest ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: guest?.id, firstName, lastName, phone, email }),
        });
        const data = await res.json();
        if (socket) socket.emit('GUEST_UPDATED', data);
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl font-bold mb-4">{guest ? 'Edit Guest' : 'New Guest'}</h2>
                <input className="w-full mb-2 p-2 border rounded" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <input className="w-full mb-2 p-2 border rounded" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                <input className="w-full mb-2 p-2 border rounded" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                <input className="w-full mb-4 p-2 border rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={saveGuest} className="px-4 py-2 bg-purple-500 text-white rounded">{guest ? 'Save' : 'Add'}</button>
                </div>
            </div>
        </div>
    );
}
