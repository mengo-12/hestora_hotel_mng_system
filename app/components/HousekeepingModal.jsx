'use client';
import { useState, useEffect } from "react";
import { useSocket } from "./SocketProvider";

export default function HousekeepingModal({ task, onClose, onSaved }) {
    const [roomId, setRoomId] = useState(task?.roomId || '');
    const [type, setType] = useState(task?.type || 'Clean');
    const [status, setStatus] = useState(task?.status || 'Open');
    const [assignedToId, setAssignedToId] = useState(task?.assignedToId || '');
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        fetch("/api/rooms").then(r => r.json()).then(setRooms);
        fetch("/api/users").then(r => r.json()).then(setUsers);
    }, []);

    const saveTask = async () => {
        const res = await fetch('/api/housekeeping', {
            method: task ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: task?.id, roomId, type, status, assignedToId }),
        });
        const data = await res.json();
        if (socket) socket.emit('HK_TASK_UPDATED', data);
        onSaved(data);
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl font-bold mb-4">{task ? 'Edit Task' : 'New Task'}</h2>
                <select className="w-full mb-2 p-2 border rounded" value={roomId} onChange={e => setRoomId(e.target.value)}>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.number}</option>)}
                </select>
                <select className="w-full mb-2 p-2 border rounded" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Clean">Clean</option>
                    <option value="Inspect">Inspect</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
                <select className="w-full mb-2 p-2 border rounded" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Done">Done</option>
                </select>
                <select className="w-full mb-4 p-2 border rounded" value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                    <option value="">Assign to</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={saveTask} className="px-4 py-2 bg-blue-500 text-white rounded">{task ? 'Save' : 'Add'}</button>
                </div>
            </div>
        </div>
    );
}
