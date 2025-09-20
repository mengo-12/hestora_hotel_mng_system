'use client';
import { useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddGroupModal({ isOpen, onClose, properties, companies, guests, roomBlocks, onGroupAdded }) {
    const socket = useSocket();

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [leaderId, setLeaderId] = useState("");
    const [selectedRoomBlockIds, setSelectedRoomBlockIds] = useState([]);

    const handleSubmit = async () => {
        if (!name || !code || !propertyId) {
            alert("Please fill in group name, code, and select property.");
            return;
        }

        try {
            const payload = { name, code, description, propertyId, companyId, leaderId, roomBlockIds: selectedRoomBlockIds };

            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create group");

            const newGroup = await res.json();

            if (onGroupAdded) onGroupAdded(newGroup);

            if (socket) socket.emit("GROUP_CREATED", newGroup);

            setName(""); setCode(""); setDescription(""); setPropertyId(""); setCompanyId(""); setLeaderId(""); setSelectedRoomBlockIds([]);
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
                <h2 className="text-xl font-bold mb-4">Add Group</h2>

                <div className="mb-3">
                    <label className="block mb-1">Group Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Enter group name"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Group Code *</label>
                    <input
                        type="text"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Enter group code"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Property *</label>
                    <select
                        value={propertyId}
                        onChange={e => setPropertyId(e.target.value)}
                        className="w-full border rounded p-2"
                    >
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Company (Optional)</label>
                    <select
                        value={companyId}
                        onChange={e => setCompanyId(e.target.value)}
                        className="w-full border rounded p-2"
                    >
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Leader (Optional)</label>
                    <select
                        value={leaderId}
                        onChange={e => setLeaderId(e.target.value)}
                        className="w-full border rounded p-2"
                    >
                        <option value="">Select Leader</option>
                        {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Enter description"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Room Blocks (Optional)</label>
                    <select
                        multiple
                        value={selectedRoomBlockIds}
                        onChange={e => {
                            const options = Array.from(e.target.selectedOptions).map(o => o.value);
                            setSelectedRoomBlockIds(options);
                        }}
                        className="w-full border rounded p-2 h-32"
                    >
                        {roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
                    </select>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Group</button>
                </div>
            </div>
        </div>
    );
}
