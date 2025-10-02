'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddBookingModal({ isOpen, onClose, properties, guests, companies, groups }) {
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
    const [groupId, setGroupId] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    // --- Extras ---
    const [extras, setExtras] = useState([]);
    const [extraName, setExtraName] = useState("");
    const [extraPrice, setExtraPrice] = useState("");
    const [extraQty, setExtraQty] = useState(1);
    const [extraTax, setExtraTax] = useState("");

    // --- تحديد بيانات الغرفة و Rate Plans ---
    const selectedRoomData = availableRooms.find(r => r.id === selectedRoom) || {};
    const ratePlansForRoom = selectedRoomData.roomType?.ratePlans || [];
    const selectedRatePlanData = ratePlansForRoom.find(rp => rp.id === selectedRatePlan) || {};

    // --- فلترة النزلاء حسب العقار ---
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

    // --- جلب الغرف المتاحة ---
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
    const roomPrice = Number(selectedRatePlanData?.basePrice || selectedRoomData.roomType?.basePrice || 0);
    const roomTaxPercent = Number(selectedRatePlanData?.taxPercent || 0);
    const roomTax = (roomPrice * roomTaxPercent) / 100;

    const extrasSubtotal = extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
    const extrasTax = extras.reduce((sum, ex) => sum + ((ex.price * ex.quantity * (ex.tax || 0)) / 100), 0);

    const subtotal = roomPrice + extrasSubtotal;
    const totalTax = roomTax + extrasTax;
    const grandTotal = subtotal + totalTax;

    // --- Submit booking ---
    const handleSubmit = async () => {
        if (!selectedProperty || !selectedGuest || !checkIn || !checkOut) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const payload = {
                propertyId: selectedProperty,
                guestId: selectedGuest,
                roomId: selectedRoom || null,
                checkIn,
                checkOut,
                adults,
                children,
                ratePlanId: selectedRatePlan || null,
                companyId: companyId || null,
                groupId: groupId || null,
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
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to create booking");
            }

            const booking = await res.json();

            if (socket) socket.emit("BOOKING_CREATED", booking);

            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-[900px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">➕ Add Booking</h2>

                {/* Booking Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Property *</label>
                            <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Property</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Guest *</label>
                            <select value={selectedGuest} onChange={e => setSelectedGuest(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Guest</option>
                                {filteredGuests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Check-In *</label>
                            <input type="datetime-local" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Check-Out *</label>
                            <input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Available Room</label>
                            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Room</option>
                                {availableRooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Rate Plan</label>
                            <select value={selectedRatePlan} onChange={e => setSelectedRatePlan(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Rate Plan</option>
                                {ratePlansForRoom.map(rp => (
                                    <option key={rp.id} value={rp.id}>{rp.name} ({rp.code})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Adults</label>
                                <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Children</label>
                                <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Company</label>
                            <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Company</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Group</label>
                            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Group</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Special Requests</label>
                            <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>
                    </div>
                </div>

                {/* Extras Section */}
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Extras / Services</h3>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        <input type="text" placeholder="Service Name" value={extraName} onChange={e => setExtraName(e.target.value)} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <input type="number" placeholder="Price" value={extraPrice} onChange={e => setExtraPrice(e.target.value)} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <input type="number" placeholder="Qty" min={1} value={extraQty} onChange={e => setExtraQty(Number(e.target.value))} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <input type="number" placeholder="Tax %" value={extraTax} onChange={e => setExtraTax(e.target.value)} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <button onClick={addExtra} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
                    </div>

                    {extras.length > 0 && (
                        <table className="w-full border rounded-lg overflow-hidden text-sm">
                            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <tr>
                                    <th className="p-2 text-left">Name</th>
                                    <th className="p-2 text-left">Price</th>
                                    <th className="p-2 text-left">Qty</th>
                                    <th className="p-2 text-left">Tax</th>
                                    <th className="p-2 text-left">Total</th>
                                    <th className="p-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extras.map((ex, idx) => (
                                    <tr key={idx} className="border-t dark:border-gray-600">
                                        <td className="p-2">{ex.name}</td>
                                        <td className="p-2">${ex.price}</td>
                                        <td className="p-2">{ex.quantity}</td>
                                        <td className="p-2">{ex.tax}%</td>
                                        <td className="p-2">${((ex.price * ex.quantity) + ((ex.price * ex.quantity * (ex.tax || 0)) / 100)).toFixed(2)}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeExtra(idx)} className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Totals */}
                <div className="mt-6 text-right space-y-1 text-gray-700 dark:text-gray-200">
                    <p>Room Price: <span className="font-semibold">${roomPrice.toFixed(2)}</span></p>
                    <p>Extras Subtotal: <span className="font-semibold">${extrasSubtotal.toFixed(2)}</span></p>
                    <p>Subtotal: <span className="font-semibold">${subtotal.toFixed(2)}</span></p>
                    <p>Taxes: <span className="font-semibold">${totalTax.toFixed(2)}</span></p>
                    <p className="text-lg font-bold">Grand Total: ${grandTotal.toFixed(2)}</p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Booking</button>
                </div>
            </div>
        </div>
    );
}
