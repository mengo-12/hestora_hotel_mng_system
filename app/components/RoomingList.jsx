'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function RoomingList({ groupId, bookings: initialBookings = [], session }) {
    const [bookings, setBookings] = useState(initialBookings);
    const [filteredBookings, setFilteredBookings] = useState(initialBookings);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
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

    // Socket: تحديثات فورية
    useEffect(() => {
        if (!socket) return;

        socket.on("BOOKING_UPDATED", updatedBooking => {
            if (updatedBooking.groupId !== groupId) return;

            setBookings(prev => {
                const exists = prev.find(b => b.id === updatedBooking.id);
                if (exists) {
                    return prev.map(b => b.id === updatedBooking.id ? updatedBooking : b);
                } else if (["Reserved", "InHouse"].includes(updatedBooking.status)) {
                    return [...prev, updatedBooking];
                }
                return prev;
            });

            // رسائل فورية
            if (updatedBooking.status === "CheckedOut") {
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

        return () => {
            socket.off("BOOKING_UPDATED");
        };
    }, [socket, groupId]);

    // فلترة بحث وحالة
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
        setFilteredBookings(filtered);
    }, [searchTerm, filterStatus, bookings]);

    // Handlers للإجراءات
    const handleCheckIn = async (bookingId) => {
        if (!canCheckinCheckout) return;
        if (!confirm("Are you sure you want to Check-In?")) return;
        await fetch(`/api/bookings/${bookingId}/checkin`, { method: "POST" });
    };
    const handleCheckOut = async (bookingId) => {
        if (!canCheckinCheckout) return;
        if (!confirm("Are you sure you want to Check-Out?")) return;
        await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST" });
    };
    const handleCancel = async (bookingId) => {
        if (!canCancelNoshow) return;
        if (!confirm("Are you sure you want to Cancel?")) return;
        await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    };
    const handleNoShow = async (bookingId) => {
        if (!canCancelNoshow) return;
        if (!confirm("Mark as No-Show?")) return;
        await fetch(`/api/bookings/${bookingId}/noshow`, { method: "POST" });
    };

    // KPIs سريع
    const kpis = useMemo(() => [
        { label: "Reserved", value: bookings.filter(b => b.status === "Reserved").length },
        { label: "InHouse", value: bookings.filter(b => b.status === "InHouse").length },
        { label: "CheckedOut", value: bookings.filter(b => b.status === "CheckedOut").length },
        { label: "NOSHOW/Cancelled", value: bookings.filter(b => ["NOSHOW", "Cancelled"].includes(b.status)).length },
    ], [bookings]);

    return (
        <div className="p-6 flex flex-col gap-6">
            <Toaster position="top-right" />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 flex flex-col items-center hover:shadow-lg transition">
                        <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">{k.label}</span>
                        <span className="text-3xl font-bold mt-2">{k.value}</span>
                    </div>
                ))}
            </div>

            {/* فلترة */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                        <input
                            type="text"
                            placeholder="Search guests..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-black dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Status</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value="">All Status</option>
                            {Object.keys(statusConfig).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => { setSearchTerm(""); setFilterStatus(""); }}
                            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 shadow hover:bg-blue-700 transition"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Table أو Card لكل حجز */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map(b => {
                    const config = statusConfig[b.status] || { bg: "bg-gray-300", text: "text-black" };
                    return (
                        <div key={b.id} className={`p-5 rounded-2xl shadow-lg bg-white dark:bg-gray-800 ${config.bg} ${config.text} flex flex-col justify-between gap-4`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
                                    <p className="text-sm">{b.ratePlan?.name || "N/A"}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs rounded-lg font-medium`}>{b.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-400 dark:text-gray-300">Room</span>
                                    <p className="font-medium">{b.room?.number || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-300">Guests</span>
                                    <p className="font-medium">{b.adults || 0} Adults, {b.children || 0} Children</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-300">Check-In</span>
                                    <p className="font-medium">{new Date(b.checkIn).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-300">Check-Out</span>
                                    <p className="font-medium">{new Date(b.checkOut).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                                {b.status === "Reserved" && b.roomId && canCheckinCheckout && (
                                    <button onClick={() => handleCheckIn(b.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Check-In</button>
                                )}
                                {b.status === "Reserved" && b.roomId && canCancelNoshow && (
                                    <>
                                        <button onClick={() => handleCancel(b.id)} className="px-3 py-1 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition">Cancel</button>
                                        <button onClick={() => handleNoShow(b.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">No-Show</button>
                                    </>
                                )}
                                {b.status === "InHouse" && b.roomId && canCheckinCheckout && (
                                    <button onClick={() => handleCheckOut(b.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Check-Out</button>
                                )}
                                {canFolio && (
                                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        onClick={() => router.push(`/bookings/${b.id}/folio`)}>
                                        Open Folio
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
