'use client';
import { useState, useEffect } from "react";
import EditGroupBookingModal from "./EditGroupBookingModal";

export default function GroupBookingsTable({ group, properties, roomTypes, guests, session }) {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        async function fetchBookings() {
            if (!group?.id) return;

            try {
                const res = await fetch(`/api/groupBookings?groupId=${group.id}`);
                if (!res.ok) throw new Error("Failed to fetch bookings");
                const data = await res.json();
                setBookings(data);
            } catch (err) {
                console.error("Failed to fetch group bookings:", err);
                setBookings([]);
            }
        }

        fetchBookings();
    }, [group?.id]);

    const handleBookingUpdated = (updated) => {
        setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full table-auto border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border px-2 py-1">Guest</th>
                        <th className="border px-2 py-1">Room Type</th>
                        <th className="border px-2 py-1">Check-In</th>
                        <th className="border px-2 py-1">Check-Out</th>
                        <th className="border px-2 py-1">Adults</th>
                        <th className="border px-2 py-1">Children</th>
                        <th className="border px-2 py-1">Extras</th>
                        <th className="border px-2 py-1">Folio</th>
                        <th className="border px-2 py-1">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                        <tr key={b.id}>
                            <td className="border px-2 py-1">{b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : "-"}</td>
                            <td className="border px-2 py-1">{b.roomType ? b.roomType.name : "-"}</td>
                            <td className="border px-2 py-1">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "-"}</td>
                            <td className="border px-2 py-1">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "-"}</td>
                            <td className="border px-2 py-1">{b.adults || 0}</td>
                            <td className="border px-2 py-1">{b.children || 0}</td>
                            <td className="border px-2 py-1">{b.extras?.length || 0}</td>
                            <td className="border px-2 py-1">{b.folios?.length || 0}</td>
                            <td className="border px-2 py-1">
                                <button
                                    onClick={() => { setSelectedBooking(b); setEditModalOpen(true); }}
                                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editModalOpen && selectedBooking && (
                <EditGroupBookingModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    booking={selectedBooking}
                    properties={properties}
                    roomTypes={roomTypes}
                    guests={guests}
                    onBookingUpdated={handleBookingUpdated}
                    session={session}
                />
            )}
        </div>
    );
}
