// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import { FaStar, FaUser, FaUserTie, FaUserAlt } from "react-icons/fa";
// import AddGuestModal from "@/app/components/AddGuestModal";
// import EditGuestModal from "@/app/components/EditGuestModal";

// export default function GuestsPage({ session, userProperties }) {
//     const [guests, setGuests] = useState([]);
//     const [filteredGuests, setFilteredGuests] = useState([]);
//     const [editGuest, setEditGuest] = useState(null);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [properties, setProperties] = useState(userProperties || []);
//     const [hotelGroups, setHotelGroups] = useState([]);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterProperty, setFilterProperty] = useState("");
//     const [filterHotelGroup, setFilterHotelGroup] = useState("");
//     const socket = useSocket();

//     const userRole = session?.user?.role || "FrontDesk";
//     const canAdd = ["Admin", "FrontDesk"].includes(userRole);
//     const canEdit = ["Admin", "FrontDesk"].includes(userRole);
//     const canDelete = ["Admin"].includes(userRole);
//     const canView = ["Admin", "FrontDesk", "Manager"].includes(userRole);

//     useEffect(() => {
//         if (!canView) return;

// fetchGuests();
// fetchHotelGroups();

//         if (socket) {
//             socket.on("GUEST_CREATED", g => setGuests(prev => [...prev, g]));
//             socket.on("GUEST_UPDATED", g => setGuests(prev => prev.map(gu => gu.id === g.id ? g : gu)));
//             socket.on("GUEST_DELETED", id => setGuests(prev => prev.filter(g => g.id !== id)));
//         }

//         return () => {
//             if (socket) {
//                 socket.off("GUEST_CREATED");
//                 socket.off("GUEST_UPDATED");
//                 socket.off("GUEST_DELETED");
//             }
//         };
//     }, [socket, canView]);

//     useEffect(() => {
//         let filtered = guests;
//         if (searchTerm.trim()) {
//             const term = searchTerm.toLowerCase();
//             filtered = filtered.filter(g =>
//                 g.firstName.toLowerCase().includes(term) ||
//                 g.lastName.toLowerCase().includes(term) ||
//                 (g.passportNumber?.toLowerCase().includes(term)) ||
//                 (g.phone?.toLowerCase().includes(term))
//             );
//         }
//         if (filterProperty) filtered = filtered.filter(g => g.propertyId === filterProperty);
//         if (filterHotelGroup) filtered = filtered.filter(g => g.hotelGroupId === filterHotelGroup);
//         setFilteredGuests(filtered);
//     }, [searchTerm, filterProperty, filterHotelGroup, guests]);

//     const fetchGuests = async () => {
//         const res = await fetch("/api/guests");
//         const data = await res.json();
//         setGuests(data);
//         setFilteredGuests(data);
//     };

//     const fetchHotelGroups = async () => {
//         const res = await fetch("/api/hotelGroups");
//         const data = await res.json();
//         setHotelGroups(data || []);
//     };

//     const getGuestIcon = (guest) => {
//         if (guest.isVIP) return <FaStar className="text-yellow-400" title="VIP" />;
//         if (guest.gender === "Male") return <FaUserTie className="text-blue-500" title="Male" />;
//         if (guest.gender === "Female") return <FaUser className="text-pink-500" title="Female" />;
//         return <FaUserAlt className="text-gray-500" title="Guest" />;
//     };

//     if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

//     return (
//         <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
//                 <div className="flex flex-col w-full md:w-1/4">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
//                     <input type="text" placeholder="Search guests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
//                 </div>
//                 <div className="flex flex-col w-full md:w-1/5">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
//                     <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
//                         <option value="">All Properties</option>
//                         {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>
//                 <div className="flex flex-col w-full md:w-1/5">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Hotel Group</label>
//                     <select value={filterHotelGroup} onChange={e => setFilterHotelGroup(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
//                         <option value="">All Groups</option>
//                         {hotelGroups.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
//                     </select>
//                 </div>
//                 {canAdd && <div className="flex w-full md:w-auto">
//                     <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Guest</button>
//                 </div>}
//             </div>

