'use client';
import { useState } from "react";
import { useSocket } from "./SocketProvider";

export default function RoomModal({ room, onClose, onSaved }) {
    const [number, setNumber] = useState(room?.number || '');
    const [floor, setFloor] = useState(room?.floor || '');
    const [status, setStatus] = useState(room?.status || 'VACANT');
    const socket = useSocket();

    const saveRoom = async () => {
        const res = await fetch('/api/rooms', {
            method: room ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: room?.id, number, floor, status }),
        });
        const data = await res.json();
        if (socket) socket.emit('ROOM_UPDATED', data);
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl font-bold mb-4">{room ? 'Edit Room' : 'New Room'}</h2>
                <input className="w-full mb-2 p-2 border rounded" placeholder="Number" value={number} onChange={e => setNumber(e.target.value)} />
                <input className="w-full mb-2 p-2 border rounded" placeholder="Floor" value={floor} onChange={e => setFloor(e.target.value)} />
                <select className="w-full mb-4 p-2 border rounded" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="VACANT">VACANT</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                    <option value="DIRTY">DIRTY</option>
                    <option value="CLEAN">CLEAN</option>
                    <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={saveRoom} className="px-4 py-2 bg-blue-500 text-white rounded">{room ? 'Save' : 'Add'}</button>
                </div>
            </div>
        </div>
    );
}
