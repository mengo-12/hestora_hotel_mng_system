// 'use client';
// import { useState } from "react";

// export default function AddHousekeepingTaskModal({ isOpen, onClose, onSave, room }) {
//     const [type, setType] = useState("");
//     const [priority, setPriority] = useState("Medium");
//     const [assignedTo, setAssignedTo] = useState("");
//     const [notes, setNotes] = useState("");

//     if (!isOpen) return null;

//     const handleSave = () => {
//         if (!type.trim()) return alert("Task type is required");

//         onSave({
//             type: type.trim(),
//             priority,
//             assignedTo: assignedTo.trim() || null,
//             notes: notes.trim() || null
//         });

//         // إعادة تهيئة الحقول بعد الحفظ
//         setType("");
//         setPriority("Medium");
//         setAssignedTo("");
//         setNotes("");
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
//                 <h2 className="text-xl font-bold mb-4">Add Task for Room {room.number}</h2>
//                 <div className="flex flex-col gap-2">
//                     <input
//                         type="text"
//                         placeholder="Task type"
//                         value={type}
//                         onChange={(e) => setType(e.target.value)}
//                         className="px-3 py-2 border rounded"
//                     />
//                     <select
//                         value={priority}
//                         onChange={(e) => setPriority(e.target.value)}
//                         className="px-3 py-2 border rounded"
//                     >
//                         <option value="High">High</option>
//                         <option value="Medium">Medium</option>
//                         <option value="Low">Low</option>
//                     </select>
//                     <input
//                         type="text"
//                         placeholder="Assigned to (optional)"
//                         value={assignedTo}
//                         onChange={(e) => setAssignedTo(e.target.value)}
//                         className="px-3 py-2 border rounded"
//                     />
//                     <textarea
//                         placeholder="Notes (optional)"
//                         value={notes}
//                         onChange={(e) => setNotes(e.target.value)}
//                         className="px-3 py-2 border rounded"
//                     />
//                 </div>
//                 <div className="flex justify-end gap-2 mt-4">
//                     <button
//                         onClick={onClose}
//                         className="px-3 py-1 rounded border"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         onClick={handleSave}
//                         className="px-3 py-1 rounded bg-blue-500 text-white"
//                     >
//                         Add Task
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }


'use client';
import { useState } from "react";
import { X, ClipboardList, AlertTriangle, User, StickyNote } from "lucide-react";

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

        setType("");
        setPriority("Medium");
        setAssignedTo("");
        setNotes("");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-fadeIn">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 className="text-lg font-semibold mb-6 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <ClipboardList className="text-blue-500" size={20} />
                    Add Task for Room <span className="text-blue-500">{room.number}</span>
                </h2>

                {/* Form Fields */}
                <div className="flex flex-col gap-4">
                    {/* Task Type */}
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Task Type</label>
                        <div className="flex items-center gap-2">
                            <ClipboardList size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="e.g. Deep Cleaning"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Priority</label>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-yellow-500" />
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Assigned To</label>
                        <div className="flex items-center gap-2">
                            <User size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Optional staff name"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Notes</label>
                        <div className="flex items-start gap-2">
                            <StickyNote size={18} className="text-green-500 mt-2" />
                            <textarea
                                placeholder="Optional notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <ClipboardList size={18} />
                        Add Task
                    </button>
                </div>
            </div>
        </div>
    );
}