//             {/* Guests Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {filteredGuests.map(guest => (
//                     <div
//                         key={guest.id}
//                         className="p-4 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
//                     >
//                         {/* Header */}
//                         <div className="flex justify-between items-start mb-2">
//                             <div className="flex items-center gap-2">
//                                 {getGuestIcon(guest)}
//                                 <h2 className="text-lg font-semibold text-gray-700 dark:text-white">
//                                     {guest.firstName} {guest.lastName}
//                                 </h2>
//                             </div>
//                             <div className="flex gap-1">
//                                 {canEdit && (
//                                     <button
//                                         onClick={e => { e.stopPropagation(); setEditGuest(guest); }}
//                                         className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded"
//                                     >
//                                         Edit
//                                     </button>
//                                 )}
//                                 {canDelete && (
//                                     <button
//                                         onClick={async e => {
//                                             e.stopPropagation();
//                                             if (!confirm("Delete this guest?")) return;
//                                             await fetch(`/api/guests/${guest.id}`, { method: "DELETE" });
//                                             setGuests(prev => prev.filter(g => g.id !== guest.id));
//                                         }}
//                                         className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
//                                     >
//                                         Delete
//                                     </button>
//                                 )}
//                             </div>
//                         </div>

//                         {/* KPI / Summary */}
//                         <div className="grid grid-cols-2 gap-2 text-sm">
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Phone</span>
//                                 <span className="font-medium">{guest.phone || "N/A"}</span>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Email</span>
//                                 <span className="font-medium">{guest.email || "N/A"}</span>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Property</span>
//                                 <span className="font-medium">{guest.property?.name || "N/A"}</span>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Hotel Group</span>
//                                 <span className="font-medium">{guest.hotelGroup?.name || "N/A"}</span>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {showAddModal && canAdd && <AddGuestModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} hotelGroups={hotelGroups} />}
//             {editGuest && canEdit && <EditGuestModal guest={editGuest} isOpen={!!editGuest} onClose={() => setEditGuest(null)} onSaved={() => setEditGuest(null)} properties={properties} hotelGroups={hotelGroups} />}
//         </div>
//     );
// }



'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { FaStar, FaUser, FaUserTie, FaUserAlt } from "react-icons/fa";
import AddGuestModal from "@/app/components/AddGuestModal";
import EditGuestModal from "@/app/components/EditGuestModal";
import ConfirmationModal from "@/app/components/ConfirmationModal";

