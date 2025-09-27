// 'use client';
// import { useState, useEffect } from "react";

// export default function EditRoomModal({ room, isOpen, onClose, onSaved, properties = [], roomTypes = [], userId }) {
//     const [number, setNumber] = useState(room?.number || "");
//     const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId || "");
//     const [status, setStatus] = useState(room?.status || "VACANT");
//     const [floor, setFloor] = useState(room?.floor || "");
//     const [notes, setNotes] = useState(room?.notes || "");

//     useEffect(() => {
//         setNumber(room?.number || "");
//         setRoomTypeId(room?.roomTypeId || "");
//         setStatus(room?.status || "VACANT");
//         setFloor(room?.floor || "");
//         setNotes(room?.notes || "");
//     }, [room]);

//     const handleSave = async () => {
//         const res = await fetch(`/api/rooms/${room.id}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 propertyId: room.propertyId, // ⚡ أضف هذا
//                 number,
//                 roomTypeId,
//                 status,
//                 floor: floor ? parseInt(floor) : null,
//                 notes,
//                 changedById: userId,
//             }),
//         });

//         if (res.ok) {
//             const updatedRoom = await res.json();
//             onSaved(updatedRoom);
//             onClose();
//         } else {
//             alert("Error updating room");
//         }
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
//                 <h2 className="text-xl font-bold mb-4">Edit Room {room.number}</h2>

//                 <div className="flex flex-col gap-3">
//                     <label className="flex flex-col text-sm">
//                         Number
//                         <input
//                             type="text"
//                             value={number}
//                             onChange={(e) => setNumber(e.target.value)}
//                             className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
//                         />
//                     </label>

//                     <label className="flex flex-col text-sm">
//                         Room Type
//                         <select
//                             value={roomTypeId}
//                             onChange={(e) => setRoomTypeId(e.target.value)}
//                             className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
//                         >
//                             {roomTypes.map(rt => (
//                                 <option key={rt.id} value={rt.id}>{rt.name}</option>
//                             ))}
//                         </select>
//                     </label>

//                     <label className="flex flex-col text-sm">
//                         Status
//                         <select
//                             value={status}
//                             onChange={(e) => setStatus(e.target.value)}
//                             className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
//                         >
//                             <option value="VACANT">Available</option>
//                             <option value="OCCUPIED">Occupied</option>
//                             <option value="CLEANING">Cleaning</option>
//                             <option value="MAINTENANCE">Maintenance</option>
//                         </select>
//                     </label>

//                     <label className="flex flex-col text-sm">
//                         Floor
//                         <input
//                             type="number"
//                             value={floor}
//                             onChange={(e) => setFloor(e.target.value)}
//                             className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
//                         />
//                     </label>

//                     <label className="flex flex-col text-sm">
//                         Notes
//                         <textarea
//                             value={notes}
//                             onChange={(e) => setNotes(e.target.value)}
//                             className="mt-1 p-2 rounded border dark:bg-gray-700 dark:text-white"
//                         />
//                     </label>
//                 </div>

//                 <div className="mt-4 flex justify-end gap-2">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 bg-gray-500 text-white rounded"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         onClick={handleSave}
//                         className="px-4 py-2 bg-blue-600 text-white rounded"
//                     >
//                         Save
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }



'use client';
import { useState, useEffect } from "react";
import { X, Save, Home, Hash, Layers, StickyNote, DoorOpen } from "lucide-react";

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
                propertyId: room.propertyId,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <DoorOpen className="w-6 h-6 text-blue-500" />
                        Edit Room <span className="text-blue-500">#{room.number}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Number */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Hash className="w-4 h-4 text-blue-500" /> Room Number
                        </label>
                        <input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="mt-1 w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Room Type */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Layers className="w-4 h-4 text-blue-500" /> Room Type
                        </label>
                        <select
                            value={roomTypeId}
                            onChange={(e) => setRoomTypeId(e.target.value)}
                            className="mt-1 w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {roomTypes.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Home className="w-4 h-4 text-blue-500" /> Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="VACANT">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                    </div>

                    {/* Floor */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Layers className="w-4 h-4 text-blue-500" /> Floor
                        </label>
                        <input
                            type="number"
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            className="mt-1 w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Notes */}
                    <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <StickyNote className="w-4 h-4 text-blue-500" /> Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="mt-1 w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
            </div>
        </div>
    );
}
