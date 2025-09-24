// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import AddBookingModal from "@/app/components/AddBookingModal";
// import EditBookingModal from "@/app/components/EditBookingModal";
// import BulkBookingModal from "@/app/components/BulkBookingModal";
// import { useRouter } from "next/navigation";

// export default function BookingsPage({ session, userProperties }) {
//     const router = useRouter();
//     const [bookings, setBookings] = useState([]);
//     const [selectedBooking, setSelectedBooking] = useState(null);
//     const [editBooking, setEditBooking] = useState(null);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [showBulkModal, setShowBulkModal] = useState(false);
//     const [properties, setProperties] = useState([]);
//     const [guests, setGuests] = useState([]);
//     const [rooms, setRooms] = useState([]);
//     const [ratePlans, setRatePlans] = useState([]);
//     const [companies, setCompanies] = useState([]);
//     const [groups, setGroups] = useState([]);
//     const [processingId, setProcessingId] = useState(null);

//     const [searchTerm, setSearchTerm] = useState("");
//     const [dateFrom, setDateFrom] = useState("");
//     const [dateTo, setDateTo] = useState("");

//     const socket = useSocket();
//     const role = session?.user?.role || "Guest"; // دور المستخدم

//     const canAdd = ["Admin", "FrontDesk"].includes(role);
//     const canEdit = ["Admin", "FrontDesk"].includes(role);
//     const canDelete = ["Admin"].includes(role);
//     const canCheckinCheckout = ["Admin", "FrontDesk"].includes(role);
//     const canCancelNoshow = ["Admin", "FrontDesk"].includes(role);
//     const canFolio = ["Admin", "FrontDesk", "Manager"].includes(role);

//     // 🔍 جلب الحجوزات
//     const fetchBookings = async (search = "", from = "", to = "") => {
//         try {
//             const params = new URLSearchParams();
//             if (search) params.append("search", search);
//             if (from) params.append("from", from);
//             if (to) params.append("to", to);

//             const res = await fetch(`/api/bookings?${params.toString()}`);
//             const data = await res.json();
//             setBookings(Array.isArray(data) ? data : []);
//         } catch {
//             setBookings([]);
//         }
//     };


//     useEffect(() => {
//         fetchBookings();
//         fetchProperties();
//         fetchGuests();
//         fetchRooms();
//         fetchRatePlans();
//         fetchCompanies();
//         fetchGroups();

//         if (!socket) return;
//         socket.on("BOOKING_CREATED", (freshBooking) => setBookings(prev => [...prev, freshBooking]));
//         socket.on("BOOKING_UPDATED", (updatedBooking) => setBookings(prev =>
//             prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
//         ));
//         socket.on("BOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(b => b.id !== id)));

//         return () => {
//             socket.off("BOOKING_CREATED");
//             socket.off("BOOKING_UPDATED");
//             socket.off("BOOKING_DELETED");
//         };
//     }, [socket]);

//     useEffect(() => {
//         const delay = setTimeout(() => {
//             fetchBookings(searchTerm, dateFrom, dateTo);
//         }, 400);
//         return () => clearTimeout(delay);
//     }, [searchTerm, dateFrom, dateTo]);

//     const fetchProperties = async () => { try { setProperties(await (await fetch("/api/properties")).json()); } catch { setProperties([]); } };
//     const fetchGuests = async () => { try { setGuests(await (await fetch("/api/guests")).json()); } catch { setGuests([]); } };
//     const fetchRooms = async () => { try { setRooms(await (await fetch("/api/rooms")).json()); } catch { setRooms([]); } };
//     const fetchRatePlans = async () => { try { setRatePlans(await (await fetch("/api/ratePlans")).json()); } catch { setRatePlans([]); } };
//     const fetchCompanies = async () => { try { setCompanies(await (await fetch("/api/companies")).json()); } catch { setCompanies([]); } };

//     const fetchGroups = async () => {
//         try {
//             const res = await fetch('/api/groups');
//             const data = await res.json();
//             setGroups(Array.isArray(data) ? data : []);
//         } catch (err) {
//             console.error('Failed to fetch groups:', err);
//             setGroups([]);
//         }
//     };