export default function GuestsPage({ session, userProperties }) {
    const [guests, setGuests] = useState([]);
    const [filteredGuests, setFilteredGuests] = useState([]);
    const [editGuest, setEditGuest] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [properties, setProperties] = useState(userProperties || []);
    const [hotelGroups, setHotelGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const [filterHotelGroup, setFilterHotelGroup] = useState("");
    const [loading, setLoading] = useState(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const userRole = session?.user?.role || "FrontDesk";
    const canAdd = ["Admin", "FrontDesk"].includes(userRole);
    const canEdit = ["Admin", "FrontDesk"].includes(userRole);
    const canDelete = ["Admin"].includes(userRole);
    const canView = ["Admin", "FrontDesk", "Manager"].includes(userRole);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const socket = useSocket();

    // Fetch Guests & Hotel Groups
    useEffect(() => {
        if (!canView) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [guestsRes, groupsRes] = await Promise.all([
                    fetch("/api/guests"),
                    // fetch("/api/hotelGroups")
                ]);

                if (!guestsRes.ok) {
                    throw new Error(`Failed to fetch guests: ${guestsRes.status} ${guestsRes.statusText}`);
                }
                // if (!groupsRes.ok) {
                //     throw new Error(`Failed to fetch hotel groups: ${groupsRes.status} ${groupsRes.statusText}`);
                // }

                const guestsData = await guestsRes.json();
                // const groupsData = await groupsRes.json();

                setGuests(guestsData);
                setFilteredGuests(guestsData);
                // setHotelGroups(groupsData || []);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        if (socket) {
            socket.on("GUEST_CREATED", g => setGuests(prev => [...prev, g]));
            socket.on("GUEST_UPDATED", g => setGuests(prev => prev.map(gu => gu.id === g.id ? g : gu)));
            socket.on("GUEST_DELETED", id => setGuests(prev => prev.filter(g => g.id !== id)));
        }

        return () => {
            if (socket) {
                socket.off("GUEST_CREATED");
                socket.off("GUEST_UPDATED");
                socket.off("GUEST_DELETED");
            }
        };
    }, [socket, canView]);

    // Filtering
    useEffect(() => {
        let filtered = guests;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(g =>
                g.firstName.toLowerCase().includes(term) ||
                g.lastName.toLowerCase().includes(term) ||
                (g.passportNumber?.toLowerCase().includes(term)) ||
                (g.phone?.toLowerCase().includes(term))
            );
        }

        if (filterProperty) filtered = filtered.filter(g => g.propertyId === Number(filterProperty));
        if (filterHotelGroup) filtered = filtered.filter(g => g.hotelGroupId === Number(filterHotelGroup));

        setFilteredGuests(filtered);
        setCurrentPage(1); // reset page
    }, [searchTerm, filterProperty, filterHotelGroup, guests]);

    const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

    const paginatedGuests = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredGuests.slice(start, start + itemsPerPage);
    }, [filteredGuests, currentPage]);

    const getGuestIcon = (guest) => {
        if (guest.isVIP) return <FaStar className="text-yellow-400" title="VIP" />;
        if (guest.gender === "Male") return <FaUserTie className="text-blue-500" title="Male" />;
        if (guest.gender === "Female") return <FaUser className="text-pink-500" title="Female" />;
        return <FaUserAlt className="text-gray-500" title="Guest" />;
    };

    const openConfirm = (message, action) => {
        setConfirmMessage(message);
        setPendingAction(() => action);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!pendingAction) return;
        setConfirmLoading(true);
        try {
            await pendingAction();
            setConfirmOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setConfirmLoading(false);
        }
    };

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input type="text" placeholder="Search guests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                    <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Hotel Group</label>
                    <select value={filterHotelGroup} onChange={e => setFilterHotelGroup(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Groups</option>
                        {hotelGroups.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                {canAdd && <div className="flex w-full md:w-auto">
                    <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Guest</button>
                </div>}
            </div>

            {/* Guests Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedGuests.map(guest => (
                            <div
                                key={guest.id}
                                className="p-4 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {getGuestIcon(guest)}
                                        <h2 className="text-lg font-semibold text-gray-700 dark:text-white">
                                            {guest.firstName} {guest.lastName}
                                        </h2>
                                    </div>
                                    <div className="flex gap-1">
                                        {canEdit && <button onClick={e => { e.stopPropagation(); setEditGuest(guest); }} className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded">Edit</button>}
                                        {canDelete && <button onClick={e => { e.stopPropagation(); openConfirm(`هل أنت متأكد من حذف الضيف ${guest.firstName} ${guest.lastName}?`, async () => { await fetch(`/api/guests/${guest.id}`, { method: "DELETE" }); setGuests(prev => prev.filter(g => g.id !== guest.id)); }); }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">Delete</button>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 dark:text-gray-300">Phone</span>
                                        <span className="font-medium">{guest.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 dark:text-gray-300">Email</span>
                                        <span className="font-medium">{guest.email || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 dark:text-gray-300">Property</span>
                                        <span className="font-medium">{guest.property?.name || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 dark:text-gray-300">Hotel Group</span>
                                        <span className="font-medium">{guest.hotelGroup?.name || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50">Prev</button>
                            <span className="px-2 text-sm">Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50">Next</button>
                        </div>
                    )}
                </>
            )}

            {showAddModal && canAdd && <AddGuestModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} hotelGroups={hotelGroups} />}
            {editGuest && canEdit && <EditGuestModal guest={editGuest} isOpen={!!editGuest} onClose={() => setEditGuest(null)} onSaved={() => setEditGuest(null)} properties={properties} hotelGroups={hotelGroups} />}
            <ConfirmationModal open={confirmOpen} message={confirmMessage} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirm} loading={confirmLoading} />
        </div>
    );
}
