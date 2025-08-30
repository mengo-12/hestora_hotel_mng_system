// app/components/BulkBookingModal.jsx
"use client";
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function BulkBookingModal({ isOpen, onClose, properties, guests, ratePlans, companies }) {
    const socket = useSocket();
    const [selectedProperty, setSelectedProperty] = useState("");
    const [bookings, setBookings] = useState([
        { guestId: "", roomId: "", checkIn: "", checkOut: "", adults: 1, children: 0, ratePlanId: "", companyId: "", specialRequests: "" }
    ]);
    const [availableRoomsMap, setAvailableRoomsMap] = useState({});
    const [extrasMap, setExtrasMap] = useState({});
    const [ratePlanRulesMap, setRatePlanRulesMap] = useState({}); // تخزين rateRules لكل RatePlan

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

    // جلب rateRules لكل RatePlan
    useEffect(() => {
        const fetchRateRules = async () => {
            const map = {};
            for (const rp of ratePlans) {
                try {
                    const res = await fetch(`/api/ratePlans/${rp.id}/rules`);
                    map[rp.id] = await res.json();
                } catch (err) { map[rp.id] = []; }
            }
            setRatePlanRulesMap(map);
        };
        fetchRateRules();
    }, [ratePlans]);

    const handleChange = (index, field, value) => {
        const newBookings = [...bookings];
        newBookings[index][field] = value;
        setBookings(newBookings);
    };

    const addRow = () => {
        setBookings([...bookings, { guestId: "", roomId: "", checkIn: "", checkOut: "", adults: 1, children: 0, ratePlanId: "", companyId: "", specialRequests: "" }]);
    };

    const removeRow = (index) => {
        setBookings(bookings.filter((_, i) => i !== index));
        setAvailableRoomsMap(prev => { const copy = { ...prev }; delete copy[index]; return copy; });
        setExtrasMap(prev => { const copy = { ...prev }; delete copy[index]; return copy; });
    };

    const addExtra = (i, extra) => {
        setExtrasMap(prev => ({ ...prev, [i]: [...(prev[i] || []), extra] }));
    };

    const removeExtra = (i, idx) => {
        setExtrasMap(prev => ({ ...prev, [i]: prev[i].filter((_, j) => j !== idx) }));
    };

    const calculateTotals = (i) => {
        const booking = bookings[i];
        const roomData = (availableRoomsMap[i] || []).find(r => r.id === booking.roomId) || {};
        let roomTotal = 0;

        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1;

        // حساب السعر اليومي حسب RateRules
        if (booking.ratePlanId && ratePlanRulesMap[booking.ratePlanId]) {
            const rules = ratePlanRulesMap[booking.ratePlanId];
            for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
                const rule = rules.find(r => new Date(r.date).toDateString() === d.toDateString());
                roomTotal += rule ? (rule.priceOverride ? Number(rule.priceOverride) : Number(rule.basePrice)) : Number(roomData.price || 0);
            }
        } else {
            roomTotal = (roomData.price || 0) * nights;
        }

        const extras = extrasMap[i] || [];
        let extrasTotal = 0;
        extras.forEach(ex => {
            const subTotal = ex.price * ex.quantity;
            const tax = ex.tax > 1 ? subTotal * (ex.tax / 100) : subTotal * ex.tax;
            extrasTotal += subTotal + tax;
        });

        return { roomPrice: roomTotal, extrasTotal, grandTotal: roomTotal + extrasTotal };
    };

    const handleSubmit = async () => {
        try {
            for (const booking of bookings) {
                if (!booking.guestId || !booking.roomId || !booking.checkIn || !booking.checkOut) {
                    alert("Please fill all required fields for all bookings.");
                    return;
                }
            }

            const payload = {
                propertyId: selectedProperty,
                bookings: bookings.map((b, i) => {
                    const totals = calculateTotals(i);
                    return {
                        ...b,
                        propertyId: selectedProperty,
                        extras: (extrasMap[i] || []).map(ex => ({ ...ex })),
                        totalAmount: totals.grandTotal
                    };
                })
            };

            const res = await fetch("/api/bookings/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create bookings");
            }

            const createdBookings = await res.json();
            createdBookings.forEach(b => { if (socket) socket.emit("BOOKING_CREATED", b); });
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-lg w-[95%] max-h-[95vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Bulk Booking</h2>

                <div className="mb-4">
                    <label className="block mb-1">Property *</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-700">
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {bookings.map((b, i) => {
                    const { roomPrice, extrasTotal, grandTotal } = calculateTotals(i);

                    return (
                        <div key={i} className="mb-6 p-4 border rounded space-y-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Booking #{i + 1}</h4>
                                <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-600">Remove</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label>Guest *</label>
                                    <select value={b.guestId} onChange={e => handleChange(i, "guestId", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">Select Guest</option>
                                        {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                                    </select>

                                    <label>Check-In *</label>
                                    <input type="datetime-local" value={b.checkIn} onChange={e => handleChange(i, "checkIn", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600" />

                                    <label>Check-Out *</label>
                                    <input type="datetime-local" value={b.checkOut} onChange={e => handleChange(i, "checkOut", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600" />

                                    <label>Available Room *</label>
                                    <select value={b.roomId} onChange={e => handleChange(i, "roomId", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">Select Room</option>
                                        {(availableRoomsMap[i] || []).map(r => <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>)}
                                    </select>

                                    <label>Adults</label>
                                    <input type="number" min={1} value={b.adults} onChange={e => handleChange(i, "adults", Number(e.target.value))} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600" />

                                    <label>Children</label>
                                    <input type="number" min={0} value={b.children} onChange={e => handleChange(i, "children", Number(e.target.value))} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600" />

                                    <label>Rate Plan</label>
                                    <select value={b.ratePlanId} onChange={e => handleChange(i, "ratePlanId", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">Select Rate Plan</option>
                                        {ratePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
                                    </select>

                                    <label>Company</label>
                                    <select value={b.companyId} onChange={e => handleChange(i, "companyId", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600">
                                        <option value="">Select Company</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>

                                    <label>Special Requests</label>
                                    <textarea value={b.specialRequests} onChange={e => handleChange(i, "specialRequests", e.target.value)} className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>

                            {/* Extras */}
                            <div className="mt-3 border-t pt-2 dark:border-gray-600">
                                <h5 className="font-semibold mb-1">Extras / Services</h5>
                                <ExtraForm onAdd={(ex) => addExtra(i, ex)} />
                                {(extrasMap[i] || []).length > 0 && (
                                    <ul className="mt-2">
                                        {extrasMap[i].map((ex, idx) => (
                                            <li key={idx} className="flex justify-between border-b py-1 dark:border-gray-700">
                                                <span>{ex.name} - {ex.price} x {ex.quantity} + Tax {ex.tax}</span>
                                                <button onClick={() => removeExtra(i, idx)} className="text-red-500">X</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="text-right font-semibold">
                                <p>Room: ${roomPrice.toFixed(2)}</p>
                                <p>Extras: ${extrasTotal.toFixed(2)}</p>
                                <p className="text-lg">Grand Total: ${grandTotal.toFixed(2)}</p>
                            </div>
                        </div>
                    );
                })}

                <div className="flex justify-between mb-4">
                    <button onClick={addRow} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add Row</button>
                    <div>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded mr-2 hover:bg-gray-600">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Bookings</button>
                    </div>
                </div>

                {/* Group Total */}
                <div className="border-t pt-4 mt-4 text-right dark:border-gray-600">
                    <h3 className="text-lg font-bold">
                        Group Total: $
                        {bookings.reduce((sum, _, i) => sum + calculateTotals(i).grandTotal, 0).toFixed(2)}
                    </h3>
                </div>
            </div>
        </div>
    );
}

function ExtraForm({ onAdd }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [qty, setQty] = useState(1);
    const [tax, setTax] = useState("");

    const handleAdd = () => {
        if (!name || !price || qty < 1) return alert("Fill service details");
        onAdd({ name, price: Number(price), quantity: Number(qty), tax: tax ? Number(tax) : 0 });
        setName(""); setPrice(""); setQty(1); setTax("");
    };

    return (
        <div className="grid grid-cols-5 gap-2 items-end mb-2">
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600" />
            <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600" />
            <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className="border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600" />
            <input type="number" placeholder="Tax" value={tax} onChange={e => setTax(e.target.value)} className="border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600" />
            <button onClick={handleAdd} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Add</button>
        </div>
    );
}
