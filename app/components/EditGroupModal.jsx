'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function EditGroupModal({ isOpen, onClose, group, properties, companies, guests, onGroupUpdated }) {
    const socket = useSocket();

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [leaderId, setLeaderId] = useState("");

    useEffect(() => {
        if (group) {
            setName(group.name || "");
            setCode(group.code || "");
            setDescription(group.description || "");
            setPropertyId(group.propertyId || "");
            setCompanyId(group.companyId || "");
            setLeaderId(group.leaderId || "");
        }
    }, [group]);

    const handleSubmit = async () => {
        if (!group) return;

        try {
            const payload = { name, code, description, propertyId, companyId, leaderId };
            const res = await fetch(`/api/groups/${group.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to update group");

            const updatedGroup = await res.json();
            if (onGroupUpdated) onGroupUpdated(updatedGroup);
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
                <h2 className="text-xl font-bold mb-4">Edit Group</h2>

                <div className="mb-3">
                    <label className="block mb-1">Group Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Group Code *</label>
                    <input
                        type="text"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full border rounded p-2"
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
                    />
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
