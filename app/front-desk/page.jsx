'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast"; // <-- استدعاء react-hot-toast

export default function FrontDeskPage() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [departuresToday, setDeparturesToday] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [properties, setProperties] = useState([]);
    const [filterProperty, setFilterProperty] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const socket = useSocket();
    const router = useRouter();

    const statusConfig = {
        Reserved: { bg: "bg-purple-500", text: "text-white" },
        InHouse: { bg: "bg-green-500", text: "text-white" },
        CheckedOut: { bg: "bg-red-500", text: "text-white" },
        NOSHOW: { bg: "bg-red-500", text: "text-white" },
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
            const allBookings = Array.isArray(data) ? data : [];


            const now = new Date();
            const todayStr = new Date().toDateString();
            const active = allBookings.filter(b => ["Reserved", "InHouse"].includes(b.status))
                .map(b => ({
                    ...b,
                    isExpired: b.status === "InHouse" && new Date(b.checkOut) < now
                }));

            const departures = allBookings.filter(b => b.status === "CheckedOut" && new Date(b.checkOut).toDateString() === todayStr);

            setBookings(active);
            setFilteredBookings(active);
            setDeparturesToday(departures);
        } catch {
            setBookings([]);
            setFilteredBookings([]);
            setDeparturesToday([]);
        }
    };

    useEffect(() => {
        fetchProperties();
        fetchBookings();

        if (socket) {
            socket.on("BOOKING_UPDATED", (updatedBooking) => {
                setBookings(prev => {
                    if (["Reserved", "InHouse"].includes(updatedBooking.status)) {
                        return prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
                    } else {
                        return prev.filter(b => b.id !== updatedBooking.id)
                    }
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
                if (updatedBooking.status === "NOSHOW") {
                    toast.error(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} is marked as No-Show.`);
                }
                if (updatedBooking.status === "Cancelled") {
                    toast(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} booking Cancelled.`, { icon: '⚠️' });
                }
                if (updatedBooking.status === "InHouse" && updatedBooking.previousStatus === "Reserved") {
                    toast.success(`${updatedBooking.guest?.firstName} ${updatedBooking.guest?.lastName} has Checked-In.`);
                }
            });

            socket.on("BOOKING_CREATED", (newBooking) => {
                if (["Reserved", "InHouse"].includes(newBooking.status)) {
                    setBookings(prev => [...prev, newBooking]);
                    setFilteredBookings(prev => [...prev, newBooking]);
                    toast.success(`New booking created for ${newBooking.guest?.firstName} ${newBooking.guest?.lastName}`);
                }
            });

            socket.on("BOOKING_DELETED", ({ id }) => {
                setBookings(prev => prev.filter(b => b.id !== id));
                setFilteredBookings(prev => prev.filter(b => b.id !== id));
                setDeparturesToday(prev => prev.filter(b => b.id !== id));
            });

            socket.on("ROOM_STATUS_CHANGED", ({ roomId, newStatus }) => {
                setBookings(prev => prev.map(b => {
                    if (b.room?.id === roomId) {
                        let updatedStatus = mapRoomStatusToBookingStatus(newStatus);
                        return { ...b, status: updatedStatus };
                    }
                    return b;
                }));
            });
        }

        return () => {
            if (socket) {
                socket.off("BOOKING_UPDATED");
                socket.off("BOOKING_CREATED");
                socket.off("BOOKING_DELETED");
                socket.off("ROOM_STATUS_CHANGED");
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

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            bookings.forEach(b => {
                if (b.status === "InHouse") {
                    const checkOutDate = new Date(b.checkOut);
                    if (checkOutDate < now) {
                        toast.warn(`${b.guest?.firstName} ${b.guest?.lastName} stay has ended. Please check-out.`, { duration: 5000 });
                    }
                }
            });
        }, 60000); // كل دقيقة

        return () => clearInterval(interval);
    }, [bookings]);

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

    function mapRoomStatusToBookingStatus(roomStatus) {
        switch (roomStatus) {
            case "BOOKED": return "Reserved";
            case "OCCUPIED": return "InHouse";
            case "VACANT": return "CheckedOut";
            case "CLEANING": return "InHouse";
            case "MAINTENANCE": return "InHouse";
            default: return roomStatus;
        }
    }

    return (
        <div className="p-6">
            <Toaster position="top-right" /> {/* <-- إضافة عنصر Toaster لإظهار الإشعارات */}
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

            {/* شبكة الحجوزات الحالية */}
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Current Bookings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} router={router} handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} handleCancel={handleCancel} handleNoShow={handleNoShow} statusConfig={statusConfig} />
                ))}
            </div>

            {/* المغادرون اليوم */}
            {departuresToday.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-6 mb-2 dark:text-white">Departures Today</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departuresToday.map(booking => (
                            <BookingCard key={booking.id} booking={booking} router={router} statusConfig={statusConfig} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// مكون صغير لإعادة الاستخدام
function BookingCard({ booking, router, handleCheckIn, handleCheckOut, handleCancel, handleNoShow, statusConfig }) {
    const config = statusConfig[booking.status] || { bg: "bg-gray-300", text: "text-black" };
    const today = new Date().toDateString();

    // تحقق من انتهاء مدة الحجز
    const now = new Date();
    const checkOutDate = new Date(booking.checkOut);
    const isOverstay = booking.status === "InHouse" && checkOutDate < now;

    return (
        <div className={`p-4 rounded-lg shadow cursor-pointer 
            ${isOverstay ? "bg-red-500 text-white ring-4 ring-yellow-400" : `${config.bg} ${config.text}`} `}>

            <h2 className="text-lg font-semibold">{booking.guest?.firstName} {booking.guest?.lastName}</h2>
            <p>Room: {booking.room?.number || "N/A"}</p>
            <p>Adults: {booking.adults || 0} | Children: {booking.children || 0}</p>
            <p>RatePlan: {booking.ratePlan?.name || "N/A"}</p>
            <p>Status: {booking.status}</p>
            <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
            <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>

            <div className="mt-2 flex flex-wrap gap-2">
                {booking.status === "Reserved" && booking.roomId && (
                    <>
                        <button onClick={() => handleCheckIn?.(booking.id)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Check-In</button>
                        <button onClick={() => handleCancel?.(booking.id)} className="px-2 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600">Cancel</button>
                        <button onClick={() => handleNoShow?.(booking.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">No-Show</button>
                    </>
                )}
                {booking.status === "InHouse" && booking.roomId && (
                    <button onClick={() => handleCheckOut?.(booking.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Check-Out</button>
                )}
                <button onClick={() => router.push(`/bookings/${booking.id}/folio`)} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Open Folio</button>
            </div>
        </div>
    );
}



