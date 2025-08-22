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
//     const socket = useSocket();

//     // جلب غرف
//     const fetchRooms = async () => {
//         const res = await fetch("/api/rooms");
//         const data = await res.json();
//         setRooms(data);
//     };

//     // جلب Room Types
//     const fetchRoomTypes = async () => {
//         const res = await fetch("/api/roomTypes");
//         const data = await res.json();
//         setRoomTypes(data);
//     };

//     // جلب Properties
//     const fetchProperties = async () => {
//         const res = await fetch("/api/properties");
//         const data = await res.json();
//         setProperties(data);
//     };

//     useEffect(() => {
//         fetchRooms();
//         fetchRoomTypes();
//         fetchProperties();
//         if (socket) {
//             socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
//                 setRooms(prev =>
//                     prev.map(r =>
//                         r.id === roomId ? { ...r, status: newStatus } : r
//                     )
//                 );
//             });
//             socket.on("ROOM_CREATED", (room) => {
//                 setRooms(prev => [...prev, room]);
//             });
//         }

//         return () => {
//             if (socket) {
//                 socket.off("ROOM_STATUS_CHANGED");
//                 socket.off("ROOM_CREATED");
//             }
//         };
//     }, [socket]);

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
//                                 <h2 className="text-xl font-semibold">
//                                     Room {room.number}
//                                 </h2>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         setEditRoom(room);
//                                     }}
//                                     className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200"
//                                 >
//                                     ✏️ Edit
//                                 </button>
//                             </div>
//                             <p className="mt-2">Type: {room.roomType?.name || "N/A"}</p>
//                             <p>Status: {room.status}</p>
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Popup Add Room */}
//             {showAddModal && (
//                 <AddRoomModal
//                     isOpen={showAddModal}
//                     onClose={() => setShowAddModal(false)}
//                     onSaved={(room) => setRooms(prev => [...prev, room])}
//                     properties={[]} // تمرير قائمة properties إذا كانت موجودة
//                     roomTypes={[]}  // تمرير قائمة roomTypes إذا كانت موجودة
//                     userId={"currentUserId"} // تمرير معرف المستخدم الحالي
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


//             {/* Popup تعديل الغرفة */}
//             {editRoom && (
//                 <EditRoomModal
//                     room={editRoom}
//                     isOpen={!!editRoom}
//                     onClose={() => setEditRoom(null)}
//                     onSaved={(updatedRoom) =>
//                         setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
//                     }
//                     roomTypes={roomTypes}
//                 />
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

    // جلب غرف
    const fetchRooms = async () => {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        setRooms(data);
    };

    // جلب Room Types
    const fetchRoomTypes = async () => {
        const res = await fetch("/api/roomTypes");
        const data = await res.json();
        setRoomTypes(data);
    };

    // جلب Properties
    const fetchProperties = async () => {
        const res = await fetch("/api/properties");
        const data = await res.json();
        setProperties(data);
    };

    useEffect(() => {
        fetchRooms();
        fetchRoomTypes();
        fetchProperties();

        if (socket) {
            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setRooms(prev =>
                    prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r)
                );
            });
            socket.on("ROOM_CREATED", (room) => {
                setRooms(prev => [...prev, room]);
            });
        }

        return () => {
            if (socket) {
                socket.off("ROOM_STATUS_CHANGED");
                socket.off("ROOM_CREATED");
            }
        };
    }, [socket]);

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
                    onSaved={(room) => setRooms(prev => [...prev, room])}
                    properties={properties}       // البيانات من API
                    roomTypes={roomTypes}         // البيانات من API
                    userId={"currentUserId"}
                />
            )}

            {/* Edit Room Modal */}
            {editRoom && (
                <EditRoomModal
                    room={editRoom}
                    isOpen={!!editRoom}
                    onClose={() => setEditRoom(null)}
                    onSaved={(updatedRoom) =>
                        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
                    }
                    roomTypes={roomTypes}
                    properties={properties}
                />
            )}

            {/* Popup التفاصيل */}
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
