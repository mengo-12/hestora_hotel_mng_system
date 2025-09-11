'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddRoomModal from "@/app/components/AddRoomModal";
import EditRoomModal from "@/app/components/EditRoomModal";

export default function RoomsPage({ session, userProperties }) {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [editRoom, setEditRoom] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);
    const [properties, setProperties] = useState(userProperties || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterRoomType, setFilterRoomType] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const socket = useSocket();

    // صلاحيات المستخدم حسب الدور
    const userRole = session?.user?.role || "FrontDesk";
    const canAdd = ["Admin", "Manager"].includes(userRole);
    const canEdit = ["Admin", "Manager"].includes(userRole);
    const canDelete = ["Admin"].includes(userRole);
    const canCheckInOut = ["Admin", "FrontDesk"].includes(userRole);

    useEffect(() => {
        fetchRooms();
        fetchRoomTypes();

        if (socket) {
            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setRooms(prev =>
                    prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r)
                );
            });
            socket.on("ROOM_CREATED", (room) => setRooms(prev => [...prev, room]));
            socket.on("ROOM_UPDATED", (updatedRoom) => setRooms(prev =>
                prev.map(r => r.id === updatedRoom.id ? updatedRoom : r)
            ));
            socket.on("ROOM_DELETED", (roomId) => setRooms(prev => prev.filter(r => r.id !== roomId)));
        }

        return () => {
            if (socket) {
                socket.off("ROOM_STATUS_CHANGED");
                socket.off("ROOM_CREATED");
                socket.off("ROOM_UPDATED");
                socket.off("ROOM_DELETED");
            }
        };
    }, [socket]);

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            let data = await res.json();
            if (userRole !== "Admin") {
                // تقييد الغرف حسب الفندق المسموح به للمستخدم
                const allowedPropertyIds = userProperties.map(p => p.id);
                data = data.filter(r => allowedPropertyIds.includes(r.propertyId));
            }
            setRooms(data);
            setFilteredRooms(data);
        } catch (err) {
            console.error(err);
            setRooms([]);
            setFilteredRooms([]);
        }
    };

    const fetchRoomTypes = async () => {
        try {
            const res = await fetch("/api/roomTypes");
            const data = await res.json();
            setRoomTypes(data || []);
        } catch {
            setRoomTypes([]);
        }
    };

    // فلترة الغرف
    useEffect(() => {
        let filtered = rooms;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(room =>
                room.number.toString().includes(term) ||
                room.roomType?.name?.toLowerCase().includes(term) ||
                room.status?.toLowerCase().includes(term)
            );
        }
        if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);
        if (filterRoomType) filtered = filtered.filter(r => r.roomTypeId === filterRoomType);
        if (filterProperty) filtered = filtered.filter(r => r.propertyId === filterProperty);
        setFilteredRooms(filtered);
    }, [searchTerm, filterStatus, filterRoomType, filterProperty, rooms]);

    const statusConfig = {
        VACANT: { bg: "bg-green-500", text: "text-white" },
        OCCUPIED: { bg: "bg-red-500", text: "text-white" },
        CLEANING: { bg: "bg-yellow-400", text: "text-black" },
        MAINTENANCE: { bg: "bg-blue-500", text: "text-white" },
        BOOKED: { bg: "bg-purple-500", text: "text-white" },
    };

    const handleCheckIn = async (roomId) => {
        try {
            const res = await fetch(`/api/bookings/${roomId}/checkin`, { method: "POST" });
            if (!res.ok) throw new Error("Check-In failed");
            fetchRooms();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleCheckOut = async (roomId) => {
        try {
            const res = await fetch(`/api/bookings/${roomId}/checkout`, { method: "POST" });
            if (!res.ok) throw new Error("Check-Out failed");
            fetchRooms();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };


    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
                <h1 className="text-2xl font-bold dark:text-white">Rooms</h1>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="🔍 Search rooms..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 md:flex-none px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="VACANT">Vacant</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="CLEANING">Cleaning</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="BOOKED">Booked</option>
                    </select>
                    <select
                        value={filterRoomType}
                        onChange={e => setFilterRoomType(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Types</option>
                        {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                    <select
                        value={filterProperty}
                        onChange={e => setFilterProperty(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {canAdd && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            + Add Room
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map(room => {
                    const config = statusConfig[room.status] || { bg: "bg-gray-300", text: "text-black" };
                    const booking = room.currentBooking?.[0];
                    return (
                        <div key={room.id} className={`p-4 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${config.bg} ${config.text}`} onClick={() => setSelectedRoom(room)}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">{room.number}</h2>
                                <div className="flex gap-1">
                                    {canEdit && <button onClick={e => { e.stopPropagation(); setEditRoom(room); }} className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200">✏️ Edit</button>}
                                    {canDelete && <button onClick={async e => {
                                        e.stopPropagation();
                                        if (!confirm(`Are you sure you want to delete Room ${room.number}?`)) return;
                                        try {
                                            const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
                                            if (!res.ok) throw new Error("Delete failed");
                                            setRooms(prev => prev.filter(r => r.id !== room.id));
                                        } catch (err) { console.error(err); alert(err.message); }
                                    }} className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600">🗑 Delete</button>}
                                </div>
                            </div>

                            <p className="mt-2">Type: {room.roomType?.name || "N/A"}</p>
                            <p>Status: {room.status}</p>

                            {booking && room.status === "BOOKED" && canCheckInOut && (
                                <div className="mt-2 flex gap-2">
                                    <button onClick={e => { e.stopPropagation(); handleCheckIn(room.id); }} className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Check-In</button>
                                    <button onClick={e => { e.stopPropagation(); handleCheckOut(room.id); }} className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Check-Out</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showAddModal && canAdd && <AddRoomModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} roomTypes={roomTypes} userId={session?.user?.id} />}
            {editRoom && canEdit && <EditRoomModal room={editRoom} isOpen={!!editRoom} onClose={() => setEditRoom(null)} onSaved={() => setEditRoom(null)} roomTypes={roomTypes} properties={properties} />}

            {selectedRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Room {selectedRoom.number}</h2>
                        <p><b>Type:</b> {selectedRoom.roomType?.name || "N/A"}</p>
                        <p><b>Status:</b> {selectedRoom.status}</p>
                        <div className="mt-4 text-right">
                            <button onClick={() => setSelectedRoom(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