//     const handleAction = async (id, action) => {
//         // صلاحيات
//         if (action === "delete" && !canDelete) return alert("ليس لديك صلاحية لحذف الحجز");
//         if ((action === "checkin" || action === "checkout") && !canCheckinCheckout) return alert("ليس لديك صلاحية لهذا الإجراء");
//         if ((action === "cancel" || action === "noshow") && !canCancelNoshow) return alert("ليس لديك صلاحية لهذا الإجراء");

//         if (action === "delete" && !confirm("هل أنت متأكد من حذف الحجز؟")) return;

//         setProcessingId(id);
//         try {
//             const method = action === "delete" ? "DELETE" : "POST";
//             const res = await fetch(`/api/bookings/${id}/${action === "delete" ? "" : action}`, { method });
//             if (!res.ok) {
//                 const errBody = await res.json().catch(() => ({}));
//                 const msg = errBody?.error || `${action} failed`;
//                 throw new Error(msg);
//             }
//             const data = action === "delete" ? null : await res.json();

//             if (action === "delete") setBookings(prev => prev.filter(b => b.id !== id));
//             else setBookings(prev => prev.map(b => b.id === data.id ? data : b));
//         } catch (err) {
//             console.error(err);
//             alert(err.message || "Operation failed");
//         } finally {
//             setProcessingId(null);
//         }
//     };

//     // ======== حساب Grand Total مثل Opera Cloud ========
//     const calculateGrandTotal = (booking) => {
//         if (!booking?.folio) return 0;

//         // مجموع Charges مع احتساب الضريبة كنسبة مئوية
//         const chargesTotal = (booking.folio.charges || []).reduce((sum, c) => {
//             const amount = Number(c.amount || 0);
//             const taxPercent = Number(c.tax || 0);
//             const taxValue = (amount * taxPercent) / 100;
//             return sum + amount + taxValue;
//         }, 0);

//         // مجموع المدفوعات
//         const paymentsTotal = (booking.folio.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

//         // Grand Total
//         return chargesTotal - paymentsTotal;
//     };



//     return (
//         <div className="p-6">
//             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
//                 <h1 className="text-2xl font-bold dark:text-white">Bookings</h1>

//                 <div className="flex gap-2 flex-wrap">
//                     <input type="text" placeholder="🔍 Search bookings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//                         className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
//                     />
//                     <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
//                     <label htmlFor="">الى</label>
//                     <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
//                     <label htmlFor="">من</label>

//                     {canAdd && <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Booking</button>}
//                     {canAdd && <button onClick={() => setShowBulkModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">+ Bulk Booking</button>}
//                 </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {bookings.length > 0 ? (
//                     bookings.map(b => (
//                         <div key={b.id} className="p-4 rounded-lg shadow cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105" onClick={() => setSelectedBooking(b)}>
//                             <div className="flex justify-between items-center mb-2">
//                                 <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
//                                 <div className="flex gap-1 flex-wrap">
//                                     {canEdit && <button onClick={e => { e.stopPropagation(); setEditBooking(b); }} className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200">✏️ Edit</button>}
//                                     {canCheckinCheckout && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "checkin"); }} className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600">Check-in</button>}
//                                     {canCheckinCheckout && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "checkout"); }} className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Check-out</button>}
//                                     {canCancelNoshow && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "cancel"); }} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600">Cancel</button>}
//                                     {canCancelNoshow && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "noshow"); }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">NoShow</button>}
//                                     {canDelete && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "delete"); }} className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800">🗑 Delete</button>}
//                                     {canFolio && <button onClick={e => { e.stopPropagation(); router.push(`/bookings/${b.id}/folio`); }} className="text-xs px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600">Folio</button>}
//                                 </div>
//                             </div>
//                             <p><b>Room:</b> {b.room?.number || "N/A"}</p>
//                             <p><b>Check-In:</b> {new Date(b.checkIn).toLocaleDateString()}</p>
//                             <p><b>Check-Out:</b> {new Date(b.checkOut).toLocaleDateString()}</p>
//                             <p><b>Status:</b> {b.status}</p>
//                             <p><b>Grand Total:</b> ${calculateGrandTotal(b).toFixed(2)}</p>
//                         </div>
//                     ))
//                 ) : (
//                     <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
//                 )}
//             </div>

