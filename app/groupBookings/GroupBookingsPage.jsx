// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import AddGroupBookingModal from "@/app/components/AddGroupBookingModal";
// import EditGroupBookingModal from "@/app/components/EditGroupBookingModal";
// import { useRouter } from "next/navigation";

// export default function GroupBookingsPage({ session, userProperties, groups, roomBlocks }) {
//     const router = useRouter();
//     const [bookings, setBookings] = useState([]);
//     const [selectedBooking, setSelectedBooking] = useState(null);
//     const [editBooking, setEditBooking] = useState(null);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [filterGroupId, setFilterGroupId] = useState(groups?.[0]?.id || "");
//     const [searchTerm, setSearchTerm] = useState("");
//     const [dateFrom, setDateFrom] = useState("");
//     const [dateTo, setDateTo] = useState("");
//     const socket = useSocket();

//     const role = session?.user?.role || "Guest";
//     const canAdd = ["Admin", "FrontDesk"].includes(role);
//     const canEdit = ["Admin", "FrontDesk"].includes(role);
//     const canDelete = ["Admin"].includes(role);
//     const canCheckinCheckout = ["Admin", "FrontDesk"].includes(role);
//     const canCancelNoshow = ["Admin", "FrontDesk"].includes(role);
//     const canFolio = ["Admin", "FrontDesk", "Manager"].includes(role);

//     const fetchBookings = async () => {
//         if (!filterGroupId) return;
//         try {
//             const params = new URLSearchParams({ groupId: filterGroupId });
//             if (searchTerm) params.append("search", searchTerm);
//             if (dateFrom) params.append("from", dateFrom);
//             if (dateTo) params.append("to", dateTo);

//             const res = await fetch(`/api/groupBookings?${params.toString()}`);
//             const data = await res.json();
//             setBookings(Array.isArray(data) ? data : []);
//         } catch { setBookings([]); }
//     };

//     useEffect(() => {
//         fetchBookings();
//         if (!socket) return;

//         socket.on("GROUPBOOKING_CREATED", b => setBookings(prev => [b, ...prev]));
//         socket.on("GROUPBOOKING_UPDATED", b => setBookings(prev => prev.map(x => x.id === b.id ? b : x)));
//         socket.on("GROUPBOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(b => b.id !== id)));

//         return () => {
//             socket.off("GROUPBOOKING_CREATED");
//             socket.off("GROUPBOOKING_UPDATED");
//             socket.off("GROUPBOOKING_DELETED");
//         };
//     }, [socket, filterGroupId]);

//     useEffect(() => {
//         const delay = setTimeout(fetchBookings, 400);
//         return () => clearTimeout(delay);
//     }, [filterGroupId, searchTerm, dateFrom, dateTo]);

//     const handleAction = async (id, action) => {
//         if ((action === "delete" && !canDelete) ||
//             (["checkin","checkout"].includes(action) && !canCheckinCheckout) ||
//             (["cancel","noshow"].includes(action) && !canCancelNoshow))
//             return alert("ليس لديك صلاحية لهذا الإجراء");

//         if (action === "delete" && !confirm("هل أنت متأكد من حذف الحجز؟")) return;

//         try {
//             const method = action === "delete" ? "DELETE" : "POST";
//             const res = await fetch(`/api/groupBookings/${id}/${action === "delete" ? "" : action}`, { method });
//             if (!res.ok) throw new Error("فشل الإجراء");
//             const data = action !== "delete" ? await res.json() : null;
//             setBookings(prev => action === "delete" ? prev.filter(b => b.id !== id) : prev.map(b => b.id === data.id ? data : b));
//         } catch (err) { alert(err.message); }
//     };

//     const calculateGrandTotal = (booking) => {
//         if (!booking?.folio) return 0;
//         const chargesTotal = (booking.folio.charges || []).reduce((sum, c) => sum + Number(c.amount || 0)*(1+Number(c.tax||0)/100),0);
//         const paymentsTotal = (booking.folio.payments || []).reduce((sum,p)=>sum+Number(p.amount||0),0);
//         return chargesTotal - paymentsTotal;
//     };

