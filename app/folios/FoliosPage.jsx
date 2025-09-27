// 'use client';
// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function FoliosPage() {
//     const router = useRouter();
//     const socket = useSocket();

//     const [bookings, setBookings] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const refreshTimeoutRef = useRef(null);

//     // جلب جميع الحجوزات
//     const fetchBookings = async () => {
//         try {
//             setLoading(true);
//             const res = await fetch("/api/bookings");
//             if (!res.ok) throw new Error("Failed to fetch bookings");
//             const data = await res.json();

//             // تصفية لتجنب تكرار الحجوزات الجماعية أو الشركات
//             const uniqueBookings = [];
//             const groupsAdded = new Set();
//             const companiesAdded = new Set();

//             data.forEach(b => {
//                 if (b.groupId) {
//                     if (!groupsAdded.has(b.groupId)) {
//                         uniqueBookings.push({ type: "group", id: b.groupId, name: b.group?.name || "مجموعة" });
//                         groupsAdded.add(b.groupId);
//                     }
//                 } else if (b.companyId) {
//                     if (!companiesAdded.has(b.companyId)) {
//                         uniqueBookings.push({ type: "company", id: b.companyId, name: b.company?.name || "شركة" });
//                         companiesAdded.add(b.companyId);
//                     }
//                 } else {
//                     uniqueBookings.push({ type: "individual", id: b.id, guest: b.guest, room: b.room });
//                 }
//             });

//             setBookings(uniqueBookings);
//         } catch (err) {
//             console.error(err);
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchBookings(); }, []);

//     // ✅ البث socket لتحديث الحجوزات
//     useEffect(() => {
//         if (!socket) return;

//         const handleBookingChange = () => {
//             if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
//             refreshTimeoutRef.current = setTimeout(() => {
//                 fetchBookings();
//                 refreshTimeoutRef.current = null;
//             }, 300);
//         };

//         const events = ["BOOKING_CREATED", "BOOKING_UPDATED", "BOOKING_DELETED"];
//         events.forEach(e => socket.on(e, handleBookingChange));

//         return () => {
//             events.forEach(e => socket.off(e, handleBookingChange));
//             if (refreshTimeoutRef.current) {
//                 clearTimeout(refreshTimeoutRef.current);
//                 refreshTimeoutRef.current = null;
//             }
//         };
//     }, [socket]);

//     if (loading) return <p className="p-4">Loading...</p>;
//     if (error) return <p className="p-4 text-red-500">{error}</p>;

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">All Folios</h1>
//             {bookings.length === 0 && <p>No bookings found.</p>}
//             <ul className="space-y-2">
//                 {bookings.map(b => (
//                     <li key={`${b.type}-${b.id}`}>
//                         <button
//                             className="text-blue-600 hover:underline"
//                             onClick={() => {
//                                 if (b.type === "group") router.push(`/folios/group/${b.id}`);
//                                 else if (b.type === "company") router.push(`/folios/company/${b.id}`);
//                                 else router.push(`/folios/${b.id}`);
//                             }}
//                         >
//                             {b.type === "group" && `Group: ${b.name}`}
//                             {b.type === "company" && `Company: ${b.name}`}
//                             {b.type === "individual" && `${b.guest?.firstName} ${b.guest?.lastName}`}
//                             {b.room?.number && ` - Room: ${b.room.number}`}
//                         </button>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }


// الكود العلى اصلي


'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/components/SocketProvider";
import { FaUsers, FaBuilding, FaUser, FaBed, FaCalendarAlt, FaFilter } from "react-icons/fa";

