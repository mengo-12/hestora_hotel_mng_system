// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import { FaDoorOpen, FaBed, FaUserCheck, FaUserTimes } from "react-icons/fa";
// import AddRoomModal from "@/app/components/AddRoomModal";
// import EditRoomModal from "@/app/components/EditRoomModal";

// export default function RoomsPage({ session, userProperties }) {
//     const [rooms, setRooms] = useState([]);
//     const [filteredRooms, setFilteredRooms] = useState([]);
//     const [editRoom, setEditRoom] = useState(null);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [roomTypes, setRoomTypes] = useState([]);
//     const [properties, setProperties] = useState(userProperties || []);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterStatus, setFilterStatus] = useState("");
//     const [filterRoomType, setFilterRoomType] = useState("");
//     const [filterProperty, setFilterProperty] = useState("");
//     const socket = useSocket();

//     const userRole = session?.user?.role || "FrontDesk";
//     const canAdd = ["Admin", "Manager"].includes(userRole);
//     const canEdit = ["Admin", "Manager"].includes(userRole);
//     const canDelete = ["Admin"].includes(userRole);
//     const canCheckInOut = ["Admin", "FrontDesk"].includes(userRole);

//     const statusConfig = {
//         VACANT: { bg: "bg-green-100 dark:bg-green-700", text: "text-green-700 dark:text-white", icon: <FaDoorOpen /> },
//         OCCUPIED: { bg: "bg-red-100 dark:bg-red-700", text: "text-red-700 dark:text-white", icon: <FaBed /> },
//         CLEANING: { bg: "bg-yellow-100 dark:bg-yellow-500", text: "text-yellow-700 dark:text-black", icon: "🧹" },
//         MAINTENANCE: { bg: "bg-blue-100 dark:bg-blue-700", text: "text-blue-700 dark:text-white", icon: "🛠️" },
//         BOOKED: { bg: "bg-purple-100 dark:bg-purple-700", text: "text-purple-700 dark:text-white", icon: "📅" },
//     };

//     useEffect(() => {
//         fetchRooms();
//         fetchRoomTypes();

//         if (socket) {
//             socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
//                 setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
//             });
//             socket.on("ROOM_CREATED", (room) => setRooms(prev => [...prev, room]));
//             socket.on("ROOM_UPDATED", (updatedRoom) => setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r)));
//             socket.on("ROOM_DELETED", (roomId) => setRooms(prev => prev.filter(r => r.id !== roomId)));
//         }

//         return () => {
//             if (socket) {
//                 socket.off("ROOM_STATUS_CHANGED");
//                 socket.off("ROOM_CREATED");
//                 socket.off("ROOM_UPDATED");
//                 socket.off("ROOM_DELETED");
//             }
//         };
//     }, [socket]);

//     const fetchRooms = async () => {
//         try {
//             const res = await fetch("/api/rooms");
//             let data = await res.json();
//             if (userRole !== "Admin") {
//                 const allowedPropertyIds = userProperties.map(p => p.id);
//                 data = data.filter(r => allowedPropertyIds.includes(r.propertyId));
//             }
//             setRooms(data);
//             setFilteredRooms(data);
//         } catch {
//             setRooms([]);
//             setFilteredRooms([]);
//         }
//     };

//     const fetchRoomTypes = async () => {
//         try {
//             const res = await fetch("/api/roomTypes");
//             const data = await res.json();
//             setRoomTypes(data || []);
//         } catch {
//             setRoomTypes([]);
//         }
//     };

//     useEffect(() => {
//         let filtered = rooms;
//         if (searchTerm.trim()) {
//             const term = searchTerm.toLowerCase();
//             filtered = filtered.filter(room =>
//                 room.number.toString().includes(term) ||
//                 room.roomType?.name?.toLowerCase().includes(term) ||
//                 room.status?.toLowerCase().includes(term)
//             );
//         }
//         if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);
//         if (filterRoomType) filtered = filtered.filter(r => r.roomTypeId === filterRoomType);
//         if (filterProperty) filtered = filtered.filter(r => r.propertyId === filterProperty);
//         setFilteredRooms(filtered);
//     }, [searchTerm, filterStatus, filterRoomType, filterProperty, rooms]);

//     const handleCheckIn = async (roomId) => { try { await fetch(`/api/bookings/${roomId}/checkin`, { method: "POST" }); fetchRooms(); } catch { } };
//     const handleCheckOut = async (roomId) => { try { await fetch(`/api/bookings/${roomId}/checkout`, { method: "POST" }); fetchRooms(); } catch { } };

//     return (
//         <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

