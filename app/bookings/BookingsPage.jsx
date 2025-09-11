'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddBookingModal from "@/app/components/AddBookingModal";
import EditBookingModal from "@/app/components/EditBookingModal";
import BulkBookingModal from "@/app/components/BulkBookingModal";
import { useRouter } from "next/navigation";

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
    const [processingId, setProcessingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const socket = useSocket();
    const role = session?.user?.role || "Guest"; // دور المستخدم

    const canAdd = ["Admin", "FrontDesk"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);
    const canCheckinCheckout = ["Admin", "FrontDesk"].includes(role);
    const canCancelNoshow = ["Admin", "FrontDesk"].includes(role);
    const canFolio = ["Admin", "FrontDesk", "Manager"].includes(role);

    // 🔍 جلب الحجوزات
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

        if (!socket) return;
        socket.on("BOOKING_CREATED", (freshBooking) => setBookings(prev => [...prev, freshBooking]));
        socket.on("BOOKING_UPDATED", (updatedBooking) => setBookings(prev =>
            prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
        ));
        socket.on("BOOKING_DELETED", ({ id }) => setBookings(prev => prev.filter(b => b.id !== id)));

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

    const handleAction = async (id, action) => {
        // صلاحيات
        if (action === "delete" && !canDelete) return alert("ليس لديك صلاحية لحذف الحجز");
        if ((action === "checkin" || action === "checkout") && !canCheckinCheckout) return alert("ليس لديك صلاحية لهذا الإجراء");
        if ((action === "cancel" || action === "noshow") && !canCancelNoshow) return alert("ليس لديك صلاحية لهذا الإجراء");

        if (action === "delete" && !confirm("هل أنت متأكد من حذف الحجز؟")) return;

        setProcessingId(id);
        try {
            const method = action === "delete" ? "DELETE" : "POST";
            const res = await fetch(`/api/bookings/${id}/${action === "delete" ? "" : action}`, { method });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const msg = errBody?.error || `${action} failed`;
                throw new Error(msg);
            }
            const data = action === "delete" ? null : await res.json();

            if (action === "delete") setBookings(prev => prev.filter(b => b.id !== id));
            else setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        } catch (err) {
            console.error(err);
            alert(err.message || "Operation failed");
        } finally {
            setProcessingId(null);
        }
    };

    const calculateGrandTotal = (booking) => {
        if (!booking?.folio) return 0;
        return (booking.folio.charges || []).reduce(
            (sum, c) => sum + Number(c.amount || 0) + Number(c.tax || 0),
            0
        );
    };



    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
                <h1 className="text-2xl font-bold dark:text-white">Bookings</h1>

                <div className="flex gap-2 flex-wrap">
                    <input type="text" placeholder="🔍 Search bookings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <label htmlFor="">الى</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <label htmlFor="">من</label>

                    {canAdd && <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Booking</button>}
                    {canAdd && <button onClick={() => setShowBulkModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">+ Bulk Booking</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.length > 0 ? (
                    bookings.map(b => (
                        <div key={b.id} className="p-4 rounded-lg shadow cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105" onClick={() => setSelectedBooking(b)}>
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
                                <div className="flex gap-1 flex-wrap">
                                    {canEdit && <button onClick={e => { e.stopPropagation(); setEditBooking(b); }} className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200">✏️ Edit</button>}
                                    {canCheckinCheckout && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "checkin"); }} className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600">Check-in</button>}
                                    {canCheckinCheckout && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "checkout"); }} className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Check-out</button>}
                                    {canCancelNoshow && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "cancel"); }} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600">Cancel</button>}
                                    {canCancelNoshow && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "noshow"); }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">NoShow</button>}
                                    {canDelete && <button onClick={e => { e.stopPropagation(); handleAction(b.id, "delete"); }} className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800">🗑 Delete</button>}
                                    {canFolio && <button onClick={e => { e.stopPropagation(); router.push(`/bookings/${b.id}/folio`); }} className="text-xs px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600">Folio</button>}
                                </div>
                            </div>
                            <p><b>Room:</b> {b.room?.number || "N/A"}</p>
                            <p><b>Check-In:</b> {new Date(b.checkIn).toLocaleDateString()}</p>
                            <p><b>Check-Out:</b> {new Date(b.checkOut).toLocaleDateString()}</p>
                            <p><b>Status:</b> {b.status}</p>
                            <p><b>Grand Total:</b> ${calculateGrandTotal(b).toFixed(2)}</p>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
                )}
            </div>

            {showAddModal && canAdd && <AddBookingModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
            {showBulkModal && canAdd && <BulkBookingModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}
            {editBooking && canEdit && <EditBookingModal booking={editBooking} isOpen={!!editBooking} onClose={() => setEditBooking(null)} properties={properties} guests={guests} rooms={rooms} ratePlans={ratePlans} companies={companies} />}

            {selectedBooking && canFolio && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{selectedBooking.guest?.firstName} {selectedBooking.guest?.lastName}</h2>
                        <p><b>Property:</b> {selectedBooking.property?.name}</p>
                        <p><b>Room:</b> {selectedBooking.room?.number || "N/A"}</p>
                        <p><b>Check-In:</b> {new Date(selectedBooking.checkIn).toLocaleString()}</p>
                        <p><b>Check-Out:</b> {new Date(selectedBooking.checkOut).toLocaleString()}</p>
                        <p><b>Status:</b> {selectedBooking.status}</p>
                        <p><b>Adults:</b> {selectedBooking.adults}</p>
                        <p><b>Children:</b> {selectedBooking.children}</p>
                        <p><b>Rate Plan:</b> {selectedBooking.ratePlan?.name || "N/A"}</p>
                        <p><b>Company:</b> {selectedBooking.company?.name || "N/A"}</p>
                        <p><b>Special Requests:</b> {selectedBooking.specialRequests || "None"}</p>
                        <p><b>Grand Total:</b> ${calculateGrandTotal(selectedBooking).toFixed(2)}</p>
                        <div className="mt-4 text-right">
                            <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
