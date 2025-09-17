'use client';
import { useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddRoomBlockModal({ isOpen, onClose, properties, groups, roomTypes, onRoomBlockAdded }) {
    const socket = useSocket();

    const [propertyId, setPropertyId] = useState("");
    const [groupId, setGroupId] = useState("");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [blockDate, setBlockDate] = useState("");
    const [roomsBlocked, setRoomsBlocked] = useState("");
    const [roomsPicked, setRoomsPicked] = useState(0);

    const handleSubmit = async () => {
        if (!propertyId || !groupId || !roomTypeId || !blockDate || !roomsBlocked) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const payload = { propertyId, groupId, roomTypeId, blockDate, roomsBlocked: Number(roomsBlocked), roomsPicked: Number(roomsPicked) };

            const res = await fetch("/api/room-blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create room block");

            const newBlock = await res.json();

            if (onRoomBlockAdded) onRoomBlockAdded(newBlock);

            if (socket) socket.emit("ROOMBLOCK_CREATED", newBlock);

            // Reset form
            setPropertyId(""); setGroupId(""); setRoomTypeId(""); setBlockDate(""); setRoomsBlocked(""); setRoomsPicked(0);

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
                <h2 className="text-xl font-bold mb-4">Add Room Block</h2>

                <div className="mb-3">
                    <label className="block mb-1">Property *</label>
                    <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Group *</label>
                    <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Group</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Room Type *</label>
                    <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Room Type</option>
                        {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Block Date *</label>
                    <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Rooms Blocked *</label>
                    <input type="number" value={roomsBlocked} onChange={e => setRoomsBlocked(e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Rooms Picked</label>
                    <input type="number" value={roomsPicked} onChange={e => setRoomsPicked(e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Block</button>
                </div>
            </div>
        </div>
    );
}