//             {/* KPI Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Vacant Rooms</span>
//                     <span className="text-2xl font-bold">{rooms.filter(r => r.status === "VACANT").length}</span>
//                 </div>
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Occupied Rooms</span>
//                     <span className="text-2xl font-bold">{rooms.filter(r => r.status === "OCCUPIED").length}</span>
//                 </div>
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Cleaning</span>
//                     <span className="text-2xl font-bold">{rooms.filter(r => r.status === "CLEANING").length}</span>
//                 </div>
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Maintenance</span>
//                     <span className="text-2xl font-bold">{rooms.filter(r => r.status === "MAINTENANCE").length}</span>
//                 </div>
//             </div>

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
//                 <div className="flex flex-col w-full md:w-1/4">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
//                     <input type="text" placeholder="Search rooms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
//                 </div>
//                 <div className="flex flex-col w-full md:w-1/5">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Status</label>
//                     <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
//                         <option value="">All Status</option>
//                         {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
//                     </select>
//                 </div>
//                 <div className="flex flex-col w-full md:w-1/5">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Type</label>
//                     <select value={filterRoomType} onChange={e => setFilterRoomType(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
//                         <option value="">All Types</option>
//                         {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
//                     </select>
//                 </div>
//                 <div className="flex flex-col w-full md:w-1/5">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
//                     <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
//                         <option value="">All Properties</option>
//                         {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>
//                 {canAdd && <div className="flex w-full md:w-auto">
//                     <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Room</button>
//                 </div>}
//             </div>

//             {/* Rooms Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {filteredRooms.map(room => {
//                     const config = statusConfig[room.status] || { bg: "bg-gray-100 dark:bg-gray-700", text: "text-black dark:text-white", icon: "🏨" };
//                     return (
//                         <div key={room.id} className={`p-4 rounded-lg shadow flex flex-col justify-between gap-2 text-black bg-white dark:bg-gray-800 dark:text-white cursor-pointer hover:shadow-lg transition transform hover:scale-105`}>
//                             <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                     <span className={`text-xl ${config.text}`}>{config.icon}</span>
//                                     <h2 className="text-xl font-bold">{room.number}</h2>
//                                 </div>
//                                 <div className="flex gap-1">
//                                     {canEdit && <button onClick={e => { e.stopPropagation(); setEditRoom(room); }} className="bg-white dark:bg-gray-700 text-black px-2 py-1 rounded hover:bg-gray-200 text-xs">✏️ Edit</button>}
//                                     {canDelete && <button onClick={async e => { e.stopPropagation(); if (!confirm("Delete this room?")) return; await fetch(`/api/rooms/${room.id}`, { method: "DELETE" }); setRooms(prev => prev.filter(r => r.id !== room.id)); }} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs">🗑 Delete</button>}
//                                 </div>
//                             </div>
//                             <p className="flex items-center gap-2"><FaBed /> Type: {room.roomType?.name || "N/A"}</p>
//                             <p className={`flex items-center gap-2 ${config.bg} ${config.text} px-2 py-1 rounded w-max`}><FaDoorOpen /> Status: {room.status}</p>

//                             {room.currentBooking?.[0] && room.status === "BOOKED" && canCheckInOut &&
//                                 <div className="flex gap-2 mt-2">
//                                     <button onClick={e => { e.stopPropagation(); handleCheckIn(room.id); }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"><FaUserCheck /> Check-In</button>
//                                     <button onClick={e => { e.stopPropagation(); handleCheckOut(room.id); }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-1"><FaUserTimes /> Check-Out</button>
//                                 </div>
//                             }
//                         </div>
//                     );
//                 })}
//             </div>

//             {showAddModal && canAdd && <AddRoomModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} roomTypes={roomTypes} userId={session?.user?.id} />}
//             {editRoom && canEdit && <EditRoomModal room={editRoom} isOpen={!!editRoom} onClose={() => setEditRoom(null)} onSaved={() => setEditRoom(null)} roomTypes={roomTypes} properties={properties} />}
//         </div>
//     );
// }



