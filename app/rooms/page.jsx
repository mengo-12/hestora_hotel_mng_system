// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import AddRoomModal from "@/app/components/AddRoomModal";
// import EditRoomModal from "@/app/components/EditRoomModal";

// export default function RoomsPage() {
//     const [rooms, setRooms] = useState([]);
//     const [selectedRoom, setSelectedRoom] = useState(null);
//     const [editRoom, setEditRoom] = useState(null);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [roomTypes, setRoomTypes] = useState([]);
//     const [properties, setProperties] = useState([]);
//     const socket = useSocket();

//     useEffect(() => {
//         // جلب البيانات عند التحميل
//         fetchRooms();
//         fetchRoomTypes();
//         fetchProperties();

//         if (socket) {
//             // عند تغيير حالة الغرفة
//             socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
//                 setRooms(prev =>
//                     prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r)
//                 );
//             });

//             // عند إنشاء غرفة جديدة (عالمي)
//             socket.on("ROOM_CREATED", (room) => {
//                 setRooms(prev => [...prev, room]);
//             });

//             // عند حذف غرفة (عالمي)
//             socket.on("ROOM_DELETED", (roomId) => {
//                 setRooms(prev => prev.filter(r => r.id !== roomId));
//             });
//         }

//         return () => {
//             if (socket) {
//                 socket.off("ROOM_STATUS_CHANGED");
//                 socket.off("ROOM_CREATED");
//                 socket.off("ROOM_DELETED");
//             }
//         };
//     }, [socket]);

//     const fetchRooms = async () => {
//         const res = await fetch("/api/rooms");
//         const data = await res.json();
//         setRooms(data);
//     };

//     const fetchRoomTypes = async () => {
//         const res = await fetch("/api/roomTypes");
//         const data = await res.json();
//         setRoomTypes(data);
//     };

//     const fetchProperties = async () => {
//         const res = await fetch("/api/properties");
//         const data = await res.json();
//         setProperties(data);
//     };

//     const statusConfig = {
//         VACANT: { bg: "bg-green-500", text: "text-white" },
//         OCCUPIED: { bg: "bg-red-500", text: "text-white" },
//         CLEANING: { bg: "bg-yellow-400", text: "text-black" },
//         MAINTENANCE: { bg: "bg-blue-500", text: "text-white" },
//     };

//     return (
//         <div className="p-6">
//             {/* زر إضافة غرفة */}
//             <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold dark:text-white">Rooms</h1>
//                 <button
//                     onClick={() => setShowAddModal(true)}
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                     + Add Room
//                 </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {rooms.map(room => {
//                     const config = statusConfig[room.status] || { bg: "bg-gray-300", text: "text-black" };
//                     return (
//                         <div
//                             key={room.id}
//                             className={`p-4 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${config.bg} ${config.text}`}
//                             onClick={() => setSelectedRoom(room)}
//                         >
//                             <div className="flex justify-between items-center">
//                                 <h2 className="text-xl font-semibold">Room {room.number}</h2>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         setEditRoom(room);
//                                     }}
//                                     className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200"
//                                 >
//                                     ✏️ Edit
//                                 </button>
//                                 <button
//                                     onClick={async (e) => {
//                                         e.stopPropagation();
//                                         if (!confirm(`Are you sure you want to delete Room ${room.number}?`)) return;

//                                         try {
//                                             const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
//                                             if (!res.ok) {
//                                                 const data = await res.json();
//                                                 throw new Error(data.error || "Failed to delete room");
//                                             }
//                                             setRooms(prev => prev.filter(r => r.id !== room.id));
//                                         } catch (err) {
//                                             console.error(err);
//                                             alert(err.message);
//                                         }
//                                     }}
//                                     className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
//                                 >
//                                     🗑 Delete
//                                 </button>
//                             </div>
//                             <p className="mt-2">Type: {room.roomType?.name || "N/A"}</p>
//                             <p>Status: {room.status}</p>
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Add Room Modal */}
//             {showAddModal && (
//                 <AddRoomModal
//                     isOpen={showAddModal}
//                     onClose={() => setShowAddModal(false)}
//                     // تم إزالة إضافة الغرفة محليًا مباشرة
//                     properties={properties}
//                     roomTypes={roomTypes}
//                     userId={"currentUserId"}
//                 />
//             )}

//             {/* Edit Room Modal */}
//             {editRoom && (
//                 <EditRoomModal
//                     room={editRoom}
//                     isOpen={!!editRoom}
//                     onClose={() => setEditRoom(null)}
//                     onSaved={(updatedRoom) =>
//                         setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
//                     }
//                     roomTypes={roomTypes}
//                     properties={properties}
//                 />
//             )}

