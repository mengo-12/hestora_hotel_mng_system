'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddBookingModal from "@/app/components/AddBookingModal";
import EditBookingModal from "@/app/components/EditBookingModal";
import BulkBookingModal from "@/app/components/BulkBookingModal"; // مودال الحجز الجماعي

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editBooking, setEditBooking] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false); // حالة المودال الجماعي
    const [properties, setProperties] = useState([]);
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [ratePlans, setRatePlans] = useState([]);
    const [companies, setCompanies] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        fetchBookings();
        fetchProperties();
        fetchGuests();
        fetchRooms();
        fetchRatePlans();
        fetchCompanies();

        if (socket) {
            socket.on("BOOKING_CREATED", (booking) => setBookings(prev => [...prev, booking]));
            socket.on("BOOKING_UPDATED", (updatedBooking) => 
                setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b))
            );
            socket.on("BOOKING_DELETED", (bookingId) => 
                setBookings(prev => prev.filter(b => b.id !== bookingId))
            );
        }

        return () => {
            if (socket) {
                socket.off("BOOKING_CREATED");
                socket.off("BOOKING_UPDATED");
                socket.off("BOOKING_DELETED");
            }
        };
    }, [socket]);

    const fetchBookings = async () => {
        const res = await fetch("/api/bookings");
        setBookings(await res.json());
    };

    const fetchProperties = async () => setProperties(await (await fetch("/api/properties")).json());
    const fetchGuests = async () => setGuests(await (await fetch("/api/guests")).json());
    const fetchRooms = async () => setRooms(await (await fetch("/api/rooms")).json());
    const fetchRatePlans = async () => setRatePlans(await (await fetch("/api/ratePlans")).json());
    const fetchCompanies = async () => setCompanies(await (await fetch("/api/companies")).json());

    const handleDelete = async (booking) => {
        if (!confirm(`Are you sure you want to delete booking for ${booking.guest?.firstName} ${booking.guest?.lastName}?`)) return;
        try {
            const res = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json()).error || "Failed to delete booking");

            // بث عالمي
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_DELETED", data: booking.id }),
            });

            setBookings(prev => prev.filter(b => b.id !== booking.id));
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6 gap-2">
                <h1 className="text-2xl font-bold dark:text-white">Bookings</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        + Add Booking
                    </button>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                        + Bulk Booking
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map(b => (
                    <div
                        key={b.id}
                        className="p-4 rounded-lg shadow cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105"
                        onClick={() => setSelectedBooking(b)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold">{b.guest?.firstName} {b.guest?.lastName}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditBooking(b); }}
                                    className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(b); }}
                                    className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                        <p><b>Room:</b> {b.room?.number || "N/A"}</p>
                        <p><b>Check-In:</b> {new Date(b.checkIn).toLocaleString()}</p>
                        <p><b>Check-Out:</b> {new Date(b.checkOut).toLocaleString()}</p>
                        <p><b>Status:</b> {b.status}</p>
                    </div>
                ))}
            </div>

            {/* مودال الإضافة الفردي */}
            {showAddModal && (
                <AddBookingModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    properties={properties}
                    guests={guests}
                    rooms={rooms}
                    ratePlans={ratePlans}
                    companies={companies}
                />
            )}

            {/* مودال الإضافة الجماعي */}
            {showBulkModal && (
                <BulkBookingModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    properties={properties}
                    guests={guests}
                    rooms={rooms}
                    ratePlans={ratePlans}
                    companies={companies}
                />
            )}

            {/* مودال التعديل */}
            {editBooking && (
                <EditBookingModal
                    booking={editBooking}
                    isOpen={!!editBooking}
                    onClose={() => setEditBooking(null)}
                    properties={properties}
                    guests={guests}
                    rooms={rooms}
                    ratePlans={ratePlans}
                    companies={companies}
                />
            )}

            {/* تفاصيل الحجز عند الضغط */}
            {selectedBooking && (
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
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
