'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function BulkBookingModal({ isOpen, onClose, properties, guests, ratePlans, companies }) {
    const socket = useSocket();
    const [selectedProperty, setSelectedProperty] = useState("");
    const [bookings, setBookings] = useState([{ guestId: "", roomId: "", checkIn: "", checkOut: "", adults: 1, children: 0, ratePlanId: "", companyId: "", specialRequests: "" }]);
    const [availableRoomsMap, setAvailableRoomsMap] = useState({}); // key: index, value: rooms for that row

    // جلب الغرف المتاحة لكل صف عند تغيير التاريخ أو الخاصية
    useEffect(() => {
        const fetchAvailableRoomsForRow = async (index, checkIn, checkOut) => {
            if (!selectedProperty || !checkIn || !checkOut) return;

            try {
                const res = await fetch(`/api/rooms/available?propertyId=${selectedProperty}&checkIn=${checkIn}&checkOut=${checkOut}`);
                const data = await res.json();
                setAvailableRoomsMap(prev => ({ ...prev, [index]: data }));
            } catch (err) {
                console.error("Failed to fetch available rooms:", err);
                setAvailableRoomsMap(prev => ({ ...prev, [index]: [] }));
            }
        };

        bookings.forEach((b, i) => {
            if (b.checkIn && b.checkOut) {
                fetchAvailableRoomsForRow(i, b.checkIn, b.checkOut);
            }
        });
    }, [selectedProperty, bookings]);

    const handleChange = (index, field, value) => {
        const newBookings = [...bookings];
        newBookings[index][field] = value;
        setBookings(newBookings);
    };

    const addRow = () => setBookings([...bookings, { guestId: "", roomId: "", checkIn: "", checkOut: "", adults: 1, children: 0, ratePlanId: "", companyId: "", specialRequests: "" }]);
    const removeRow = (index) => {
        setBookings(bookings.filter((_, i) => i !== index));
        setAvailableRoomsMap(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const handleSubmit = async () => {
        try {
            for (const booking of bookings) {
                if (!booking.guestId || !booking.roomId || !booking.checkIn || !booking.checkOut) {
                    alert("Please fill all required fields for all bookings.");
                    return;
                }
            }

            const res = await fetch("/api/bookings/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: selectedProperty, bookings }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create bookings");
            }

            const createdBookings = await res.json();

            // بث عالمي لكل حجز
            createdBookings.forEach(b => {
                if (socket) socket.emit("BOOKING_CREATED", b);
            });

            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Bulk Booking</h2>

                <div className="mb-4">
                    <label>Property *</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full border rounded p-1">
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {bookings.map((b, i) => (
                    <div key={i} className="mb-4 p-2 border rounded space-y-2">
                        <div className="flex justify-between items-center">
                            <h4>Booking #{i + 1}</h4>
                            <button onClick={() => removeRow(i)} className="text-red-500">Remove</button>
                        </div>

                        <label>Guest *</label>
                        <select value={b.guestId} onChange={e => handleChange(i, "guestId", e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Guest</option>
                            {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                        </select>

                        <label>Check-In *</label>
                        <input type="datetime-local" value={b.checkIn} onChange={e => handleChange(i, "checkIn", e.target.value)} className="w-full border rounded p-1" />

                        <label>Check-Out *</label>
                        <input type="datetime-local" value={b.checkOut} onChange={e => handleChange(i, "checkOut", e.target.value)} className="w-full border rounded p-1" />

                        <label>Available Room *</label>
                        <select value={b.roomId} onChange={e => handleChange(i, "roomId", e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Room</option>
                            {(availableRoomsMap[i] || []).map(r => <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>)}
                        </select>

                        <label>Adults</label>
                        <input type="number" min={1} value={b.adults} onChange={e => handleChange(i, "adults", Number(e.target.value))} className="w-full border rounded p-1" />

                        <label>Children</label>
                        <input type="number" min={0} value={b.children} onChange={e => handleChange(i, "children", Number(e.target.value))} className="w-full border rounded p-1" />

                        <label>Rate Plan</label>
                        <select value={b.ratePlanId} onChange={e => handleChange(i, "ratePlanId", e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Rate Plan</option>
                            {ratePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
                        </select>

                        <label>Company</label>
                        <select value={b.companyId} onChange={e => handleChange(i, "companyId", e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <label>Special Requests</label>
                        <textarea value={b.specialRequests} onChange={e => handleChange(i, "specialRequests", e.target.value)} className="w-full border rounded p-1" />
                    </div>
                ))}

                <div className="flex justify-between mb-4">
                    <button onClick={addRow} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add Row</button>
                    <div>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded mr-2">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Bookings</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