//             {/* Popup التفاصيل */}
//             {selectedRoom && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
//                         <h2 className="text-xl font-bold mb-4">Room {selectedRoom.number}</h2>
//                         <p><b>Type:</b> {selectedRoom.roomType?.name || "N/A"}</p>
//                         <p><b>Status:</b> {selectedRoom.status}</p>
//                         <div className="mt-4 text-right">
//                             <button
//                                 onClick={() => setSelectedRoom(null)}
//                                 className="px-4 py-2 bg-gray-500 text-white rounded"
//                             >
//                                 Close
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }



'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddRoomModal from "@/app/components/AddRoomModal";
import EditRoomModal from "@/app/components/EditRoomModal";

export default function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [editRoom, setEditRoom] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);
    const [properties, setProperties] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        // جلب البيانات عند التحميل
        fetchRooms();
        fetchRoomTypes();
        fetchProperties();

        if (socket) {
            // تغيير حالة الغرفة
            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setRooms(prev =>
                    prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r)
                );
            });

            // إنشاء غرفة جديدة عالميًا
            socket.on("ROOM_CREATED", (room) => {
                setRooms(prev => [...prev, room]);
            });

            // تعديل غرفة عالميًا
            socket.on("ROOM_UPDATED", (updatedRoom) => {
                setRooms(prev =>
                    prev.map(r => r.id === updatedRoom.id ? updatedRoom : r)
                );
            });

            // حذف غرفة عالميًا
            socket.on("ROOM_DELETED", (roomId) => {
                setRooms(prev => prev.filter(r => r.id !== roomId));
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

    const fetchRooms = async () => {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        setRooms(data);
    };

    const fetchRoomTypes = async () => {
        const res = await fetch("/api/roomTypes");
        const data = await res.json();
        setRoomTypes(data);
    };

    const fetchProperties = async () => {
        const res = await fetch("/api/properties");
        const data = await res.json();
        setProperties(data);
    };

    const statusConfig = {
        VACANT: { bg: "bg-green-500", text: "text-white" },
        OCCUPIED: { bg: "bg-red-500", text: "text-white" },
        CLEANING: { bg: "bg-yellow-400", text: "text-black" },
        MAINTENANCE: { bg: "bg-blue-500", text: "text-white" },
    };

    return (
        <div className="p-6">
            {/* زر إضافة غرفة */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Rooms</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Add Room
                </button>
            </div>

            {/* قائمة الغرف */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => {
                    const config = statusConfig[room.status] || { bg: "bg-gray-300", text: "text-black" };
                    return (
                        <div
                            key={room.id}
                            className={`p-4 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${config.bg} ${config.text}`}
                            onClick={() => setSelectedRoom(room)}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Room {room.number}</h2>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditRoom(room);
                                    }}
                                    className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm(`Are you sure you want to delete Room ${room.number}?`)) return;

                                        try {
                                            const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
                                            if (!res.ok) {
                                                const data = await res.json();
                                                throw new Error(data.error || "Failed to delete room");
                                            }
                                            setRooms(prev => prev.filter(r => r.id !== room.id));
                                        } catch (err) {
                                            console.error(err);
                                            alert(err.message);
                                        }
                                    }}
                                    className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                                >
                                    🗑 Delete
                                </button>
                            </div>
                            <p className="mt-2">Type: {room.roomType?.name || "N/A"}</p>
                            <p>Status: {room.status}</p>
                        </div>
                    );
                })}
            </div>

            {/* Add Room Modal */}
            {showAddModal && (
                <AddRoomModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    properties={properties}
                    roomTypes={roomTypes}
                    userId={"currentUserId"}
                />
            )}

            {/* Edit Room Modal */}
            {editRoom && (
                <EditRoomModal
                    room={editRoom}
                    isOpen={!!editRoom}
                    onClose={() => setEditRoom(null)}
                    // الآن لا نضيف محليًا، فقط البث العالمي يحدث التحديث
                    onSaved={() => setEditRoom(null)}
                    roomTypes={roomTypes}
                    properties={properties}
                />
            )}

            {/* Popup تفاصيل الغرفة */}
            {selectedRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Room {selectedRoom.number}</h2>
                        <p><b>Type:</b> {selectedRoom.roomType?.name || "N/A"}</p>
                        <p><b>Status:</b> {selectedRoom.status}</p>
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setSelectedRoom(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