//     return (
//         <div className="p-6">
//             {/* Filters & Actions */}
//             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
//                 <h1 className="text-2xl font-bold">Group Bookings</h1>
//                 <div className="flex flex-wrap gap-2 items-center">
//                     <select value={filterGroupId} onChange={e=>setFilterGroupId(e.target.value)} className="px-3 py-2 border rounded">
//                         {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                     </select>
//                     <input type="text" placeholder="🔍 Search Guest / Room / Status..." value={searchTerm}
//                         onChange={e=>setSearchTerm(e.target.value)} className="px-3 py-2 border rounded" />
//                     <label>From</label>
//                     <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="px-3 py-2 border rounded" />
//                     <label>To</label>
//                     <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="px-3 py-2 border rounded" />
//                     {canAdd && <button onClick={()=>setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Booking</button>}
//                 </div>
//             </div>

//             {/* Bookings Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {bookings.length ? bookings.map(b => (
//                     <div key={b.id} className="p-4 rounded-lg shadow cursor-pointer bg-white hover:scale-105 transition" onClick={()=>setSelectedBooking(b)}>
//                         <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
//                         <p><b>Group:</b> {b.group?.name}</p>
//                         <p><b>Room:</b> {b.room?.number || "N/A"}</p>
//                         <p><b>Room Block:</b> {b.roomBlock?.name || "N/A"}</p>
//                         <p><b>Status:</b> {b.status}</p>
//                         <p><b>Check-In:</b> {new Date(b.checkIn).toLocaleDateString()}</p>
//                         <p><b>Check-Out:</b> {new Date(b.checkOut).toLocaleDateString()}</p>
//                         <p><b>Grand Total:</b> ${calculateGrandTotal(b).toFixed(2)}</p>
//                         <div className="flex gap-1 flex-wrap mt-2">
//                             {canEdit && <button onClick={e=>{e.stopPropagation();setEditBooking(b)}} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">Edit</button>}
//                             {canCheckinCheckout && <button onClick={e=>{e.stopPropagation();handleAction(b.id,"checkin")}} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">Check-in</button>}
//                             {canCheckinCheckout && <button onClick={e=>{e.stopPropagation();handleAction(b.id,"checkout")}} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Check-out</button>}
//                             {canCancelNoshow && <button onClick={e=>{e.stopPropagation();handleAction(b.id,"cancel")}} className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs">Cancel</button>}
//                             {canCancelNoshow && <button onClick={e=>{e.stopPropagation();handleAction(b.id,"noshow")}} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">NoShow</button>}
//                             {canDelete && <button onClick={e=>{e.stopPropagation();handleAction(b.id,"delete")}} className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs">Delete</button>}
//                             {canFolio && <button onClick={e=>{e.stopPropagation();router.push(`/bookings/${b.id}/folio`)}} className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-xs">Folio</button>}
//                         </div>
//                     </div>
//                 )) : <p className="col-span-full text-center text-gray-500">لا توجد نتائج 🔍</p>}
//             </div>

//             {/* Modals */}
//             {showAddModal && canAdd && 
//                 <AddGroupBookingModal 
//                     isOpen={showAddModal} 
//                     onClose={()=>setShowAddModal(false)} 
//                     groups={groups} 
//                     properties={userProperties} 
//                     roomBlocks={roomBlocks} 
//                 />}
//             {editBooking && canEdit && 
//                 <EditGroupBookingModal 
//                     booking={editBooking} 
//                     isOpen={!!editBooking} 
//                     onClose={()=>setEditBooking(null)} 
//                     groups={groups} 
//                     properties={userProperties} 
//                     roomBlocks={roomBlocks} 
//                 />}

//             {/* Selected Booking Details */}
//             {selectedBooking && 
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
//                     <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
//                         <h2 className="text-xl font-bold mb-4">{selectedBooking.guest?.firstName} {selectedBooking.guest?.lastName}</h2>
//                         <p><b>Group:</b> {selectedBooking.group?.name}</p>
//                         <p><b>Room:</b> {selectedBooking.room?.number || "N/A"}</p>
//                         <p><b>Room Block:</b> {selectedBooking.roomBlock?.name || "N/A"}</p>
//                         <p><b>Check-In:</b> {new Date(selectedBooking.checkIn).toLocaleString()}</p>
//                         <p><b>Check-Out:</b> {new Date(selectedBooking.checkOut).toLocaleString()}</p>
//                         <p><b>Status:</b> {selectedBooking.status}</p>
//                         <p><b>Adults:</b> {selectedBooking.adults}</p>
//                         <p><b>Children:</b> {selectedBooking.children}</p>
//                         <p><b>Rate Plan:</b> {selectedBooking.ratePlan?.name || "N/A"}</p>
//                         <p><b>Company:</b> {selectedBooking.company?.name || "N/A"}</p>
//                         <p><b>Extras:</b> {(selectedBooking.extras?.length || 0)}</p>
//                         <p><b>Grand Total:</b> ${calculateGrandTotal(selectedBooking).toFixed(2)}</p>
//                         <div className="mt-4 text-right">
//                             <button onClick={()=>setSelectedBooking(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
//                         </div>
//                     </div>
//                 </div>
//             }
//         </div>
//     );
// }





