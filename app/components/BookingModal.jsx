'use client';
import { useState, useEffect } from "react";
import { useSocket } from "./SocketProvider";

export default function BookingModal({ booking, onClose, onSaved }) {
    const [guestId, setGuestId] = useState(booking?.guestId || '');
    const [roomId, setRoomId] = useState(booking?.roomId || '');
    const [checkIn, setCheckIn] = useState(booking?.checkIn ? booking.checkIn.slice(0, 10) : '');
    const [checkOut, setCheckOut] = useState(booking?.checkOut ? booking.checkOut.slice(0, 10) : '');
    const [status, setStatus] = useState(booking?.status || 'Booked');
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        fetch("/api/guests").then(r => r.json()).then(setGuests);
        fetch("/api/rooms").then(r => r.json()).then(setRooms);
    }, []);

    const saveBooking = async () => {
        const res = await fetch('/api/bookings', {
            method: booking ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: booking?.id, guestId, roomId, checkIn, checkOut, status }),
        });
        const data = await res.json();
        if (socket) socket.emit('BOOKING_UPDATED', data);
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl font-bold mb-4">{booking ? 'Edit Booking' : 'New Booking'}</h2>
                <select className="w-full mb-2 p-2 border rounded" value={guestId} onChange={e => setGuestId(e.target.value)}>
                    <option value="">Select Guest</option>
                    {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                </select>
                <select className="w-full mb-2 p-2 border rounded" value={roomId} onChange={e => setRoomId(e.target.value)}>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.number}</option>)}
                </select>
                <input type="date" className="w-full mb-2 p-2 border rounded" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                <input type="date" className="w-full mb-2 p-2 border rounded" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                <select className="w-full mb-4 p-2 border rounded" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Booked">Booked</option>
                    <option value="InHouse">InHouse</option>
                    <option value="CheckedOut">CheckedOut</option>
                    <option value="NoShow">NoShow</option>
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={saveBooking} className="px-4 py-2 bg-green-500 text-white rounded">{booking ? 'Save' : 'Add'}</button>
                </div>
            </div>
        </div>
    );
}
