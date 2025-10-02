'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddBookingModal from "@/app/components/AddBookingModal";
import EditBookingModal from "@/app/components/EditBookingModal";
import BulkBookingModal from "@/app/components/BulkBookingModal";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import { useRouter } from "next/navigation";

export default function BookingsPage({ session, userProperties }) {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
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
    const [statusFilter, setStatusFilter] = useState("")
    const [bookingTypeFilter, setBookingTypeFilter] = useState("");
    const [loading, setLoading] = useState(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const canAdd = ["Admin", "FrontDesk"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);
    const canCheckinCheckout = ["Admin", "FrontDesk"].includes(role);
    const canCancelNoshow = ["Admin", "FrontDesk"].includes(role);
    const canFolio = ["Admin", "FrontDesk", "Manager"].includes(role);

    const fetchBookings = async (search = "", from = "", to = "") => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => { try { setProperties(await (await fetch("/api/properties")).json()); } catch { setProperties([]); } };
    const fetchGuests = async () => { try { setGuests(await (await fetch("/api/guests")).json()); } catch { setGuests([]); } };
    const fetchRooms = async () => { try { setRooms(await (await fetch("/api/rooms")).json()); } catch { setRooms([]); } };
    const fetchRatePlans = async () => { try { setRatePlans(await (await fetch("/api/ratePlans")).json()); } catch { setRatePlans([]); } };
    const fetchCompanies = async () => { try { setCompanies(await (await fetch("/api/companies")).json()); } catch { setCompanies([]); } };
    const fetchGroups = async () => { try { const res = await fetch('/api/groups'); const data = await res.json(); setGroups(Array.isArray(data) ? data : []); } catch { setGroups([]); } };

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

    const handleAction = async (id, action) => {
        // صلاحيات
        if (action === "delete" && !canDelete) return alert("ليس لديك صلاحية لحذف الحجز");
        if ((action === "checkin" || action === "checkout") && !canCheckinCheckout) return alert("ليس لديك صلاحية لهذا الإجراء");
        if ((action === "cancel" || action === "noshow") && !canCancelNoshow) return alert("ليس لديك صلاحية لهذا الإجراء");

        // العملية نفسها كـ Promise عشان المودال
        return new Promise(async (resolve, reject) => {
            setProcessingId(id);
            try {
                const method = action === "delete" ? "DELETE" : "POST";
                const res = await fetch(`/api/bookings/${id}/${action === "delete" ? "" : action}`, { method });
                if (!res.ok) throw new Error("Operation failed");
                const data = action === "delete" ? null : await res.json();
                if (action === "delete") setBookings(prev => prev.filter(b => b.id !== id));
                else setBookings(prev => prev.map(b => b.id === data.id ? data : b));
                resolve();
            } catch (err) {
                reject(err);
            } finally {
                setProcessingId(null);
            }
        });
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

    const kpis = useMemo(() => {
        const statuses = bookings.map(b => b.status || "");
        return {
            vacant: statuses.filter(s => s === "Booked").length,
            checkedIn: statuses.filter(s => s === "InHouse").length,
            checkedOut: statuses.filter(s => s === "CheckedOut").length
        };
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const matchesSearch = !searchTerm ||
                b.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.room?.number?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = !statusFilter || b.status === statusFilter;

            const bookingType = b.group
                ? "Group"
                : b.company
                    ? "Company"
                    : "Individual";
            const matchesType = !bookingTypeFilter || bookingType === bookingTypeFilter;

            const checkInDate = new Date(b.checkIn);
            const checkOutDate = new Date(b.checkOut);
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;

            const matchesDate =
                (!from || checkInDate >= from) &&
                (!to || checkOutDate <= to);

            return matchesSearch && matchesStatus && matchesType && matchesDate;
        });
    }, [bookings, searchTerm, statusFilter, bookingTypeFilter, dateFrom, dateTo]);

    // Pagination logic
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


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
            console.error("Error:", err);
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 mb-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Vacant</span>
                    <span className="text-2xl font-bold">{kpis.vacant}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Checked In</span>
                    <span className="text-2xl font-bold">{kpis.checkedIn}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <span className="text-gray-500 dark:text-gray-300">Checked Out</span>
                    <span className="text-2xl font-bold">{kpis.checkedOut}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
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

                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Status</label>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All</option>
                        <option value="Booked">Vacant</option>
                        <option value="InHouse">Checked In</option>
                        <option value="CheckedOut">Checked Out</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="NoShow">NoShow</option>
                    </select>
                </div>


                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Booking Type</label>
                    <select
                        value={bookingTypeFilter}
                        onChange={e => setBookingTypeFilter(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All</option>
                        <option value="Group">Group</option>
                        <option value="Company">Company</option>
                        <option value="Individual">Individual</option>
                    </select>
                </div>

                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    {canAdd && (
                        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Booking</button>
                    )}
                    {canAdd && (
                        <button onClick={() => setShowBulkModal(true)} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 w-full md:w-auto">+ Bulk Booking</button>
                    )}
                </div>
            </div>

            {/* Bookings Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedBookings.length > 0 ? (
                        paginatedBookings.map((b) => {
                            const isGroup = !!b.group?.name;
                            const isCompany = !!b.company?.name;
                            const bookingType = isGroup ? "Group" : isCompany ? "Company" : "Individual";

                            return (
                                <div key={b.id} className="p-4 rounded-2xl shadow-lg cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105 hover:shadow-xl flex flex-col justify-between">

                                    {/* Guest & Property */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">{b.property?.name}</p>

                                            {/* Group / Company name */}
                                            {isGroup && <span className="inline-block mt-1 text-indigo-700 dark:text-indigo-300 font-medium text-sm">{b.group.name}</span>}
                                            {isCompany && <span className="inline-block mt-1 text-orange-700 dark:text-orange-300 font-medium text-sm">{b.company.name}</span>}
                                        </div>

                                        {/* Status & Booking Type Badge */}
                                        <div className="flex items-center gap-2">
                                            {/* Small Booking Type Badge */}
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${b.group?.name ? "bg-indigo-500 text-white" : b.company?.name ? "bg-orange-500 text-white" : "bg-gray-500 text-white"}`}>
                                                {b.group?.name ? "Group" : b.company?.name ? "Company" : "Individual"}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded ${b.status === "CHECKED_IN" ? "bg-green-500 text-white" : b.status === "CHECKED_OUT" ? "bg-blue-500 text-white" : b.status === "CANCELLED" || b.status === "NOSHOW" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"}`}>
                                                {b.status}
                                            </span>
                                        </div>
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
                                        {canEdit && (
                                            <button
                                                onClick={e => { e.stopPropagation(); setEditBooking(b); }}
                                                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}

                                        {canCheckinCheckout && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openConfirm("هل تريد عمل Check-in لهذا الحجز؟", () => handleAction(b.id, "checkin"));
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                                            >
                                                Check-in
                                            </button>
                                        )}

                                        {canCheckinCheckout && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openConfirm("هل تريد عمل Check-out لهذا الحجز؟", () => handleAction(b.id, "checkout"));
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                                            >
                                                Check-out
                                            </button>
                                        )}

                                        {canCancelNoshow && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openConfirm("هل تريد إلغاء هذا الحجز؟", () => handleAction(b.id, "cancel"));
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {canCancelNoshow && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openConfirm("هل تريد تسجيل NoShow لهذا الحجز؟", () => handleAction(b.id, "noshow"));
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                                            >
                                                NoShow
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openConfirm("هل أنت متأكد من حذف هذا الحجز؟", () => handleAction(b.id, "delete"));
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
                                            >
                                                🗑 Delete
                                            </button>
                                        )}

                                        {canFolio && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    router.push(`/bookings/${b.id}/folio`);
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600"
                                            >
                                                Folio
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="px-2 text-sm">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modals */}
            {showAddModal && canAdd && <AddBookingModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} groups={groups} />}
            {showBulkModal && canAdd && <BulkBookingModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
            {editBooking && canEdit && <EditBookingModal booking={editBooking} isOpen={!!editBooking} onClose={() => setEditBooking(null)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
            <ConfirmationModal
                open={confirmOpen}
                message={confirmMessage}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                loading={confirmLoading}
            />
        </div>
    );
}