//             {showAddModal && canAdd && <AddBookingModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} groups={groups} />}
//             {showBulkModal && canAdd && <BulkBookingModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
//             {editBooking && canEdit && <EditBookingModal booking={editBooking} isOpen={!!editBooking} onClose={() => setEditBooking(null)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}

//             {selectedBooking && canFolio && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
//                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
//                         <h2 className="text-xl font-bold mb-4">{selectedBooking.guest?.firstName} {selectedBooking.guest?.lastName}</h2>
//                         <p><b>Property:</b> {selectedBooking.property?.name}</p>
//                         <p><b>Room:</b> {selectedBooking.room?.number || "N/A"}</p>
//                         <p><b>Check-In:</b> {new Date(selectedBooking.checkIn).toLocaleString()}</p>
//                         <p><b>Check-Out:</b> {new Date(selectedBooking.checkOut).toLocaleString()}</p>
//                         <p><b>Status:</b> {selectedBooking.status}</p>
//                         <p><b>Adults:</b> {selectedBooking.adults}</p>
//                         <p><b>Children:</b> {selectedBooking.children}</p>
//                         <p><b>Rate Plan:</b> {selectedBooking.ratePlan?.name || "N/A"}</p>
//                         <p><b>Company:</b> {selectedBooking.company?.name || "N/A"}</p>
//                         <p><b>Special Requests:</b> {selectedBooking.specialRequests || "None"}</p>
//                         <p><b>Grand Total:</b> ${calculateGrandTotal(selectedBooking).toFixed(2)}</p>
//                         <div className="mt-4 text-right">
//                             <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
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
import AddBookingModal from "@/app/components/AddBookingModal";
import EditBookingModal from "@/app/components/EditBookingModal";
import BulkBookingModal from "@/app/components/BulkBookingModal";
import { useRouter } from "next/navigation";
import { FaUser, FaBed, FaCalendarCheck, FaDollarSign, FaClipboardList } from "react-icons/fa";

