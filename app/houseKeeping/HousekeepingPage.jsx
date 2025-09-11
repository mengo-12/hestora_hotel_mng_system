
'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddHousekeepingTaskModal from "@/app/components/AddHousekeepingTaskModal";

const statusColors = {
    VACANT: "bg-green-500",
    OCCUPIED: "bg-red-500",
    CLEANING: "bg-yellow-500",
    MAINTENANCE: "bg-blue-500",
};

export default function HousekeepingPage({ userProperties, session }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const canModifyRoom = ["Admin", "FrontDesk"].includes(role);
    const canManageTasks = ["Admin", "HK"].includes(role);
    const canView = ["Admin", "FrontDesk", "HK", "Manager"].includes(role);

    const [propertyId, setPropertyId] = useState(userProperties?.[0]?.id || "");
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [modalRoom, setModalRoom] = useState(null);

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    const fetchHousekeeping = async (propId = propertyId) => {
        if (!propId) return;
        try {
            const res = await fetch(`/api/houseKeeping?propertyId=${propId}&date=${date}`);
            const data = await res.json();
            setRooms(data.rooms?.map(r => ({ ...r, bookingEnded: false })) || []);
        } catch (err) {
            console.error("Fetch housekeeping failed:", err);
            setRooms([]);
        }
    };

    useEffect(() => { fetchHousekeeping(); }, [propertyId, date]);

    useEffect(() => {
        if (!socket) return;

        const handleRoomUpdate = (updatedRoom) => {
            if (updatedRoom.propertyId === propertyId) {
                setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r));
            }
        };

        const handleHousekeepingUpdate = ({ task, roomId }) => {
            setRooms(prev =>
                prev.map(r =>
                    r.id === roomId
                        ? { ...r, housekeepingTasks: [task, ...r.housekeepingTasks.filter(t => t.id !== task.id)] }
                        : r
                )
            );
        };

        const handleRoomStatusChange = ({ roomId, newStatus }) => {
            setRooms(prev =>
                prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r)
            );
        };

                // حدث جديد عند انتهاء الحجز
        const handleRoomBookingEnded = ({ roomId }) => {
            setRooms(prev =>
                prev.map(r => r.id === roomId ? { ...r, bookingEnded: true } : r)
            );
        };

        socket.on("ROOM_UPDATED", handleRoomUpdate);
        socket.on("HOUSEKEEPING_UPDATED", handleHousekeepingUpdate);
        socket.on("ROOM_STATUS_CHANGED", handleRoomStatusChange);
        socket.on("ROOM_BOOKING_ENDED", handleRoomBookingEnded);

        return () => {
            socket.off("ROOM_UPDATED", handleRoomUpdate);
            socket.off("HOUSEKEEPING_UPDATED", handleHousekeepingUpdate);
            socket.off("ROOM_STATUS_CHANGED", handleRoomStatusChange);
            socket.off("ROOM_BOOKING_ENDED", handleRoomBookingEnded);
        };
    }, [socket, propertyId]);

    const updateRoomStatus = async (roomId, newStatus) => {
        if (!canModifyRoom) return alert("You do not have permission to change room status.");
        try {
            const room = rooms.find(r => r.id === roomId);
            if (!room) throw new Error("Room not found");

            const res = await fetch(`/api/rooms/${roomId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...room, status: newStatus }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");
        } catch (err) {
            console.error("Update room status failed:", err);
            alert("Update room status failed: " + err.message);
        }
    };

    const handleAddTask = async (room, taskData) => {
        if (!canManageTasks) return alert("You do not have permission to add tasks.");
        try {
            const res = await fetch("/api/houseKeeping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: room.id, propertyId, ...taskData }),
            });
            const result = await res.json();
            if (result.success) setModalRoom(null);
        } catch (err) {
            console.error(err);
            alert("Failed to add task");
        }
    };

    const closeTask = async (taskId, roomId) => {
        if (!canManageTasks) return alert("You do not have permission to close tasks.");
        try {
            const res = await fetch(`/api/houseKeeping/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Closed" }) });
            const result = await res.json();
            if (!result.success) alert("Failed to close task: " + result.error);
        } catch (err) {
            console.error("Error closing task:", err);
        }
    };

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

    const groupedByFloor = filteredRooms.reduce((acc, room) => {
        const floor = room.floor || "Unknown";
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
    }, {});


    return (
        <div className="p-6">

            {/* الفلاتر */}
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
                        <span className="text-red-500">No properties</span>
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
                    <div key={key} className="bg-gray-200 rounded p-2 text-center flex-1">
                        <h3 className="font-bold">{key.replace("_", " ")}</h3>
                        <p>{value}</p>
                    </div>
                ))}
            </div>

            <div className="h-[70vh] overflow-y-auto pr-2">
                {Object.keys(groupedByFloor).map(floor => (
                    <div key={floor} className="mb-6">
                        <h2 className="text-lg font-bold mb-2 sticky top-0 bg-white z-10 p-1 shadow">Floor {floor}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedByFloor[floor].map(room => (
                                <div key={room.id} className={`p-4 rounded shadow text-white ${statusColors[room.status] || "bg-gray-500"}`}>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold">Room {room.number}</span>
                                        <span className="px-2 py-1 text-xs rounded bg-black bg-opacity-20">{room.status}</span>
                                    </div>

                                    <h4 className="font-semibold mb-1">Tasks:</h4>
                                    {room.housekeepingTasks.length === 0 && <p className="text-sm">No tasks</p>}
                                    <ul className="space-y-1">
                                        {room.housekeepingTasks.map(task => (
                                            <li key={task.id} className="bg-white text-black rounded p-2 text-sm flex justify-between items-center">
                                                <span>{task.type} ({task.priority}) - {task.status}</span>
                                                {task.status === "Open" && canManageTasks && (
                                                    <button onClick={() => closeTask(task.id, room.id)} className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs">Close</button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex gap-2 mt-3">
                                        {canModifyRoom && (
                                            <>
                                                <button onClick={() => updateRoomStatus(room.id, "CLEANING")} className="bg-yellow-600 px-2 py-1 rounded text-sm">Cleaning</button>
                                                <button onClick={() => updateRoomStatus(room.id, "VACANT")} className="bg-green-600 px-2 py-1 rounded text-sm">Vacant</button>
                                                <button onClick={() => updateRoomStatus(room.id, "MAINTENANCE")} className="bg-red-600 px-2 py-1 rounded text-sm">Maintenance</button>
                                            </>
                                        )}
                                    </div>

                                    {canManageTasks && (
                                        <button onClick={() => setModalRoom(room)} className="mt-2 px-2 py-1 bg-blue-700 rounded text-sm">+ Add Task</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {modalRoom && canManageTasks && (
                <AddHousekeepingTaskModal isOpen={!!modalRoom} room={modalRoom} onClose={() => setModalRoom(null)} onSave={(taskData) => handleAddTask(modalRoom, taskData)} />
            )}
        </div>
    );
}
