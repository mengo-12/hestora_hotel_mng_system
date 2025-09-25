// 'use client';
// import { useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function AddGroupModal({ isOpen, onClose, properties, companies, guests, roomBlocks, onGroupAdded }) {
//     const socket = useSocket();

//     const [name, setName] = useState("");
//     const [code, setCode] = useState("");
//     const [description, setDescription] = useState("");
//     const [propertyId, setPropertyId] = useState("");
//     const [companyId, setCompanyId] = useState("");
//     const [leaderId, setLeaderId] = useState("");
//     const [selectedRoomBlockIds, setSelectedRoomBlockIds] = useState([]);

//     const handleSubmit = async () => {
//         if (!name || !code || !propertyId) {
//             alert("Please fill in group name, code, and select property.");
//             return;
//         }

//         try {
//             const payload = { name, code, description, propertyId, companyId, leaderId, roomBlockIds: selectedRoomBlockIds };

//             const res = await fetch("/api/groups", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload)
//             });

//             if (!res.ok) throw new Error("Failed to create group");

//             const newGroup = await res.json();

//             if (onGroupAdded) onGroupAdded(newGroup);

//             if (socket) socket.emit("GROUP_CREATED", newGroup);

//             setName(""); setCode(""); setDescription(""); setPropertyId(""); setCompanyId(""); setLeaderId(""); setSelectedRoomBlockIds([]);
//             onClose();

//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Add Group</h2>

//                 <div className="mb-3">
//                     <label className="block mb-1">Group Name *</label>
//                     <input
//                         type="text"
//                         value={name}
//                         onChange={e => setName(e.target.value)}
//                         className="w-full border rounded p-2"
//                         placeholder="Enter group name"
//                     />
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Group Code *</label>
//                     <input
//                         type="text"
//                         value={code}
//                         onChange={e => setCode(e.target.value)}
//                         className="w-full border rounded p-2"
//                         placeholder="Enter group code"
//                     />
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Property *</label>
//                     <select
//                         value={propertyId}
//                         onChange={e => setPropertyId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Property</option>
//                         {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Company (Optional)</label>
//                     <select
//                         value={companyId}
//                         onChange={e => setCompanyId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Company</option>
//                         {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                     </select>
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Leader (Optional)</label>
//                     <select
//                         value={leaderId}
//                         onChange={e => setLeaderId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Leader</option>
//                         {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
//                     </select>
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Description</label>
//                     <textarea
//                         value={description}
//                         onChange={e => setDescription(e.target.value)}
//                         className="w-full border rounded p-2"
//                         placeholder="Enter description"
//                     />
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Room Blocks (Optional)</label>
//                     <select
//                         multiple
//                         value={selectedRoomBlockIds}
//                         onChange={e => {
//                             const options = Array.from(e.target.selectedOptions).map(o => o.value);
//                             setSelectedRoomBlockIds(options);
//                         }}
//                         className="w-full border rounded p-2 h-32"
//                     >
//                         {roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
//                     </select>
//                 </div>

//                 <div className="flex justify-end space-x-2 mt-4">
//                     <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
//                     <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Group</button>
//                 </div>
//             </div>
//         </div>
//     );
// }





'use client';
import { useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { FaUsers, FaBuilding, FaBriefcase, FaList, FaUser } from "react-icons/fa";

export default function AddGroupModal({ isOpen, onClose, properties, companies, guests, roomBlocks, onGroupAdded }) {
    const socket = useSocket();

    const [form, setForm] = useState({
        name: "",
        code: "",
        description: "",
        propertyId: "",
        companyId: "",
        leaderId: "",
        roomBlockIds: []
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleRoomBlocksChange = (e) => {
        const options = Array.from(e.target.selectedOptions).map(o => o.value);
        setForm(prev => ({ ...prev, roomBlockIds: options }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.code.trim() || !form.propertyId) {
            setError("Group Name, Code and Property are required");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...form };
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) throw new Error(data.error || "Failed to create group");

            onGroupAdded && onGroupAdded(data);
            socket?.emit("GROUP_CREATED", data);
            setForm({ name: "", code: "", description: "", propertyId: "", companyId: "", leaderId: "", roomBlockIds: [] });
            onClose();
        } catch (err) {
            setLoading(false);
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FaUsers /> Add New Group
                </h2>

                {error && (
                    <div className="mb-3 p-2 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 rounded-lg">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Group Name */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaUsers /> Group Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            placeholder="Enter group name"
                        />
                    </div>

                    {/* Group Code */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaList /> Group Code *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            placeholder="Enter group code"
                        />
                    </div>

                    {/* Property */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaBuilding /> Property *
                        </label>
                        <select
                            name="propertyId"
                            value={form.propertyId}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Company */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaBriefcase /> Company (Optional)
                        </label>
                        <select
                            name="companyId"
                            value={form.companyId}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            <option value="">Select Company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Leader */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaUser /> Leader (Optional)
                        </label>
                        <select
                            name="leaderId"
                            value={form.leaderId}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            <option value="">Select Leader</option>
                            {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            placeholder="Enter description"
                        />
                    </div>

                    {/* Room Blocks */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaList /> Room Blocks (Optional)
                        </label>
                        <select
                            multiple
                            name="roomBlockIds"
                            value={form.roomBlockIds}
                            onChange={handleRoomBlocksChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 h-32"
                        >
                            {roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {loading ? "Saving..." : "Add Group"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