export default function BookingsPage({ session, userProperties }) {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editBooking, setEditBooking] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [properties, setProperties] = useState([]);
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [ratePlans, setRatePlans] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [groups, setGroups] = useState([]);
    const [processingId, setProcessingId] = useState(null);

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

    // Fetch functions
    const fetchBookings = async (search = "", from = "", to = "") => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (from) params.append("from", from);
            if (to) params.append("to", to);

            const res = await fetch(`/api/bookings?${params.toString()}`);
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch {
            setBookings([]);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchProperties();
        fetchGuests();
        fetchRooms();
        fetchRatePlans();
        fetchCompanies();
        fetchGroups();

        if (!socket) return;
        socket.on("BOOKING_CREATED", (b) => setBookings(prev => [...prev, b]));
        socket.on("BOOKING_UPDATED", (b) => setBookings(prev => prev.map(bb => bb.id === b.id ? b : bb)));
        socket.on("BOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(bb => bb.id !== id)));

        return () => {
            socket.off("BOOKING_CREATED");
            socket.off("BOOKING_UPDATED");
            socket.off("BOOKING_DELETED");
        };
    }, [socket]);

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchBookings(searchTerm, dateFrom, dateTo);
        }, 400);
        return () => clearTimeout(delay);
    }, [searchTerm, dateFrom, dateTo]);

    const fetchProperties = async () => { try { setProperties(await (await fetch("/api/properties")).json()); } catch { setProperties([]); } };
    const fetchGuests = async () => { try { setGuests(await (await fetch("/api/guests")).json()); } catch { setGuests([]); } };
    const fetchRooms = async () => { try { setRooms(await (await fetch("/api/rooms")).json()); } catch { setRooms([]); } };
    const fetchRatePlans = async () => { try { setRatePlans(await (await fetch("/api/ratePlans")).json()); } catch { setRatePlans([]); } };
    const fetchCompanies = async () => { try { setCompanies(await (await fetch("/api/companies")).json()); } catch { setCompanies([]); } };
    const fetchGroups = async () => { try { const res = await fetch('/api/groups'); const data = await res.json(); setGroups(Array.isArray(data) ? data : []); } catch { setGroups([]); } };

    const handleAction = async (id, action) => {
        if (action === "delete" && !canDelete) return alert("ليس لديك صلاحية لحذف الحجز");
        if ((action === "checkin" || action === "checkout") && !canCheckinCheckout) return alert("ليس لديك صلاحية لهذا الإجراء");
        if ((action === "cancel" || action === "noshow") && !canCancelNoshow) return alert("ليس لديك صلاحية لهذا الإجراء");

        if (action === "delete" && !confirm("هل أنت متأكد من حذف الحجز؟")) return;

        setProcessingId(id);
        try {
            const method = action === "delete" ? "DELETE" : "POST";
            const res = await fetch(`/api/bookings/${id}/${action === "delete" ? "" : action}`, { method });
            if (!res.ok) throw new Error("Operation failed");
            const data = action === "delete" ? null : await res.json();
            if (action === "delete") setBookings(prev => prev.filter(b => b.id !== id));
            else setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        } catch (err) {
            alert(err.message || "Operation failed");
        } finally { setProcessingId(null); }
    };

    const calculateGrandTotal = (booking) => {
        if (!booking?.folio) return 0;
        const chargesTotal = (booking.folio.charges || []).reduce((sum, c) => {
            const tax = (Number(c.amount) * Number(c.tax || 0)) / 100;
            return sum + Number(c.amount) + tax;
        }, 0);
        const paymentsTotal = (booking.folio.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return chargesTotal - paymentsTotal;
    };

    return (
        <div className="flex flex-col gap-6 mb-6">


            {/* Header & Filters */}
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Vacant Bookings</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => b.status === "VACANT").length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Checked In</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => b.status === "CHECKED_IN").length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Checked Out</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => b.status === "CHECKED_OUT").length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Cancelled / NoShow</span>
                    <span className="text-2xl font-bold">{bookings.filter(b => ["CANCELLED", "NOSHOW"].includes(b.status)).length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                {/* Search */}
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Date From */}
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Date To */}
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Actions */}
                <div className="flex w-full md:w-auto gap-2">
                    {canAdd && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto"
                        >
                            + Add Booking
                        </button>
                    )}
                    {canAdd && (
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 w-full md:w-auto"
                        >
                            + Bulk Booking
                        </button>
                    )}
                </div>
            </div>

            {/* Bookings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.length > 0 ? (
                    bookings.map(b => (
                        <div
                            key={b.id}
                            className="p-4 rounded-2xl shadow-lg cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105 hover:shadow-xl flex flex-col justify-between"
                        >
                            {/* Header: Guest Name & Status */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">{b.property?.name}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${b.status === "CHECKED_IN" ? "bg-green-500 text-white" : b.status === "CHECKED_OUT" ? "bg-blue-500 text-white" : b.status === "CANCELLED" || b.status === "NOSHOW" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"}`}>
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

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {canEdit && <button onClick={e => { e.stopPropagation(); setEditBooking(b); }} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">✏️ Edit</button>}
                                {canCheckinCheckout && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "checkin"); }} className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600">Check-in</button>}
                                {canCheckinCheckout && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "checkout"); }} className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Check-out</button>}
                                {canCancelNoshow && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "cancel"); }} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600">Cancel</button>}
                                {canCancelNoshow && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "noshow"); }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">NoShow</button>}
                                {canDelete && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "delete"); }} className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800">🗑 Delete</button>}
                                {canFolio && <button onClick={e => { e.stopPropagation(); router.push(`/bookings/${b.id}/folio`); }} className="text-xs px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600">Folio</button>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
                )}
            </div>

            {/* Modals */}
            {showAddModal && canAdd && <AddBookingModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} groups={groups} />}
            {showBulkModal && canAdd && <BulkBookingModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
            {editBooking && canEdit && <EditBookingModal booking={editBooking} isOpen={!!editBooking} onClose={() => setEditBooking(null)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
        </div>
    );
}