export default function FoliosPage({ properties, session }) {
    const router = useRouter();
    const socket = useSocket();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterType, setFilterType] = useState(""); // individual/group/company
    const [filterProperty, setFilterProperty] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const refreshTimeoutRef = useRef(null);


        // ✅ صلاحيات حسب الدور
    const role = session?.user?.role || "Guest";
    const canView = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bookings");
            if (!res.ok) throw new Error("Failed to fetch bookings");
            const data = await res.json();

            const uniqueBookings = [];
            const groupsAdded = new Set();
            const companiesAdded = new Set();

            data.forEach(b => {
                if (b.groupId) {
                    if (!groupsAdded.has(b.groupId)) {
                        uniqueBookings.push({
                            type: "group",
                            id: b.groupId,
                            name: b.group?.name || "مجموعة",
                            checkIn: b.checkIn,
                            checkOut: b.checkOut,
                            roomsCount: b.roomsCount || b.rooms?.length || 0,
                            propertyId: b.propertyId
                        });
                        groupsAdded.add(b.groupId);
                    }
                } else if (b.companyId) {
                    if (!companiesAdded.has(b.companyId)) {
                        uniqueBookings.push({
                            type: "company",
                            id: b.companyId,
                            name: b.company?.name || "شركة",
                            checkIn: b.checkIn,
                            checkOut: b.checkOut,
                            roomsCount: b.roomsCount || b.rooms?.length || 0,
                            propertyId: b.propertyId
                        });
                        companiesAdded.add(b.companyId);
                    }
                } else {
                    uniqueBookings.push({
                        type: "individual",
                        id: b.id,
                        guest: b.guest,
                        room: b.room,
                        checkIn: b.checkIn,
                        checkOut: b.checkOut,
                        propertyId: b.propertyId
                    });
                }
            });

            setBookings(uniqueBookings);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    useEffect(() => {
        if (!socket) return;

        const handleBookingChange = () => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = setTimeout(() => {
                fetchBookings();
                refreshTimeoutRef.current = null;
            }, 300);
        };

        const events = ["BOOKING_CREATED", "BOOKING_UPDATED", "BOOKING_DELETED"];
        events.forEach(e => socket.on(e, handleBookingChange));

        return () => {
            events.forEach(e => socket.off(e, handleBookingChange));
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [socket]);

    // تطبيق الفلاتر
    const filteredBookings = bookings.filter(b => {
        const matchesType = filterType ? b.type === filterType : true;
        const matchesProperty = filterProperty ? b.propertyId === filterProperty : true;
        const matchesSearch = searchTerm
            ? (b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.guest?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.guest?.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;
        return matchesType && matchesProperty && matchesSearch;
    });

        if (!canView) {
        return <p className="p-6 text-red-500">🚫 ليس لديك صلاحية لعرض الفواتير</p>;
    }


    if (loading) return <p className="p-6 text-gray-500">Loading bookings...</p>;
    if (error) return <p className="p-6 text-red-500">{error}</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Individual Bookings</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => b.type === "individual").length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Group Bookings</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => b.type === "group").length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Company Bookings</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => b.type === "company").length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Total Bookings</span>
                    <span className="text-2xl font-bold">{bookings.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Type</label>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Types</option>
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                        <option value="company">Company</option>
                    </select>
                </div>

                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                    <select
                        value={filterProperty}
                        onChange={e => setFilterProperty(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Properties</option>
                        {properties?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

            </div>

            {filteredBookings.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No bookings found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map(b => {
                        const formatDate = (dateStr) => {
                            if (!dateStr) return "";
                            const d = new Date(dateStr);
                            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                        };

                        const typeConfig = {
                            individual: { label: "Individual", icon: <FaUser className="text-blue-500 w-5 h-5" />, badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100" },
                            group: { label: "Group", icon: <FaUsers className="text-green-500 w-5 h-5" />, badgeColor: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100" },
                            company: { label: "Company", icon: <FaBuilding className="text-purple-500 w-5 h-5" />, badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100" }
                        };

                        const config = typeConfig[b.type] || {};

                        return (
                            <div
                                key={`${b.type}-${b.id}`}
                                onClick={() => {
                                    if (b.type === "group") router.push(`/folios/group/${b.id}`);
                                    else if (b.type === "company") router.push(`/folios/company/${b.id}`);
                                    else router.push(`/folios/${b.id}`);
                                }}
                                className="cursor-pointer rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 flex flex-col justify-between p-6 bg-white dark:bg-gray-800"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                                        {b.type === "individual" ? `${b.guest?.firstName} ${b.guest?.lastName}` : b.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                            {config.icon}
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.badgeColor}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex flex-col gap-2 text-gray-700 dark:text-gray-200 text-sm">
                                    {b.type === "individual" && b.room?.number && (
                                        <p><FaBed className="inline mr-2 text-gray-500 dark:text-gray-400" /> Room: {b.room.number}</p>
                                    )}
                                    {b.type !== "individual" && (
                                        <p><FaBed className="inline mr-2 text-gray-500 dark:text-gray-400" /> Rooms: {b.roomsCount || 0}</p>
                                    )}
                                    {b.checkIn && b.checkOut && (
                                        <p><FaCalendarAlt className="inline mr-2 text-gray-500 dark:text-gray-400" /> {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                                    )}
                                    {b.status && (
                                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full 
                                ${b.status === "Paid"
                                                ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                                                : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"}`}>
                                            {b.status}
                                        </span>
                                    )}
                                </div>

                                {/* Footer / Action */}
                                <div className="mt-4 flex justify-end">
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shadow-sm">
                                        View Folio
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}




        </div>
    );
}


