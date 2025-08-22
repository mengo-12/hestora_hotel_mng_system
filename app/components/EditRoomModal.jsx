'use client';
import { useState, useEffect } from "react";

export default function EditRoomModal({ room, isOpen, onClose, onSaved, properties = [], roomTypes = [], userId }) {
    const [number, setNumber] = useState(room?.number || "");
    const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId || "");
    const [status, setStatus] = useState(room?.status || "VACANT");
    const [floor, setFloor] = useState(room?.floor || "");
    const [notes, setNotes] = useState(room?.notes || "");

    useEffect(() => {
        setNumber(room?.number || "");
        setRoomTypeId(room?.roomTypeId || "");
        setStatus(room?.status || "VACANT");
        setFloor(room?.floor || "");
        setNotes(room?.notes || "");
    }, [room]);

    const handleSave = async () => {
        const res = await fetch(`/api/rooms/${room.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                number,
                roomTypeId,
                status,
                floor: floor ? parseInt(floor) : null,
                notes,
                changedById: userId,
            }),
        });

        if (res.ok) {
            const updatedRoom = await res.json();
            onSaved(updatedRoom);
            onClose();
        } else {
            alert("Error updating room");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Edit Room {room.number}</h2>

                <div className="flex flex-col gap-3">
                    <label className="flex flex-col text-sm">
                        Number
                        <input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                        />
                    </label>

                    <label className="flex flex-col text-sm">
                        Room Type
                        <select
                            value={roomTypeId}
                            onChange={(e) => setRoomTypeId(e.target.value)}
                            className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                        >
                            {roomTypes.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col text-sm">
                        Status
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                        >
                            <option value="VACANT">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                    </label>

                    <label className="flex flex-col text-sm">
                        Floor
                        <input
                            type="number"
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                        />
                    </label>

                    <label className="flex flex-col text-sm">
                        Notes
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
                        />
                    </label>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
