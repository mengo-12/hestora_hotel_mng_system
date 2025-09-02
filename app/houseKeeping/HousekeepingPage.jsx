// app/housekeeping/HousekeepingPage.jsx
'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddHousekeepingTaskModal from "@/app/components/AddHousekeepingTaskModal";

export default function HousekeepingPage({ userProperties }) {
    const socket = useSocket();

    const [propertyId, setPropertyId] = useState(userProperties?.[0]?.id || "");
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [modalRoom, setModalRoom] = useState(null);

    // --- جلب المهام والغرف ---
    const fetchHousekeeping = async (propId = propertyId) => {
        if (!propId) return;
        try {
            const res = await fetch(`/api/houseKeeping?propertyId=${propId}&date=${date}`);
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (err) {
            console.error("Fetch housekeeping failed:", err);
            setRooms([]);
        }
    };

    useEffect(() => { fetchHousekeeping(); }, [propertyId, date]);

    // --- الاستماع للبث العالمي ---
    useEffect(() => {
        if (!socket) return;

        // تحديث حالة الغرفة فورًا
        const handleRoomUpdate = ({ roomId, newStatus }) => {
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
        };

        // تحديث مهمة التدبير المنزلي
        const handleHousekeepingUpdate = ({ roomId }) => {
            setRooms(prev =>
                prev.map(r => r.id === roomId
                    ? { ...r, housekeepingTasks: [...r.housekeepingTasks] } // تحديث المهام
                    : r
                )
            );
        };

        socket.on("ROOM_STATUS_CHANGED", handleRoomUpdate);
        socket.on("HOUSEKEEPING_UPDATED", handleHousekeepingUpdate);

        return () => {
            socket.off("ROOM_STATUS_CHANGED", handleRoomUpdate);
            socket.off("HOUSEKEEPING_UPDATED", handleHousekeepingUpdate);
        };
    }, [socket]);

    // --- إضافة مهمة جديدة ---
    const handleAddTask = async (room, taskData) => {
        if (!propertyId) return alert("Please select a property first.");
        try {
            const res = await fetch("/api/housekeeping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: room.id,
                    propertyId,
                    type: taskData.type,
                    priority: taskData.priority,
                    notes: taskData.notes,
                    assignedToId: taskData.assignedTo || null
                })
            });
            const result = await res.json();
            if (result.success) {
                setModalRoom(null);
                // البث يتم من الخادم
            }
        } catch (err) {
            console.error(err);
            alert("Failed to add task");
        }
    };

    // --- تحديث حالة المهمة ---
    const handleTaskUpdate = async (taskId, status, notes, roomStatus, roomId) => {
        if (!propertyId) return;
        try {
            const res = await fetch("/api/housekeeping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, status, notes, roomStatus, propertyId })
            });
            const result = await res.json();
            if (!result.success) throw new Error("Update failed");
        } catch (err) {
            console.error(err);
            alert("Failed to update task");
        }
    };

    // --- فلاتر الغرف ---
    const filteredRooms = rooms.filter(r =>
        r.number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterStatus ? r.status === filterStatus : true) &&
        (filterPriority ? r.housekeepingTasks.some(t => t.priority === filterPriority) : true)
    );

    const stats = {
        VACANT: rooms.filter(r => r.status === "VACANT").length,
        OCCUPIED: rooms.filter(r => r.status === "OCCUPIED").length,
        CLEANING: rooms.filter(r => r.status === "CLEANING").length,
        MAINTENANCE: rooms.filter(r => r.status === "MAINTENANCE").length,
        OPEN_TASKS: rooms.reduce((sum, r) => sum + r.housekeepingTasks.filter(t => t.status === "Open").length, 0),
        CLOSED_TASKS: rooms.reduce((sum, r) => sum + r.housekeepingTasks.filter(t => t.status === "Closed").length, 0)
    };

    return (
        <div className="p-6">
            {/* العنوان والفلاتر */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                <h1 className="text-2xl font-bold">Housekeeping Dashboard</h1>
                <div className="flex gap-2 flex-wrap">
                    {userProperties?.length > 0 ? (
                        <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="px-3 py-2 border rounded">
                            {userProperties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-red-500">No properties available</span>
                    )}
                    <input type="text" placeholder="Search room..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 rounded border" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded border">
                        <option value="">All Status</option>
                        <option value="VACANT">VACANT</option>
                        <option value="OCCUPIED">OCCUPIED</option>
                        <option value="CLEANING">CLEANING</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 rounded border">
                        <option value="">All Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded border" />
                </div>
            </div>

            {/* إحصائيات */}
            <div className="flex gap-4 mb-4 flex-wrap">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center flex-1">
                        <h3 className="font-bold">{key.replace("_", " ")}</h3>
                        <p>{value}</p>
                    </div>
                ))}
            </div>

            {/* قائمة الغرف */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.length === 0 && <p className="col-span-full text-center text-gray-500">No rooms found.</p>}
                {filteredRooms.map(room => (
                    <div key={room.id} className="border rounded p-3 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">{room.number} - {room.roomType?.name}</span>
                            <span className={`px-2 py-1 text-xs rounded text-white ${room.status === "VACANT" ? "bg-green-500" :
                                room.status === "OCCUPIED" ? "bg-blue-500" :
                                    room.status === "CLEANING" ? "bg-yellow-500" : "bg-gray-500"
                                }`}>{room.status}</span>
                        </div>

                        <h4 className="font-semibold mb-1">Tasks:</h4>
                        {room.housekeepingTasks.length === 0 && <p className="text-sm text-gray-500">No tasks</p>}
                        <ul className="space-y-1">
                            {room.housekeepingTasks.map(task => (
                                <li key={task.id} className="border rounded p-2 bg-gray-50 flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <span>{task.type} ({task.priority || "N/A"})</span>
                                        <span className={`text-xs px-1 rounded ${task.status === "Open" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>{task.status}</span>
                                    </div>
                                    {task.notes && <p className="text-sm text-gray-600">{task.notes}</p>}
                                    <div className="flex gap-2 mt-1">
                                        {task.status !== "Closed" && (
                                            <button className="bg-green-500 text-white text-xs px-2 py-1 rounded"
                                                onClick={() => handleTaskUpdate(task.id, "Closed", task.notes, "VACANT", room.id)}>
                                                Close
                                            </button>
                                        )}
                                        {task.status === "Closed" && (
                                            <button className="bg-yellow-500 text-white text-xs px-2 py-1 rounded"
                                                onClick={() => handleTaskUpdate(task.id, "Open", task.notes, "CLEANING", room.id)}>
                                                Reopen
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <button className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                            onClick={() => setModalRoom(room)}>
                            Add Task
                        </button>
                    </div>
                ))}
            </div>

            {/* مودال إضافة مهمة */}
            {modalRoom && (
                <AddHousekeepingTaskModal
                    isOpen={!!modalRoom}
                    room={modalRoom}
                    onClose={() => setModalRoom(null)}
                    onSave={(taskData) => handleAddTask(modalRoom, taskData)}
                />
            )}
        </div>
    );
}