'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddGroupBookingModal from "@/app/components/AddGroupBookingModal";
import EditGroupBookingModal from "@/app/components/EditGroupBookingModal";
import { useRouter } from "next/navigation";

export default function GroupBookingsPage({ session, userProperties, groups, roomBlocks }) {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editBooking, setEditBooking] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterGroupId, setFilterGroupId] = useState(groups?.[0]?.id || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const socket = useSocket();

    const role = session?.user?.role || "Guest";
    const canAdd = ["Admin", "FrontDesk"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);
    const canCheckinCheckout = ["Admin", "FrontDesk"].includes(role);
    const canCancelNoshow = ["Admin", "FrontDesk"].includes(role);
    const canFolio = ["Admin", "FrontDesk", "Manager"].includes(role);

    const fetchBookings = async () => {
        if (!filterGroupId) return;
        try {
            const params = new URLSearchParams({ groupId: filterGroupId });
            if (searchTerm) params.append("search", searchTerm);
            if (dateFrom) params.append("from", dateFrom);
            if (dateTo) params.append("to", dateTo);

            const res = await fetch(`/api/groupBookings?${params.toString()}`);
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch {
            setBookings([]);
        }
    };

    useEffect(() => {
        fetchBookings();
        if (!socket) return;

        socket.on("GROUPBOOKING_CREATED", b => setBookings(prev => [b, ...prev]));
        socket.on("GROUPBOOKING_UPDATED", b => setBookings(prev => prev.map(x => x.id === b.id ? b : x)));
        socket.on("GROUPBOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(b => b.id !== id)));

        return () => {
            socket.off("GROUPBOOKING_CREATED");
            socket.off("GROUPBOOKING_UPDATED");
            socket.off("GROUPBOOKING_DELETED");
        };
    }, [socket, filterGroupId]);

    useEffect(() => {
        const delay = setTimeout(fetchBookings, 400);
        return () => clearTimeout(delay);
    }, [filterGroupId, searchTerm, dateFrom, dateTo]);

    const handleAction = async (id, action) => {
        if ((action === "delete" && !canDelete) ||
            (["checkin", "checkout"].includes(action) && !canCheckinCheckout) ||
            (["cancel", "noshow"].includes(action) && !canCancelNoshow))
            return alert("ليس لديك صلاحية لهذا الإجراء");

        if (action === "delete" && !confirm("هل أنت متأكد من حذف الحجز؟")) return;

        try {
            const method = action === "delete" ? "DELETE" : "POST";
            const res = await fetch(`/api/groupBookings/${id}/${action === "delete" ? "" : action}`, { method });
            if (!res.ok) throw new Error("فشل الإجراء");
            const data = action !== "delete" ? await res.json() : null;
            setBookings(prev =>
                action === "delete"
                    ? prev.filter(b => b.id !== id)
                    : prev.map(b => b.id === data.id ? data : b)
            );
        } catch (err) { alert(err.message); }
    };

    const calculateGrandTotal = (booking) => {
        if (!booking?.folio) return 0;
        const chargesTotal = (booking.folio.charges || []).reduce((sum, c) => sum + Number(c.amount || 0) * (1 + Number(c.tax || 0) / 100), 0);
        const paymentsTotal = (booking.folio.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return chargesTotal - paymentsTotal;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow items-end">
                {/* Group */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Group</label>
                    <select
                        value={filterGroupId}
                        onChange={e => setFilterGroupId(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                    >
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>

                {/* Search */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search Guest / Room / Status..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Start Date */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* End Date */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Add Booking */}
                {canAdd && (
                    <div className="flex items-end">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                        >
                            + Add Booking
                        </button>
                    </div>
                )}
            </div>

            {/* Bookings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.length > 0 ? (
                    bookings.map(b => (
                        <div
                            key={b.id}
                            className="p-4 rounded-2xl shadow-lg cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105 hover:shadow-xl flex flex-col justify-between"
                            onClick={() => setSelectedBooking(b)}
                        >
                            {/* Header: Guest Name & Status */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {b.guest?.firstName} {b.guest?.lastName}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        {b.group?.name || b.property?.name}
                                    </p>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs rounded ${b.status === "CHECKED_IN"
                                            ? "bg-green-500 text-white"
                                            : b.status === "CHECKED_OUT"
                                                ? "bg-blue-500 text-white"
                                                : b.status === "CANCELLED" || b.status === "NOSHOW"
                                                    ? "bg-red-500 text-white"
                                                    : "bg-yellow-500 text-white"
                                        }`}
                                >
                                    {b.status}
                                </span>
                            </div>

                            {/* KPI / Summary */}
                            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Room</span>
                                    <span className="font-medium">{b.room?.number || "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Guests</span>
                                    <span className="font-medium">{b.adults} Adults, {b.children} Children</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Check-In</span>
                                    <span className="font-medium">{new Date(b.checkIn).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Check-Out</span>
                                    <span className="font-medium">{new Date(b.checkOut).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col col-span-2">
                                    <span className="text-gray-400 dark:text-gray-300">Grand Total</span>
                                    <span className="font-bold">${calculateGrandTotal(b).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Footer: Actions */}
                            <div className="flex gap-1 flex-wrap mt-3">
                                {canEdit && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditBooking(b); }}
                                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                                    >
                                        Edit
                                    </button>
                                )}
                                {canCheckinCheckout && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction(b.id, "checkin"); }}
                                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                    >
                                        Check-in
                                    </button>
                                )}
                                {canCheckinCheckout && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction(b.id, "checkout"); }}
                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                    >
                                        Check-out
                                    </button>
                                )}
                                {canCancelNoshow && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction(b.id, "cancel"); }}
                                        className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {canCancelNoshow && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction(b.id, "noshow"); }}
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    >
                                        NoShow
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction(b.id, "delete"); }}
                                        className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs"
                                    >
                                        Delete
                                    </button>
                                )}
                                {canFolio && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${b.id}/folio`); }}
                                        className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-xs"
                                    >
                                        Folio
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">لا توجد نتائج 🔍</p>
                )}

            </div>

            {/* Modals */}
            {showAddModal && canAdd &&
                <AddGroupBookingModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    groups={groups}
                    properties={userProperties}
                    roomBlocks={roomBlocks}
                />}
            {editBooking && canEdit &&
                <EditGroupBookingModal
                    booking={editBooking}
                    isOpen={!!editBooking}
                    onClose={() => setEditBooking(null)}
                    groups={groups}
                    properties={userProperties}
                    roomBlocks={roomBlocks}
                />}

            {/* Selected Booking Details */}
            {selectedBooking &&
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-white dark:bg-gray-900 dark:text-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{selectedBooking.guest?.firstName} {selectedBooking.guest?.lastName}</h2>
                        <p><b>Group:</b> {selectedBooking.group?.name}</p>
                        <p><b>Room:</b> {selectedBooking.room?.number || "N/A"}</p>
                        <p><b>Room Block:</b> {selectedBooking.roomBlock?.name || "N/A"}</p>
                        <p><b>Check-In:</b> {new Date(selectedBooking.checkIn).toLocaleString()}</p>
                        <p><b>Check-Out:</b> {new Date(selectedBooking.checkOut).toLocaleString()}</p>
                        <p><b>Status:</b> {selectedBooking.status}</p>
                        <p><b>Adults:</b> {selectedBooking.adults}</p>
                        <p><b>Children:</b> {selectedBooking.children}</p>
                        <p><b>Rate Plan:</b> {selectedBooking.ratePlan?.name || "N/A"}</p>
                        <p><b>Company:</b> {selectedBooking.company?.name || "N/A"}</p>
                        <p><b>Extras:</b> {(selectedBooking.extras?.length || 0)}</p>
                        <p className="font-semibold text-green-600 dark:text-green-400"><b>Grand Total:</b> ${calculateGrandTotal(selectedBooking).toFixed(2)}</p>
                        <div className="mt-4 text-right">
                            <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}
