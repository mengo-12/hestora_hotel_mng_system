'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddBookingModal({ isOpen, onClose, properties, guests, ratePlans, companies }) {
    const socket = useSocket();

    const [selectedProperty, setSelectedProperty] = useState("");
    const [availableRooms, setAvailableRooms] = useState([]);
    const [filteredGuests, setFilteredGuests] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedGuest, setSelectedGuest] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [ratePlanId, setRatePlanId] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    // جلب النزلاء عند تغيير الـ property
    useEffect(() => {
        if (!selectedProperty) {
            setFilteredGuests([]);
            return;
        }
        const filtered = guests.filter(g => g.propertyId === selectedProperty);
        setFilteredGuests(filtered);
        setSelectedGuest(""); // إعادة تعيين النزيل المختار
    }, [selectedProperty, guests]);

    // جلب الغرف المتاحة عند اختيار property أو تغيير التواريخ
    useEffect(() => {
        const fetchAvailableRooms = async () => {
            if (!selectedProperty || !checkIn || !checkOut) return;

            try {
                const res = await fetch(`/api/rooms/available?propertyId=${selectedProperty}&checkIn=${checkIn}&checkOut=${checkOut}`);
                const text = await res.text();
                let data = [];
                try { data = JSON.parse(text); } catch(e) { console.error("Invalid JSON from /api/rooms/available:", text); }
                setAvailableRooms(data);
                setSelectedRoom(""); // إعادة تعيين الغرفة المختارة
            } catch (err) {
                console.error("Failed to fetch available rooms:", err);
            }
        };

        fetchAvailableRooms();
    }, [selectedProperty, checkIn, checkOut]);

    const handleSubmit = async () => {
        if (!selectedProperty || !selectedGuest || !selectedRoom || !checkIn || !checkOut) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const payload = {
                propertyId: selectedProperty,
                guestId: selectedGuest,
                roomId: selectedRoom,
                checkIn,
                checkOut,
                adults,
                children,
                ratePlanId: ratePlanId || null,
                companyId: companyId || null,
                specialRequests: specialRequests || null
            };

            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                let data = {};
                try { data = JSON.parse(text); } catch {}
                throw new Error(data.error || "Failed to create booking");
            }

            const booking = await res.json();

            // بث عالمي
            if (socket) {
                socket.emit("BOOKING_CREATED", booking);
            } else {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_CREATED", data: booking }),
                });
            }

            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Add Booking</h2>

                <div className="space-y-2">
                    <label>Property *</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full border rounded p-1">
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <label>Guest *</label>
                    <select value={selectedGuest} onChange={e => setSelectedGuest(e.target.value)} className="w-full border rounded p-1">
                        <option value="">Select Guest</option>
                        {filteredGuests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                    </select>

                    <label>Check-In *</label>
                    <input type="datetime-local" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border rounded p-1" />

                    <label>Check-Out *</label>
                    <input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border rounded p-1" />

                    <label>Available Room *</label>
                    <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="w-full border rounded p-1">
                        <option value="">Select Room</option>
                        {availableRooms.map(r => (
                            <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>
                        ))}
                    </select>

                    <label>Adults</label>
                    <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded p-1" />

                    <label>Children</label>
                    <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded p-1" />

                    <label>Rate Plan</label>
                    <select value={ratePlanId} onChange={e => setRatePlanId(e.target.value)} className="w-full border rounded p-1">
                        <option value="">Select Rate Plan</option>
                        {ratePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
                    </select>

                    <label>Company</label>
                    <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full border rounded p-1">
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <label>Special Requests</label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border rounded p-1" />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Booking</button>
                </div>
            </div>
        </div>
    );
}
