"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomRack() {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [roomStatuses, setRoomStatuses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // عدد الغرف في كل صفحة
    const router = useRouter();

    const statusColors = {
        VACANT: "bg-green-500 text-white",
        DIRTY: "bg-red-500 text-white",
        OUT_OF_ORDER: "bg-yellow-500 text-black",
        OCCUPIED: "bg-blue-500 text-white",
    };

    const formatStatus = (status) => {
        switch (status) {
            case "VACANT": return "Clean";
            case "DIRTY": return "Dirty";
            case "OUT_OF_ORDER": return "Out of Service";
            case "OCCUPIED": return "Occupied";
            default: return status;
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            const data = await res.json();
            const all = Array.isArray(data) ? data : [];
            setRooms(all);

            const statuses = [...new Set(all.map(r => r.status).filter(Boolean))];
            setRoomStatuses(statuses);

            const types = [...new Set(all.map(r => r.roomType?.name).filter(Boolean))];
            setRoomTypes(types);
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
            setRooms([]);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const filteredRooms = rooms.filter(room => {
        let valid = true;
        if (filterType) valid = valid && room.roomType?.name === filterType;
        if (filterStatus) valid = valid && room.status === filterStatus;
        return valid;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Room Rack</h2>

            {/* 🔹 الفلاتر */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Room Type</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Room Types</option>
                            {roomTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Status</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Status</option>
                            {roomStatuses.map(s => (
                                <option key={s} value={s}>
                                    {formatStatus(s)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => { setFilterType(""); setFilterStatus(""); setCurrentPage(1); }}
                            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 shadow hover:bg-blue-700 transition"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* الغرف */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {paginatedRooms.map(room => {
                    const config = statusColors[room.status] || "bg-gray-400 text-white";
                    return (
                        <div key={room.id} className={`p-4 rounded-xl shadow-lg flex flex-col items-center justify-between ${config}`}>
                            <h3 className="text-lg font-bold">{room.number}</h3>
                            <p className="text-sm">{room.roomType?.name || "N/A"}</p>
                            <p className="text-xs italic">{formatStatus(room.status)}</p>

                            <div className="mt-2 flex gap-2">
                                {room.bookingId ? (
                                    <button
                                        className="px-2 py-1 bg-white text-black rounded-md text-xs hover:bg-gray-200"
                                        onClick={() => router.push(`/bookings/${room.bookingId}/folio`)}
                                    >
                                        View Booking
                                    </button>
                                ) : (
                                    <button
                                        className="px-2 py-1 bg-white text-black rounded-md text-xs hover:bg-gray-200"
                                        onClick={() => router.push(`/rooms/${room.id}/assign`)}
                                    >
                                        Assign
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-2">
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Prev</button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToPage(i + 1)}
                            className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
}
