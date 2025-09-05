// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function FrontDeskPage() {
//     const [bookings, setBookings] = useState([]);
//     const [filteredBookings, setFilteredBookings] = useState([]);
//     const [selectedBooking, setSelectedBooking] = useState(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [properties, setProperties] = useState([]);
//     const [filterProperty, setFilterProperty] = useState("");
//     const [filterFrom, setFilterFrom] = useState("");
//     const [filterTo, setFilterTo] = useState("");
//     const [filterStatus, setFilterStatus] = useState("");
//     const socket = useSocket();

//     const statusConfig = {
//         RESERVED: { bg: "bg-purple-500", text: "text-white"},
//         InHouse: { bg: "bg-green-500", text: "text-white"},
//         CheckedOut: { bg: "bg-red-500", text: "text-white"},
//         NOSHOW: { bg: "bg-red-500", text: "text-white", },
//         Cancelled: { bg: "bg-yellow-400", text: "text-black"},
//     };

//     const fetchProperties = async () => {
//         try {
//             const res = await fetch("/api/properties");
//             const data = await res.json();
//             setProperties(Array.isArray(data) ? data : []);
//         } catch {
//             setProperties([]);
//         }
//     };

//     const fetchBookings = async () => {
//         try {
//             const params = new URLSearchParams();
//             if (filterProperty) params.append("propertyId", filterProperty);
//             if (filterFrom) params.append("from", filterFrom);
//             if (filterTo) params.append("to", filterTo);

//             const res = await fetch(`/api/bookings?${params.toString()}`);
//             const data = await res.json();
//             setBookings(Array.isArray(data) ? data : []);
//             setFilteredBookings(Array.isArray(data) ? data : []);
//         } catch {
//             setBookings([]);
//             setFilteredBookings([]);
//         }
//     };

//     useEffect(() => {
//         fetchProperties();
//         fetchBookings();

//         if (socket) {
//             socket.on("BOOKING_UPDATED", (updatedBooking) => {
//                 setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
//             });
//             socket.on("BOOKING_CREATED", (newBooking) => setBookings(prev => [...prev, newBooking]));
//             socket.on("BOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(b => b.id !== id)));
//             socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
//                 setBookings(prev => prev.map(b => {
//                     if (b.room?.id === roomId) {
//                         // هنا نترجم حالة الغرفة إلى حالة الحجز المناسبة
//                         let updatedStatus = mapRoomStatusToBookingStatus(newStatus);
//                         return { ...b, status: updatedStatus };
//                     }
//                     return b;
//                 }));
//             });
//         }

//         return () => {
//             if (socket) {
//                 socket.off("BOOKING_UPDATED");
//                 socket.off("BOOKING_CREATED");
//                 socket.off("BOOKING_DELETED");
//                 socket.off("ROOM_STATUS_CHANGED");
//             }
//         };
//     }, [socket, filterProperty, filterFrom, filterTo]);

//     useEffect(() => {
//         let filtered = bookings;

//         if (searchTerm.trim()) {
//             const term = searchTerm.toLowerCase();
//             filtered = filtered.filter(b =>
//                 b.guest?.firstName?.toLowerCase().includes(term) ||
//                 b.guest?.lastName?.toLowerCase().includes(term) ||
//                 b.room?.number?.toString().includes(term) ||
//                 b.status?.toLowerCase().includes(term) ||
//                 b.id?.toString().includes(term) ||
//                 b.company?.name?.toLowerCase().includes(term)
//             );
//         }

//         if (filterStatus) {
//             filtered = filtered.filter(b => b.status === filterStatus);
//         }

//         setFilteredBookings(filtered);
//     }, [searchTerm, filterStatus, bookings]);

