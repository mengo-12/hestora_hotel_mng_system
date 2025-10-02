'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import RoomRack from "@/app/components/RoomRack";


export default function FrontDeskPage({ session, userProperties }) {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [departuresToday, setDeparturesToday] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [properties, setProperties] = useState([]);
    const [filterProperty, setFilterProperty] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [groups, setGroups] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [filterGroup, setFilterGroup] = useState("");
    const [filterCompany, setFilterCompany] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        open: false,
        action: null,
        message: "",
    });

    const socket = useSocket();
    const router = useRouter();

    const role = session?.user?.role || "Guest";
    const canCheckinCheckout = ["Admin", "FrontDesk"].includes(role);
    const canCancelNoshow = ["Admin", "FrontDesk"].includes(role);
    const canFolio = ["Admin", "FrontDesk", "Manager"].includes(role);

    const statusConfig = {
        Reserved: { bg: "bg-purple-500", text: "text-white" },
        InHouse: { bg: "bg-green-500", text: "text-white" },
        CheckedOut: { bg: "bg-red-500", text: "text-white" },
        NOSHOW: { bg: "bg-red-500", text: "text-white" },
        Cancelled: { bg: "bg-yellow-400", text: "text-black" },
    };

    // Fetch Properties
    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            setProperties(Array.isArray(data) ? data : []);
        } catch {
            setProperties([]);
        }
    };

    // Fetch Bookings
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterProperty) params.append("propertyId", filterProperty);
            if (filterFrom) params.append("from", filterFrom);
            if (filterTo) params.append("to", filterTo);

            const res = await fetch(`/api/bookings?${params.toString()}`);
            const data = await res.json();
            const all = Array.isArray(data) ? data : [];

            const now = new Date();
            const todayStr = new Date().toDateString();
            const active = all.filter(b => ["Reserved", "InHouse"].includes(b.status))
                .map(b => ({ ...b, isExpired: b.status === "InHouse" && new Date(b.checkOut) < now }));

            const departures = all.filter(b => b.status === "CheckedOut" && new Date(b.checkOut).toDateString() === todayStr);

            setAllBookings(all);
            setBookings(active);
            setFilteredBookings(active);
            setDeparturesToday(departures);
        } catch {
            setAllBookings([]);
            setBookings([]);
            setFilteredBookings([]);
            setDeparturesToday([]);
        } finally {
            setLoading(false); // ← إيقاف Spinner
        }

    };

    // --- Confirm modal helpers ---
    const showConfirm = (message, action) => {
        setConfirmModal({ open: true, message, action });
    };
    const handleConfirm = async () => {
        if (!confirmModal.action) return;
        try {
            setConfirmLoading(true);
            await confirmModal.action();
        } finally {
            setConfirmLoading(false);
            setConfirmModal({ open: false, action: null, message: "" });
        }
    };


    useEffect(() => {
        fetchProperties();
        fetchBookings();

        if (socket) {
            // Booking updates
            socket.on("BOOKING_UPDATED", updatedBooking => {
                setBookings(prev => {
                    if (["Reserved", "InHouse"].includes(updatedBooking.status)) {
                        return prev.map(b => b.id === updatedBooking.id ? updatedBooking : b);
                    } else return prev.filter(b => b.id !== updatedBooking.id);
                });

                const todayStr = new Date().toDateString();
                if (updatedBooking.status === "CheckedOut" && new Date(updatedBooking.checkOut).toDateString() === todayStr) {
                    setDeparturesToday(prev => {
                        const exists = prev.find(b => b.id === updatedBooking.id);
                        if (!exists) return [...prev, updatedBooking];
                        return prev.map(b => b.id === updatedBooking.id ? updatedBooking : b);
                    });
                    toast.success(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} has Checked-Out.`);
                }
                if (updatedBooking.status === "NOSHOW") toast.error(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} is marked as No-Show.`);
                if (updatedBooking.status === "Cancelled") toast(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} booking Cancelled.`, { icon: '⚠️' });
                if (updatedBooking.status === "InHouse" && updatedBooking.previousStatus === "Reserved") toast.success(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} has Checked-In.`);
            });

            // Booking created
            socket.on("BOOKING_CREATED", newBooking => {
                if (["Reserved", "InHouse"].includes(newBooking.status)) {
                    setBookings(prev => [...prev, newBooking]);
                    setFilteredBookings(prev => [...prev, newBooking]);
                    setAllBookings(prev => [...prev, newBooking]);
                    toast.success(`New booking created for ${newBooking.guest?.firstName} ${newBooking.guest?.lastName}`);
                }
            });

            // Booking deleted
            socket.on("BOOKING_DELETED", ({ id }) => {
                setBookings(prev => prev.filter(b => b.id !== id));
                setFilteredBookings(prev => prev.filter(b => b.id !== id));
                setDeparturesToday(prev => prev.filter(b => b.id !== id));
                setAllBookings(prev => prev.filter(b => b.id !== id));
            });
        }

        return () => {
            if (socket) {
                socket.off("BOOKING_UPDATED");
                socket.off("BOOKING_CREATED");
                socket.off("BOOKING_DELETED");
            }
        };
    }, [socket, filterProperty, filterFrom, filterTo]);

    useEffect(() => {
        const uniqueGroups = Array.from(new Set(allBookings
            .filter(b => b.group?.name)
            .map(b => b.group.name)
        ));
        const uniqueCompanies = Array.from(new Set(allBookings
            .filter(b => b.company?.name)
            .map(b => b.company.name)
        ));
        setGroups(uniqueGroups);
        setCompanies(uniqueCompanies);
    }, [allBookings]);

    // Action handlers
    // const handleCheckIn = async (bookingId) => {
    //     if (!canCheckinCheckout) return;
    //     if (!confirm("Are you sure you want to Check-In?")) return;
    //     await fetch(`/api/bookings/${bookingId}/checkin`, { method: "POST" });
    // };
    // const handleCheckOut = async (bookingId) => {
    //     if (!canCheckinCheckout) return;
    //     if (!confirm("Are you sure you want to Check-Out?")) return;
    //     await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST" });
    // };
    // const handleCancel = async (bookingId) => {
    //     if (!canCancelNoshow) return;
    //     if (!confirm("Are you sure you want to Cancel?")) return;
    //     await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    // };
    // const handleNoShow = async (bookingId) => {
    //     if (!canCancelNoshow) return;
    //     if (!confirm("Mark as No-Show?")) return;
    //     await fetch(`/api/bookings/${bookingId}/noshow`, { method: "POST" });
    // };

    // --- Action handlers using modal ---
    const handleCheckIn = (bookingId) => {
        if (!canCheckinCheckout) return;
        showConfirm("Are you sure you want to Check-In?", async () => {
            await fetch(`/api/bookings/${bookingId}/checkin`, { method: "POST" });
        });
    };

    const handleCheckOut = (bookingId) => {
        if (!canCheckinCheckout) return;
        showConfirm("Are you sure you want to Check-Out?", async () => {
            await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST" });
        });
    };

    const handleCancel = (bookingId) => {
        if (!canCancelNoshow) return;
        showConfirm("Are you sure you want to Cancel?", async () => {
            await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
        });
    };

    const handleNoShow = (bookingId) => {
        if (!canCancelNoshow) return;
        showConfirm("Mark as No-Show?", async () => {
            await fetch(`/api/bookings/${bookingId}/noshow`, { method: "POST" });
        });
    };



    // Filter search
    useEffect(() => {
        let filtered = bookings;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.guest?.firstName?.toLowerCase().includes(term) ||
                b.guest?.lastName?.toLowerCase().includes(term) ||
                b.room?.number?.toString().includes(term)
            );
        }
        if (filterStatus) filtered = filtered.filter(b => b.status === filterStatus);
        if (filterGroup) filtered = filtered.filter(b => b.group?.name === filterGroup);
        if (filterCompany) filtered = filtered.filter(b => b.company?.name === filterCompany);
        setFilteredBookings(filtered);
    }, [searchTerm, filterStatus, bookings, filterGroup, filterCompany]);

    // KPIs Summary
    const kpis = useMemo(() => [
        { label: "Reservations", value: allBookings.filter(b => b.status === "Reserved").length },
        {
            label: "Check-Ins Today", value: allBookings.filter(
                b => b.status === "InHouse" && new Date(b.checkIn).toDateString() === new Date().toDateString()
            ).length
        },
        { label: "Check-Outs Today", value: departuresToday.length },
        { label: "No-Shows / Cancelled", value: allBookings.filter(b => ["NOSHOW", "Cancelled"].includes(b.status)).length },
    ], [allBookings, departuresToday]);


    // Booking Card Component
    const BookingCard = ({ booking }) => {
        const config = statusConfig[booking.status] || { bg: "bg-gray-300", text: "text-black" };

        // تحديد نوع الحجز
        const isGroup = booking.group ? true : false;
        const isCompany = booking.company ? true : false;
        const bookingType = isGroup ? "Group" : isCompany ? "Company" : "Individual";

        return (
            <div className="p-5 rounded-2xl shadow-lg bg-white dark:bg-gray-800 text-black dark:text-white flex flex-col justify-between gap-4 hover:shadow-xl transition transform hover:scale-105 relative">

                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold">{booking.guest?.firstName} {booking.guest?.lastName}</h2>

                        {/* اسم المجموعة إذا كان الحجز جماعي */}
                        {isGroup && booking.group?.name && (
                            <p className="text-sm text-indigo-500 font-medium">{booking.group.name}</p>
                        )}
                        {isCompany && booking.company?.name && (
                            <p className="text-sm text-orange-500 font-medium">{booking.company.name}</p>
                        )}

                        <p className="text-sm text-gray-500 dark:text-gray-300">{booking.ratePlan?.name || "N/A"}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Badge نوع الحجز */}
                        <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap
                        ${isGroup ? "bg-indigo-500 text-white" :
                                isCompany ? "bg-orange-500 text-white" : "bg-gray-400 text-white"}`}>
                            {bookingType}
                        </span>

                        {/* Badge حالة الحجز */}
                        <span className={`px-3 py-1 text-xs rounded-lg font-medium ${config.bg} ${config.text}`}>
                            {booking.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                    <div>
                        <span className="text-gray-400 dark:text-gray-300">Room</span>
                        <p className="font-medium">{booking.room?.number || "N/A"}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 dark:text-gray-300">Guests</span>
                        <p className="font-medium">{booking.adults || 0} Adults, {booking.children || 0} Children</p>
                    </div>
                    <div>
                        <span className="text-gray-400 dark:text-gray-300">Check-In</span>
                        <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 dark:text-gray-300">Check-Out</span>
                        <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                    {booking.status === "Reserved" && booking.roomId && canCheckinCheckout && (
                        <button onClick={() => handleCheckIn(booking.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Check-In</button>
                    )}
                    {booking.status === "Reserved" && booking.roomId && canCancelNoshow && (
                        <>
                            <button onClick={() => handleCancel(booking.id)} className="px-3 py-1 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition">Cancel</button>
                            <button onClick={() => handleNoShow(booking.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">No-Show</button>
                        </>
                    )}
                    {booking.status === "InHouse" && booking.roomId && canCheckinCheckout && (
                        <button onClick={() => handleCheckOut(booking.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Check-Out</button>
                    )}
                    {canFolio && (
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" onClick={() => router.push(`/bookings/${booking.id}/folio`)}>
                            Open Folio
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 flex flex-col gap-6">
            <Toaster position="top-right" />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 flex flex-col items-center hover:shadow-lg transition">
                        <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">{k.label}</span>
                        <span className="text-3xl font-bold mt-2">{k.value}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex flex-wrap gap-4 items-end">

                    <div className="flex-1 min-w-[150px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-black dark:text-white"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                        <select
                            value={filterProperty}
                            onChange={e => setFilterProperty(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Properties</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Status</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Status</option>
                            {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Group</label>
                        <select
                            value={filterGroup}
                            onChange={e => setFilterGroup(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Groups</option>
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Company</label>
                        <select
                            value={filterCompany}
                            onChange={e => setFilterCompany(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Companies</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From</label>
                        <input
                            type="date"
                            value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To</label>
                        <input
                            type="date"
                            value={filterTo}
                            onChange={e => setFilterTo(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        />
                    </div>

                    <div className="min-w-[100px]">
                        <button
                            onClick={fetchBookings}
                            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 shadow hover:bg-blue-700 transition"
                        >
                            Apply
                        </button>
                    </div>

                </div>
            </div>

            {/* Bookings */}
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Current Bookings</h2>

            {/* Spinner */}
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                </div>
            ) : filteredBookings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-300">No bookings found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
            )}


            <RoomRack />

            {departuresToday.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-6 mb-2 text-black dark:text-white">Departures Today</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departuresToday.map(b => <BookingCard key={b.id} booking={b} />)}
                    </div>
                </>
            )}

            {/* --- Confirmation Modal --- */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-80">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 transition"
                                onClick={() => setConfirmModal({ open: false, action: null, message: "" })}
                                disabled={confirmLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                onClick={handleConfirm}
                                disabled={confirmLoading}
                            >
                                {confirmLoading && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
