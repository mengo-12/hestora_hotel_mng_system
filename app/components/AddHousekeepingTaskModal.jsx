'use client';
import { useState } from "react";

export default function AddHousekeepingTaskModal({ isOpen, onClose, onSave, room }) {
    const [type, setType] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [assignedTo, setAssignedTo] = useState("");
    const [notes, setNotes] = useState("");

    if (!isOpen) return null;

    const handleSave = () => {
        if (!type.trim()) return alert("Task type is required");

        onSave({
            type: type.trim(),
            priority,
            assignedTo: assignedTo.trim() || null,
            notes: notes.trim() || null
        });

        // إعادة تهيئة الحقول بعد الحفظ
        setType("");
        setPriority("Medium");
        setAssignedTo("");
        setNotes("");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Add Task for Room {room.number}</h2>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder="Task type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-3 py-2 border rounded"
                    />
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Assigned to (optional)"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="px-3 py-2 border rounded"
                    />
                    <textarea
                        placeholder="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="px-3 py-2 border rounded"
                    />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded border"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-1 rounded bg-blue-500 text-white"
                    >
                        Add Task
                    </button>
                </div>
            </div>
        </div>
    );
}
