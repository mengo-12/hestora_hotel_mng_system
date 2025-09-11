'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddBookingModal({ isOpen, onClose, properties, guests, companies }) {
    const socket = useSocket();

    const [selectedProperty, setSelectedProperty] = useState("");
    const [availableRooms, setAvailableRooms] = useState([]);
    const [filteredGuests, setFilteredGuests] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedRatePlan, setSelectedRatePlan] = useState("");
    const [selectedGuest, setSelectedGuest] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [companyId, setCompanyId] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    // --- Extras ---
    const [extras, setExtras] = useState([]);
    const [extraName, setExtraName] = useState("");
    const [extraPrice, setExtraPrice] = useState("");
    const [extraQty, setExtraQty] = useState(1);
    const [extraTax, setExtraTax] = useState("");

    // --- بيانات الغرفة و Rate Plans ---
    const selectedRoomData = availableRooms.find(r => r.id === selectedRoom) || {};
    const ratePlansForRoom = selectedRoomData.roomType?.ratePlans || [];
    const selectedRatePlanData = ratePlansForRoom.find(rp => rp.id === selectedRatePlan);

    // --- Filter guests by property ---
    useEffect(() => {
        if (!selectedProperty) {
            setFilteredGuests([]);
            setSelectedGuest("");
            return;
        }
        const filtered = guests.filter(g => g.propertyId === selectedProperty);
        setFilteredGuests(filtered);
        setSelectedGuest("");
    }, [selectedProperty, guests]);

    // --- Fetch available rooms ---
    useEffect(() => {
        const fetchAvailableRooms = async () => {
            if (!selectedProperty || !checkIn || !checkOut) return;

            try {
                const res = await fetch(`/api/rooms/available?propertyId=${selectedProperty}&checkIn=${checkIn}&checkOut=${checkOut}`);
                const data = await res.json();
                setAvailableRooms(Array.isArray(data) ? data : []);
                setSelectedRoom("");
                setSelectedRatePlan("");
            } catch (err) {
                console.error("Failed to fetch available rooms:", err);
            }
        };

        fetchAvailableRooms();
    }, [selectedProperty, checkIn, checkOut]);

    // --- Reset Rate Plan when room changes ---
    useEffect(() => {
        setSelectedRatePlan("");
    }, [selectedRoom]);

    // --- Extras handlers ---
    const addExtra = () => {
        if (!extraName || !extraPrice || extraQty < 1) {
            alert("Please fill extra name, price, and quantity.");
            return;
        }
        setExtras([...extras, {
            name: extraName,
            price: Number(extraPrice),
            quantity: Number(extraQty),
            tax: extraTax ? Number(extraTax) : 0
        }]);
        setExtraName("");
        setExtraPrice("");
        setExtraQty(1);
        setExtraTax("");
    };

    const removeExtra = (index) => setExtras(extras.filter((_, i) => i !== index));
    const handleExtraChange = (index, field, value) => {
        const updated = [...extras];
        updated[index][field] = ["price", "quantity", "tax"].includes(field) ? Number(value) : value;
        setExtras(updated);
    };

    // --- حساب الأسعار ---
    const roomPrice = Number(selectedRatePlanData?.basePrice || 0);
    const extrasTotal = extras.reduce((sum, ex) => sum + (ex.price * ex.quantity + ex.tax), 0);
    const grandTotal = roomPrice + extrasTotal;

    // --- Submit booking ---
    const handleSubmit = async () => {
        if (!selectedProperty || !selectedGuest || !selectedRoom || !checkIn || !checkOut || !selectedRatePlan) {
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
                ratePlanId: selectedRatePlan,
                companyId: companyId || null,
                specialRequests: specialRequests || null,
                extras: extras.map(ex => ({
                    name: ex.name,
                    description: ex.description || "",
                    price: ex.price,
                    quantity: ex.quantity,
                    tax: ex.tax || 0
                })),
                totalAmount: grandTotal
            };

            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to create booking");
            }

            const booking = await res.json();

            // Broadcast
            if (socket) socket.emit("BOOKING_CREATED", booking);
            else await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_CREATED", data: booking }),
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Add Booking</h2>

                <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <div className="space-y-2">
                        <label>Available Room *</label>
                        <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Room</option>
                            {availableRooms.map(r => (
                                <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>
                            ))}
                        </select>

                        <label>Rate Plan *</label>
                        <select value={selectedRatePlan} onChange={e => setSelectedRatePlan(e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Rate Plan</option>
                            {ratePlansForRoom.map(rp => (
                                <option key={rp.id} value={rp.id}>{rp.name} ({rp.code}) - {rp.currency} {rp.basePrice}</option>
                            ))}
                        </select>

                        <label>Adults</label>
                        <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded p-1" />

                        <label>Children</label>
                        <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded p-1" />

                        <label>Company</label>
                        <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full border rounded p-1">
                            <option value="">Select Company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <label>Special Requests</label>
                        <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border rounded p-1" />
                    </div>
                </div>

                {/* Extras Table */}
                <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold mb-2">Extras / Services</h3>
                    <div className="grid grid-cols-5 gap-2 items-end mb-2">
                        <input type="text" placeholder="Service Name" value={extraName} onChange={e => setExtraName(e.target.value)} className="border rounded p-1" />
                        <input type="number" placeholder="Price" value={extraPrice} onChange={e => setExtraPrice(e.target.value)} className="border rounded p-1" />
                        <input type="number" placeholder="Qty" min={1} value={extraQty} onChange={e => setExtraQty(Number(e.target.value))} className="border rounded p-1" />
                        <input type="number" placeholder="Tax" value={extraTax} onChange={e => setExtraTax(e.target.value)} className="border rounded p-1" />
                        <button onClick={addExtra} className="px-2 py-1 bg-green-500 text-white rounded">Add</button>
                    </div>

                    {extras.length > 0 && (
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border p-1">Name</th>
                                    <th className="border p-1">Price</th>
                                    <th className="border p-1">Qty</th>
                                    <th className="border p-1">Tax</th>
                                    <th className="border p-1">Total</th>
                                    <th className="border p-1">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extras.map((ex, idx) => (
                                    <tr key={idx}>
                                        <td className="border p-1">
                                            <input type="text" value={ex.name} onChange={e => handleExtraChange(idx, "name", e.target.value)} className="w-full border rounded p-1" />
                                        </td>
                                        <td className="border p-1">
                                            <input type="number" value={ex.price} onChange={e => handleExtraChange(idx, "price", e.target.value)} className="w-full border rounded p-1" />
                                        </td>
                                        <td className="border p-1">
                                            <input type="number" min={1} value={ex.quantity} onChange={e => handleExtraChange(idx, "quantity", e.target.value)} className="w-full border rounded p-1" />
                                        </td>
                                        <td className="border p-1">
                                            <input type="number" value={ex.tax} onChange={e => handleExtraChange(idx, "tax", e.target.value)} className="w-full border rounded p-1" />
                                        </td>
                                        <td className="border p-1">${(ex.price * ex.quantity + ex.tax).toFixed(2)}</td>
                                        <td className="border p-1 text-center">
                                            <button onClick={() => removeExtra(idx)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Totals */}
                <div className="mt-4 text-right font-semibold">
                    <p>Room Total: ${roomPrice.toFixed(2)}</p>
                    <p>Extras Total: ${extrasTotal.toFixed(2)}</p>
                    <p className="text-lg">Grand Total: ${grandTotal.toFixed(2)}</p>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Booking</button>
                </div>
            </div>
        </div>
    );
}