//     const handleCheckIn = async (bookingId) => {
//         if (!confirm("Are you sure you want to Check-In this booking?")) return;
//         try {
//             const res = await fetch(`/api/bookings/${bookingId}/checkin`, { method: "POST" });
//             if (!res.ok) throw new Error("Check-in failed");
//             fetchBookings();
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     const handleCheckOut = async (bookingId) => {
//         if (!confirm("Are you sure you want to Check-Out this booking?")) return;
//         try {
//             const res = await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST" });
//             if (!res.ok) throw new Error("Check-out failed");
//             fetchBookings();
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     const handleCancel = async (bookingId) => {
//         if (!confirm("Are you sure you want to Cancel this booking?")) return;
//         try {
//             const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
//             if (!res.ok) throw new Error("Cancel failed");
//             fetchBookings();
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     const handleNoShow = async (bookingId) => {
//         if (!confirm("Mark this booking as No-Show?")) return;
//         try {
//             const res = await fetch(`/api/bookings/${bookingId}/noshow`, { method: "POST" });
//             if (!res.ok) throw new Error("No-Show failed");
//             fetchBookings();
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     const calculateFolioTotal = (booking) => {
//         if (!booking?.folio) return 0;
//         return (booking.folio.charges || []).reduce(
//             (sum, c) => sum + Number(c.amount || 0) + Number(c.tax || 0),
//             0
//         );
//     };

//     function mapRoomStatusToBookingStatus(roomStatus) {
//     switch(roomStatus) {
//         case "BOOKED":
//             return "RESERVED";
//         case "OCCUPIED":
//             return "InHouse";
//         case "VACANT":
//             return "CheckedOut";
//         case "CLEANING":
//             return "InHouse"; // أو حسب سياستك
//         case "MAINTENANCE":
//             return "InHouse"; // أو حسب سياستك
//         default:
//             return roomStatus;
//     }
// }

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4 dark:text-white">Front Desk - Check-in / Check-out</h1>

//             {/* فلترة + بحث */}
//             <div className="flex flex-col md:flex-row gap-3 mb-4">
//                 <input
//                     type="text"
//                     placeholder="🔍 Search bookings..."
//                     value={searchTerm}
//                     onChange={e => setSearchTerm(e.target.value)}
//                     className="px-3 py-2 border rounded-lg w-full md:w-1/4 dark:bg-gray-700 dark:text-white"
//                 />
//                 <select
//                     value={filterProperty}
//                     onChange={e => setFilterProperty(e.target.value)}
//                     className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
//                 >
//                     <option value="">All Properties</option>
//                     {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                 </select>
//                 <select
//                     value={filterStatus}
//                     onChange={e => setFilterStatus(e.target.value)}
//                     className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
//                 >
//                     <option value="">All Status</option>
//                     {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
//                 </select>
//                 <input
//                     type="date"
//                     value={filterFrom}
//                     onChange={e => setFilterFrom(e.target.value)}
//                     className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
//                 />
//                 <input
//                     type="date"
//                     value={filterTo}
//                     onChange={e => setFilterTo(e.target.value)}
//                     className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
//                 />
//                 <button
//                     onClick={fetchBookings}
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                     Apply Filters
//                 </button>
//             </div>

//             {/* شبكة الحجوزات */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {filteredBookings.map(booking => {
//                     const config = statusConfig[booking.status] || { bg: "bg-gray-300", text: "text-black" };
//                     const today = new Date().toDateString();
//                     const isToday = new Date(booking.checkIn).toDateString() === today;
//                     const total = calculateFolioTotal(booking);

//                     return (
//                         <div
//                             key={booking.id}
//                             className={`p-4 rounded-lg shadow cursor-pointer ${config.bg} ${config.text} ${isToday ? "ring-4 ring-yellow-400" : ""}`}
//                             onClick={() => setSelectedBooking(booking)}
//                         >
//                             <h2 className="text-lg font-semibold">{booking.guest?.firstName} {booking.guest?.lastName} {config.icon}</h2>
//                             <p>Room: {booking.room?.number || "N/A"}</p>
//                             <p>Adults: {booking.adults || 0} | Children: {booking.children || 0}</p>
//                             <p>RatePlan: {booking.ratePlan?.name || "N/A"}</p>
//                             <p>Status: {booking.status}</p>
//                             <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
//                             <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
//                             <p>Total: ${total.toFixed(2)}</p>
//                             {booking.notes && <p>Notes: {booking.notes}</p>}

//                             <div className="mt-2 flex flex-wrap gap-2">
//                                 {booking.status === "RESERVED" && booking.roomId && (
//                                     <>
//                                         <button
//                                             onClick={e => { e.stopPropagation(); handleCheckIn(booking.id); }}
//                                             className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
//                                         >
//                                             Check-In
//                                         </button>
//                                         <button
//                                             onClick={e => { e.stopPropagation(); handleCancel(booking.id); }}
//                                             className="px-2 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
//                                         >
//                                             Cancel
//                                         </button>
//                                         <button
//                                             onClick={e => { e.stopPropagation(); handleNoShow(booking.id); }}
//                                             className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
//                                         >
//                                             No-Show
//                                         </button>
//                                     </>
//                                 )}
//                                 {booking.status === "InHouse" && booking.roomId && (
//                                     <button
//                                         onClick={e => { e.stopPropagation(); handleCheckOut(booking.id); }}
//                                         className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
//                                     >
//                                         Check-Out
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* نافذة التفاصيل بدون Extras */}
//             {selectedBooking && (
//                 <BookingDetailModal
//                     booking={selectedBooking}
//                     onClose={() => setSelectedBooking(null)}
//                     statusConfig={statusConfig}
//                     calculateFolioTotal={calculateFolioTotal}
//                 />
//             )}
//         </div>
//     );
// }

// // مكون نافذة التفاصيل بدون إمكانية إضافة خدمة
// function BookingDetailModal({ booking, onClose, statusConfig, calculateFolioTotal }) {
//     const total = calculateFolioTotal(booking);

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 overflow-y-auto max-h-[90vh]">
//                 <h2 className="text-xl font-bold mb-4">{booking.guest?.firstName} {booking.guest?.lastName} {statusConfig[booking.status]?.icon}</h2>
//                 <p><b>Room:</b> {booking.room?.number || "N/A"}</p>
//                 <p><b>Adults:</b> {booking.adults || 0}</p>
//                 <p><b>Children:</b> {booking.children || 0}</p>
//                 <p><b>RatePlan:</b> {booking.ratePlan?.name || "N/A"}</p>
//                 <p><b>Status:</b> {booking.status}</p>
//                 <p><b>Check-in:</b> {new Date(booking.checkIn).toLocaleDateString()}</p>
//                 <p><b>Check-out:</b> {new Date(booking.checkOut).toLocaleDateString()}</p>
//                 <p><b>Company:</b> {booking.company?.name || "N/A"}</p>
//                 <p><b>Notes:</b> {booking.notes || "None"}</p>

//                 <h3 className="mt-4 font-semibold">Folio / Charges</h3>
//                 <ul className="list-disc ml-5 mb-2">
//                     <li>Room Charge: ${booking.roomRate?.toFixed(2) || "0.00"}</li>
//                     <li className="font-bold">Total: ${total.toFixed(2)}</li>
//                 </ul>

//                 <div className="mt-4 text-right">
//                     <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
//                 </div>
//             </div>
//         </div>
//     );
// }




'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function FrontDeskPage() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [properties, setProperties] = useState([]);
    const [filterProperty, setFilterProperty] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const socket = useSocket();

    const statusConfig = {
        RESERVED: { bg: "bg-purple-500", text: "text-white" },
        InHouse: { bg: "bg-green-500", text: "text-white" },
        CheckedOut: { bg: "bg-red-500", text: "text-white" },
        NOSHOW: { bg: "bg-red-500", text: "text-white", },
        Cancelled: { bg: "bg-yellow-400", text: "text-black" },
    };

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            setProperties(Array.isArray(data) ? data : []);
        } catch {
            setProperties([]);
        }
    };

    const fetchBookings = async () => {
        try {
            const params = new URLSearchParams();
            if (filterProperty) params.append("propertyId", filterProperty);
            if (filterFrom) params.append("from", filterFrom);
            if (filterTo) params.append("to", filterTo);

            const res = await fetch(`/api/bookings?${params.toString()}`);
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
            setFilteredBookings(Array.isArray(data) ? data : []);
        } catch {
            setBookings([]);
            setFilteredBookings([]);
        }
    };

    useEffect(() => {
        fetchProperties();
        fetchBookings();

        if (socket) {
            socket.on("BOOKING_UPDATED", (updatedBooking) => {
                setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            });
            socket.on("BOOKING_CREATED", (newBooking) => setBookings(prev => [...prev, newBooking]));
            socket.on("BOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(b => b.id !== id)));
            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setBookings(prev => prev.map(b => {
                    if (b.room?.id === roomId) {
                        let updatedStatus = mapRoomStatusToBookingStatus(newStatus);
                        return { ...b, status: updatedStatus };
                    }
                    return b;
                }));
            });

            // استقبال تحديث الشحنات مباشرة
            socket.on("CHARGE_UPDATED", ({ bookingId, charge }) => {
                setBookings(prev =>
                    prev.map(b => {
                        if (b.id !== bookingId) return b;
                        return {
                            ...b,
                            folio: {
                                ...b.folio,
                                charges: b.folio.charges.map(c => c.id === charge.id ? charge : c)
                            }
                        };
                    })
                );
            });

            socket.on("CHARGE_DELETED", ({ bookingId, chargeId }) => {
                setBookings(prev =>
                    prev.map(b => {
                        if (b.id !== bookingId) return b;
                        return {
                            ...b,
                            folio: {
                                ...b.folio,
                                charges: b.folio.charges.filter(c => c.id !== chargeId)
                            }
                        };
                    })
                );
            });
        }

        return () => {
            if (socket) {
                socket.off("BOOKING_UPDATED");
                socket.off("BOOKING_CREATED");
                socket.off("BOOKING_DELETED");
                socket.off("ROOM_STATUS_CHANGED");
                socket.off("CHARGE_UPDATED");
                socket.off("CHARGE_DELETED");
            }
        };
    }, [socket, filterProperty, filterFrom, filterTo]);

    useEffect(() => {
        let filtered = bookings;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.guest?.firstName?.toLowerCase().includes(term) ||
                b.guest?.lastName?.toLowerCase().includes(term) ||
                b.room?.number?.toString().includes(term) ||
                b.status?.toLowerCase().includes(term) ||
                b.id?.toString().includes(term) ||
                b.company?.name?.toLowerCase().includes(term)
            );
        }

        if (filterStatus) {
            filtered = filtered.filter(b => b.status === filterStatus);
        }

        setFilteredBookings(filtered);
    }, [searchTerm, filterStatus, bookings]);

    const handleCheckIn = async (bookingId) => {
        if (!confirm("Are you sure you want to Check-In this booking?")) return;
        try {
            const res = await fetch(`/api/bookings/${bookingId}/checkin`, { method: "POST" });
            if (!res.ok) throw new Error("Check-in failed");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCheckOut = async (bookingId) => {
        if (!confirm("Are you sure you want to Check-Out this booking?")) return;
        try {
            const res = await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST" });
            if (!res.ok) throw new Error("Check-out failed");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!confirm("Are you sure you want to Cancel this booking?")) return;
        try {
            const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
            if (!res.ok) throw new Error("Cancel failed");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleNoShow = async (bookingId) => {
        if (!confirm("Mark this booking as No-Show?")) return;
        try {
            const res = await fetch(`/api/bookings/${bookingId}/noshow`, { method: "POST" });
            if (!res.ok) throw new Error("No-Show failed");
        } catch (err) {
            alert(err.message);
        }
    };

    const calculateFolioTotal = (booking) => {
        if (!booking?.folio) return 0;
        return (booking.folio.charges || []).reduce(
            (sum, c) => sum + Number(c.amount || 0) + Number(c.tax || 0),
            0
        );
    };

    // تحديث شحنة
    const handleUpdateCharge = async (bookingId, chargeId, amount, tax) => {
        try {
            await fetch(`/api/folios/${bookingId}/charges`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId, amount: Number(amount), tax: Number(tax) })
            });

            // تحديث محلي بدون fetchBookings
            setBookings(prev =>
                prev.map(b => {
                    if (b.id !== bookingId) return b;
                    return {
                        ...b,
                        folio: {
                            ...b.folio,
                            charges: b.folio.charges.map(c => c.id === chargeId ? { ...c, amount: Number(amount), tax: Number(tax) } : c)
                        }
                    };
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    // حذف شحنة
    const handleDeleteCharge = async (bookingId, chargeId) => {
        if (!confirm("Delete this charge?")) return;
        try {
            await fetch(`/api/folios/${bookingId}/charges`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId })
            });

            // حذف محلي بدون fetchBookings
            setBookings(prev =>
                prev.map(b => {
                    if (b.id !== bookingId) return b;
                    return {
                        ...b,
                        folio: {
                            ...b.folio,
                            charges: b.folio.charges.filter(c => c.id !== chargeId)
                        }
                    };
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    function mapRoomStatusToBookingStatus(roomStatus) {
        switch (roomStatus) {
            case "BOOKED": return "RESERVED";
            case "OCCUPIED": return "InHouse";
            case "VACANT": return "CheckedOut";
            case "CLEANING": return "InHouse";
            case "MAINTENANCE": return "InHouse";
            default: return roomStatus;
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Front Desk - Check-in / Check-out</h1>

            {/* فلترة + بحث */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                    type="text"
                    placeholder="🔍 Search bookings..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border rounded-lg w-full md:w-1/4 dark:bg-gray-700 dark:text-white"
                />
                <select
                    value={filterProperty}
                    onChange={e => setFilterProperty(e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                >
                    <option value="">All Properties</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                >
                    <option value="">All Status</option>
                    {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                    type="date"
                    value={filterFrom}
                    onChange={e => setFilterFrom(e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <input
                    type="date"
                    value={filterTo}
                    onChange={e => setFilterTo(e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <button
                    onClick={fetchBookings}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Apply Filters
                </button>
            </div>

            {/* شبكة الحجوزات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map(booking => {
                    const config = statusConfig[booking.status] || { bg: "bg-gray-300", text: "text-black" };
                    const today = new Date().toDateString();
                    const isToday = new Date(booking.checkIn).toDateString() === today;
                    const total = calculateFolioTotal(booking);

                    return (
                        <div
                            key={booking.id}
                            className={`p-4 rounded-lg shadow cursor-pointer ${config.bg} ${config.text} ${isToday ? "ring-4 ring-yellow-400" : ""}`}
                            onClick={() => setSelectedBooking(booking)}
                        >
                            <h2 className="text-lg font-semibold">{booking.guest?.firstName} {booking.guest?.lastName} {config.icon}</h2>
                            <p>Room: {booking.room?.number || "N/A"}</p>
                            <p>Adults: {booking.adults || 0} | Children: {booking.children || 0}</p>
                            <p>RatePlan: {booking.ratePlan?.name || "N/A"}</p>
                            <p>Status: {booking.status}</p>
                            <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                            <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
                            <p>Total: ${total.toFixed(2)}</p>
                            {booking.notes && <p>Notes: {booking.notes}</p>}

                            <div className="mt-2 flex flex-wrap gap-2">
                                {booking.status === "RESERVED" && booking.roomId && (
                                    <>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleCheckIn(booking.id); }}
                                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            Check-In
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleCancel(booking.id); }}
                                            className="px-2 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleNoShow(booking.id); }}
                                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            No-Show
                                        </button>
                                    </>
                                )}
                                {booking.status === "InHouse" && booking.roomId && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleCheckOut(booking.id); }}
                                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Check-Out
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* نافذة التفاصيل مع Extras + تعديل الفواتير */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    statusConfig={statusConfig}
                    calculateFolioTotal={calculateFolioTotal}
                    handleUpdateCharge={handleUpdateCharge}
                    handleDeleteCharge={handleDeleteCharge}
                />
            )}
        </div>
    );
}

// مكون نافذة التفاصيل مع الخدمات الإضافية وتعديل الفواتير
function BookingDetailModal({ booking, onClose, statusConfig, calculateFolioTotal, handleUpdateCharge, handleDeleteCharge }) {
    const total = calculateFolioTotal(booking);
    const charges = booking.folio?.charges || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 overflow-y-auto max-h-[90vh]">
                <h2 className="text-xl font-bold mb-4">{booking.guest?.firstName} {booking.guest?.lastName} {statusConfig[booking.status]?.icon}</h2>
                <p><b>Room:</b> {booking.room?.number || "N/A"}</p>
                <p><b>Adults:</b> {booking.adults || 0}</p>
                <p><b>Children:</b> {booking.children || 0}</p>
                <p><b>RatePlan:</b> {booking.ratePlan?.name || "N/A"}</p>
                <p><b>Status:</b> {booking.status}</p>
                <p><b>Check-in:</b> {new Date(booking.checkIn).toLocaleDateString()}</p>
                <p><b>Check-out:</b> {new Date(booking.checkOut).toLocaleDateString()}</p>
                <p><b>Company:</b> {booking.company?.name || "N/A"}</p>
                <p><b>Notes:</b> {booking.notes || "None"}</p>

                <h3 className="mt-4 font-semibold">Folio / Charges</h3>
                <ul className="list-disc ml-5 mb-2 space-y-1">
                    {charges.map(c => (
                        <li key={c.id} className="flex items-center justify-between gap-2">
                            <div>
                                {c.description}: $
                                <input
                                    type="number"
                                    value={Number(c.amount || 0)}
                                    onChange={e => handleUpdateCharge(booking.id, c.id, e.target.value, c.tax)}
                                    className="w-20 border rounded px-1 py-0.5"
                                />
                                + Tax: $
                                <input
                                    type="number"
                                    value={Number(c.tax || 0)}
                                    onChange={e => handleUpdateCharge(booking.id, c.id, c.amount, e.target.value)}
                                    className="w-16 border rounded px-1 py-0.5"
                                />
                            </div>
                            <button
                                onClick={() => handleDeleteCharge(booking.id, c.id)}
                                className="text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="font-bold mt-2">Total: ${total.toFixed(2)}</p>

                <div className="mt-4 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
                </div>
            </div>
        </div>
    );
}