'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { FaDoorOpen, FaBed, FaUserCheck, FaUserTimes } from "react-icons/fa";
import AddRoomModal from "@/app/components/AddRoomModal";
import EditRoomModal from "@/app/components/EditRoomModal";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function RoomsPage({ session, userProperties }) {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [editRoom, setEditRoom] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);
    const [properties, setProperties] = useState(userProperties || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterRoomType, setFilterRoomType] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const [loading, setLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const socket = useSocket();
    const userRole = session?.user?.role || "FrontDesk";
    const canAdd = ["Admin", "Manager"].includes(userRole);
    const canEdit = ["Admin", "Manager"].includes(userRole);
    const canDelete = ["Admin"].includes(userRole);
    const canCheckInOut = ["Admin", "FrontDesk"].includes(userRole);

    const statusConfig = {
        VACANT: { bg: "bg-green-100 dark:bg-green-700", text: "text-green-700 dark:text-white", icon: <FaDoorOpen /> },
        OCCUPIED: { bg: "bg-red-100 dark:bg-red-700", text: "text-red-700 dark:text-white", icon: <FaBed /> },
        CLEANING: { bg: "bg-yellow-100 dark:bg-yellow-500", text: "text-yellow-700 dark:text-black", icon: "🧹" },
        MAINTENANCE: { bg: "bg-blue-100 dark:bg-blue-700", text: "text-blue-700 dark:text-white", icon: "🛠️" },
        BOOKED: { bg: "bg-purple-100 dark:bg-purple-700", text: "text-purple-700 dark:text-white", icon: "📅" },
    };

    // Fetch Rooms
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/rooms");
            let data = await res.json();
            if (userRole !== "Admin") {
                const allowedPropertyIds = userProperties.map(p => p.id);
                data = data.filter(r => allowedPropertyIds.includes(r.propertyId));
            }
            setRooms(data);
            setFilteredRooms(data);
        } catch {
            setRooms([]);
            setFilteredRooms([]);
            toast.error("Failed to fetch rooms.");
        } finally {
            setLoading(false);
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

    useEffect(() => {
        fetchRooms();
        fetchRoomTypes();

        if (socket) {
            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
                toast.info(`Room #${roomId} status changed to ${newStatus}`);
            });

            socket.on("ROOM_CREATED", (room) => {
                setRooms(prev => [...prev, room]);
                toast.success(`Room #${room.number} added successfully.`);
            });

            socket.on("ROOM_UPDATED", (updatedRoom) => {
                setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                toast.success(`Room #${updatedRoom.number} updated successfully.`);
            });

            socket.on("ROOM_DELETED", (roomId) => {
                setRooms(prev => prev.filter(r => r.id !== roomId));
                toast.warning(`Room #${roomId} deleted.`);
            });
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

    // Filters
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
        setCurrentPage(1); // reset to first page on filter change
    }, [searchTerm, filterStatus, filterRoomType, filterProperty, rooms]);

    // Pagination logic
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleCheckIn = async (roomId) => {
        try {
            await fetch(`/api/bookings/${roomId}/checkin`, { method: "POST" });
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: "OCCUPIED" } : r));
            toast.success(`Room #${roomId} checked in.`);
        } catch {
            toast.error("Check-In failed.");
        }
    };

    const handleCheckOut = async (roomId) => {
        try {
            await fetch(`/api/bookings/${roomId}/checkout`, { method: "POST" });
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: "VACANT" } : r));
            toast.success(`Room #${roomId} checked out.`);
        } catch {
            toast.error("Check-Out failed.");
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Loading Spinner */}
            {loading && (
                <div className="flex justify-center items-center mb-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <input type="text" placeholder="Search rooms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white w-full md:w-1/4" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white w-full md:w-1/5">
                    <option value="">All Status</option>
                    {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterRoomType} onChange={e => setFilterRoomType(e.target.value)}
                    className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white w-full md:w-1/5">
                    <option value="">All Types</option>
                    {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </select>
                <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
                    className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white w-full md:w-1/5">
                    <option value="">All Properties</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {canAdd && <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Room</button>}
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedRooms.map(room => {
                    const config = statusConfig[room.status] || { bg: "bg-gray-100 dark:bg-gray-700", text: "text-black dark:text-white", icon: "🏨" };
                    return (
                        <div key={room.id} className={`p-4 rounded-lg shadow flex flex-col justify-between gap-2 text-black bg-white dark:bg-gray-800 dark:text-white cursor-pointer hover:shadow-lg transition transform hover:scale-105`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl ${config.text}`}>{config.icon}</span>
                                    <h2 className="text-xl font-bold">{room.number}</h2>
                                </div>
                                <div className="flex gap-1">
                                    {canEdit && <button onClick={e => { e.stopPropagation(); setEditRoom(room); }} className="bg-white dark:bg-gray-700 text-black px-2 py-1 rounded hover:bg-gray-200 text-xs">✏️ Edit</button>}
                                    {canDelete && <button onClick={async e => { e.stopPropagation(); if (!confirm("Delete this room?")) return; await fetch(`/api/rooms/${room.id}`, { method: "DELETE" }); setRooms(prev => prev.filter(r => r.id !== room.id)); toast.warning(`Room #${room.number} deleted.`); }} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs">🗑 Delete</button>}
                                </div>
                            </div>
                            <p className="flex items-center gap-2"><FaBed /> Type: {room.roomType?.name || "N/A"}</p>
                            <p className={`flex items-center gap-2 ${config.bg} ${config.text} px-2 py-1 rounded w-max`}><FaDoorOpen /> Status: {room.status}</p>

                            {room.currentBooking?.[0] && room.status === "BOOKED" && canCheckInOut &&
                                <div className="flex gap-2 mt-2">
                                    <button onClick={e => { e.stopPropagation(); handleCheckIn(room.id); }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"><FaUserCheck /> Check-In</button>
                                    <button onClick={e => { e.stopPropagation(); handleCheckOut(room.id); }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-1"><FaUserTimes /> Check-Out</button>
                                </div>
                            }
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 &&
                <div className="mt-6 flex justify-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50">Prev</button>
                    {[...Array(totalPages).keys()].map(i =>
                        <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{i + 1}</button>
                    )}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50">Next</button>
                </div>
            }

            {/* Modals */}
            {showAddModal && canAdd && <AddRoomModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} roomTypes={roomTypes} userId={session?.user?.id} onSaved={fetchRooms} />}
            {editRoom && canEdit && <EditRoomModal room={editRoom} isOpen={!!editRoom} onClose={() => setEditRoom(null)} onSaved={fetchRooms} roomTypes={roomTypes} properties={properties} userId={session?.user?.id} />}
        </div>
    );
}
