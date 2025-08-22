// 'use client';
// import { useState, useEffect } from 'react';
// import { CheckCircleIcon, XCircleIcon, WrenchIcon, SparklesIcon } from '@heroicons/react/24/solid';

// export default function RoomsPage() {
//     const [rooms, setRooms] = useState([]);
//     const [selectedRoom, setSelectedRoom] = useState(null);

//     useEffect(() => {
//         const fetchRooms = async () => {
//             const res = await fetch('/api/rooms');
//             const data = await res.json();
//             setRooms(data);
//         };
//         fetchRooms();
//     }, []);

//     const getStatusConfig = (status) => {
//         switch (status) {
//             case 'Available':
//                 return {
//                     text: 'Available',
//                     color: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200',
//                     icon: <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
//                 };
//             case 'Occupied':
//                 return {
//                     text: 'Occupied',
//                     color: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
//                     icon: <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-300" />
//                 };
//             case 'Maintenance':
//                 return {
//                     text: 'Maintenance',
//                     color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200',
//                     icon: <WrenchIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
//                 };
//             case 'Cleaning':
//                 return {
//                     text: 'Cleaning',
//                     color: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200',
//                     icon: <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
//                 };
//             default:
//                 return {
//                     text: 'Unknown',
//                     color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
//                     icon: null
//                 };
//         }
//     };

//     return (
//         <div className="p-6 space-y-6">
//             {/* Header */}
//             <div className="flex justify-between items-center">
//                 <h1 className="text-2xl font-bold">Rooms</h1>
//                 <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
//                     + Add Room
//                 </button>
//             </div>

//             {/* Rooms Grid */}
//             <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
//                 {rooms.map(room => {
//                     const status = getStatusConfig(room.status);
//                     return (
//                         <div
//                             key={room.id}
//                             className={`rounded-2xl shadow hover:shadow-lg transition p-4 border-l-4 ${status.color}`}
//                         >
//                             <div className="flex justify-between items-center mb-3">
//                                 <h2 className="text-lg font-bold">Room {room.number}</h2>
//                                 <div className="flex items-center gap-1 text-sm font-medium">
//                                     {status.icon}
//                                     {status.text}
//                                 </div>
//                             </div>
//                             <p className="text-gray-700 dark:text-gray-300">
//                                 Type: <span className="font-semibold">{room.roomType?.name}</span>
//                             </p>
//                             <p className="text-gray-700 dark:text-gray-300">
//                                 Price: <span className="font-semibold">${room.roomType?.price}</span> / night
//                             </p>

//                             <div className="flex justify-between mt-4">
//                                 <button className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
//                                     Edit
//                                 </button>
//                                 <button
//                                     className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                                     onClick={() => setSelectedRoom(room)}
//                                 >
//                                     Details
//                                 </button>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Modal */}
//             {selectedRoom && (
//                 <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//                     <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg max-w-md w-full">
//                         <h2 className="text-xl font-bold mb-4">Room {selectedRoom.number} Details</h2>
//                         <p><span className="font-semibold">Type:</span> {selectedRoom.roomType?.name}</p>
//                         <p><span className="font-semibold">Price:</span> ${selectedRoom.roomType?.price} / night</p>
//                         <p><span className="font-semibold">Status:</span> {selectedRoom.status}</p>
//                         <p><span className="font-semibold">Description:</span> {selectedRoom.roomType?.description || "No description"}</p>

//                         <div className="mt-6 flex justify-end">
//                             <button
//                                 className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//                                 onClick={() => setSelectedRoom(null)}
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

export default function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [editRoom, setEditRoom] = useState(null);
    const socket = useSocket();

    const fetchRooms = async () => {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        setRooms(data);
    };

    useEffect(() => {
        fetchRooms();

        if (socket) {
            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setRooms(prev =>
                    prev.map(r =>
                        r.id === roomId ? { ...r, status: newStatus } : r
                    )
                );
            });
        }

        return () => {
            if (socket) socket.off("ROOM_STATUS_CHANGED");
        };
    }, [socket]);

    const statusConfig = {
        AVAILABLE: { bg: "bg-green-500", text: "text-white" },
        OCCUPIED: { bg: "bg-red-500", text: "text-white" },
        CLEANING: { bg: "bg-yellow-400", text: "text-black" },
        MAINTENANCE: { bg: "bg-blue-500", text: "text-white" },
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => {
                const config = statusConfig[room.status] || { bg: "bg-gray-300", text: "text-black" };

                return (
                    <div
                        key={room.id}
                        className={`p-4 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${config.bg} ${config.text}`}
                        onClick={() => setSelectedRoom(room)}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                Room {room.number}
                            </h2>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // منع فتح التفاصيل
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

            {/* Popup التعديل */}
            {editRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Edit Room {editRoom.number}</h2>
                        {/* هنا تحط فورم التعديل */}
                        <p>يمكنك تعديل بيانات الغرفة هنا...</p>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setEditRoom(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

