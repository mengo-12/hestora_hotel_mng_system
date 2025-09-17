'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function EditRoomBlockModal({ isOpen, onClose, roomBlock, properties, groups, roomTypes, onRoomBlockUpdated }) {
    const socket = useSocket();

    const [propertyId, setPropertyId] = useState("");
    const [groupId, setGroupId] = useState("");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [blockDate, setBlockDate] = useState("");
    const [roomsBlocked, setRoomsBlocked] = useState("");
    const [roomsPicked, setRoomsPicked] = useState(0);

    useEffect(() => {
        if (roomBlock) {
            setPropertyId(roomBlock.propertyId || "");
            setGroupId(roomBlock.groupId || "");
            setRoomTypeId(roomBlock.roomTypeId || "");
            setBlockDate(roomBlock.blockDate ? roomBlock.blockDate.split("T")[0] : "");
            setRoomsBlocked(roomBlock.roomsBlocked || "");
            setRoomsPicked(roomBlock.roomsPicked || 0);
        }
    }, [roomBlock]);

    const handleSubmit = async () => {
        if (!roomBlock) return;

        try {
            const payload = { propertyId, groupId, roomTypeId, blockDate, roomsBlocked: Number(roomsBlocked), roomsPicked: Number(roomsPicked) };

            const res = await fetch(`/api/room-blocks/${roomBlock.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to update room block");

            const updatedBlock = await res.json();
            if (onRoomBlockUpdated) onRoomBlockUpdated(updatedBlock);

            if (socket) socket.emit("ROOMBLOCK_UPDATED", updatedBlock);

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
                <h2 className="text-xl font-bold mb-4">Edit Room Block</h2>

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
                    <button onClick={handleSubmit} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
}
