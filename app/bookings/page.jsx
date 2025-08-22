'use client';
import { useState, useEffect } from "react";
import BookingModal from "../components/BookingModal";
import { useSocket } from "../components/SocketProvider";

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalBooking, setModalBooking] = useState(null);
    const socket = useSocket();

    const fetchBookings = async () => {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        setBookings(data);
    };

    useEffect(() => { fetchBookings(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("BOOKING_UPDATED", (updatedBooking) => {
            setBookings(prev => {
                const index = prev.findIndex(b => b.id === updatedBooking.id);
                if (index !== -1) prev[index] = updatedBooking;
                else prev.push(updatedBooking);
                return [...prev];
            });
        });
        return () => socket.off("BOOKING_UPDATED");
    }, [socket]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Bookings</h1>
            <button
                onClick={() => { setModalBooking(null); setShowModal(true); }}
                className="bg-green-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Booking
            </button>

            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Room</th>
                        <th className="p-2">Check-In</th>
                        <th className="p-2">Check-Out</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                        <tr key={b.id} className="border-b">
                            <td className="p-2">{b.guest?.firstName} {b.guest?.lastName}</td>
                            <td className="p-2">{b.room?.number || "-"}</td>
                            <td className="p-2">{new Date(b.checkIn).toLocaleDateString()}</td>
                            <td className="p-2">{new Date(b.checkOut).toLocaleDateString()}</td>
                            <td className="p-2">{b.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <BookingModal
                    booking={modalBooking}
                    onClose={() => setShowModal(false)}
                    onSaved={() => fetchBookings()}
                />
            )}
        </div>
    );
}
