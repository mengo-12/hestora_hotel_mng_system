'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { v4 as uuidv4 } from "uuid";

export default function EditBookingModal({ booking, isOpen, onClose, properties, guests, rooms, companies, groups = [] }) {
    const socket = useSocket();
    const [form, setForm] = useState({ ...booking });
    const [ratePlans, setRatePlans] = useState([]);
    const [extras, setExtras] = useState([]);
    const [deletedIds, setDeletedIds] = useState([]);
    const [extraName, setExtraName] = useState("");
    const [extraPrice, setExtraPrice] = useState("");
    const [extraQty, setExtraQty] = useState(1);
    const [extraTax, setExtraTax] = useState(0);
    const [loading, setLoading] = useState(false);

    // --- جلب RatePlans حسب الفندق
    const fetchRatePlans = async (propertyId) => {
        if (!propertyId) return setRatePlans([]);
        try {
            const res = await fetch(`/api/rate-plans?propertyId=${propertyId}`);
            const data = await res.json();
            setRatePlans(Array.isArray(data) ? data : []);
        } catch (err) { console.error("Failed to fetch rate plans:", err); setRatePlans([]); }
    };

    useEffect(() => {
        if (isOpen && booking) {
            setForm({ ...booking });
            const mappedExtras = (booking.extras || []).map(e => ({
                id: e.id,
                tempId: uuidv4(),
                name: e.name,
                price: Number(e.unitPrice || 0),
                quantity: Number(e.quantity || 1),
                tax: Number(e.tax || 0),
                status: e.status || "Unpaid"
            }));
            setExtras(mappedExtras);
            setDeletedIds([]);
            fetchRatePlans(booking.propertyId);
        }
    }, [isOpen, booking]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === "propertyId") {
            fetchRatePlans(value);
            setForm(prev => ({ ...prev, ratePlanId: "" }));
        }
    };

    const handleExtraChange = (idx, field, value) => {
        const updated = [...extras];
        updated[idx][field] = value;
        setExtras(updated);
    };

    const addExtra = () => {
        if (!extraName || !extraPrice) return;
        const newExtra = {
            id: null,
            tempId: uuidv4(),
            name: extraName,
            price: Number(extraPrice),
            quantity: Number(extraQty) || 1,
            tax: Number(extraTax) || 0,
            status: "Unpaid"
        };
        setExtras(prev => [...prev, newExtra]);
        setExtraName(""); setExtraPrice(""); setExtraQty(1); setExtraTax(0);
    };

    const removeExtra = (idx) => {
        const ex = extras[idx];
        if (ex.id) setDeletedIds(prev => [...prev, ex.id]);
        setExtras(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = { ...form, extras, deletedIds };
            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update booking");
            }

            const updatedBooking = await res.json();
            const mappedExtras = (updatedBooking.extras || []).map(e => ({
                ...e,
                tempId: uuidv4()
            }));
            setForm(updatedBooking);
            setExtras(mappedExtras);
            setDeletedIds([]);
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // --- حساب الأسعار ---
    const roomPrice = Number(ratePlans.find(rp => rp.id === form.ratePlanId)?.basePrice || 0);
    const extrasSubtotal = extras.reduce((sum, ex) => sum + (Number(ex.price || 0) * Number(ex.quantity || 1)), 0);
    const extrasTax = extras.reduce((sum, ex) => sum + (Number(ex.price || 0) * Number(ex.quantity || 1) * (Number(ex.tax || 0)) / 100), 0);
    const subtotal = roomPrice + extrasSubtotal;
    const generalTax = (roomPrice * 15) / 100;
    const totalTax = generalTax + extrasTax;
    const grandTotal = subtotal + totalTax;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-[900px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">✏️ Edit Booking</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Property *</label>
                            <select name="propertyId" value={form.propertyId || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Property</option>
                                {properties?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Guest *</label>
                            <select name="guestId" value={form.guestId || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Guest</option>
                                {guests?.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Check-In *</label>
                            <input type="datetime-local" name="checkIn" value={form.checkIn?.slice(0,16) || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Check-Out *</label>
                            <input type="datetime-local" name="checkOut" value={form.checkOut?.slice(0,16) || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Room *</label>
                            <select name="roomId" value={form.roomId || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Room</option>
                                {rooms?.map(r => <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Rate Plan</label>
                            <select name="ratePlanId" value={form.ratePlanId || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Rate Plan</option>
                                {ratePlans?.map(rp => (
                                    <option key={rp.id} value={rp.id}>{rp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Company</label>
                            <select name="companyId" value={form.companyId || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Company</option>
                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Group</label>
                            <select name="groupId" value={form.groupId || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Group</option>
                                {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Special Requests</label>
                            <textarea name="specialRequests" value={form.specialRequests || ""} onChange={handleChange} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>
                    </div>
                </div>

                {/* Extras Section */}
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Extras / Services</h3>
                    <div className="grid grid-cols-5 gap-2 items-end mb-3">
                        <input type="text" placeholder="Service Name" value={extraName} onChange={e => setExtraName(e.target.value)} className="border rounded-lg p-2" />
                        <input type="number" placeholder="Price" value={extraPrice} onChange={e => setExtraPrice(e.target.value)} className="border rounded-lg p-2" />
                        <input type="number" placeholder="Qty" min={1} value={extraQty} onChange={e => setExtraQty(Number(e.target.value))} className="border rounded-lg p-2" />
                        <input type="number" placeholder="Tax %" value={extraTax} onChange={e => setExtraTax(e.target.value)} className="border rounded-lg p-2" />
                        <button onClick={addExtra} className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Add</button>
                    </div>

                    {extras.length > 0 && (
                        <table className="w-full border border-gray-300 dark:border-gray-600 text-sm">
                            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                <tr>
                                    <th className="border p-2">Name</th>
                                    <th className="border p-2">Price</th>
                                    <th className="border p-2">Qty</th>
                                    <th className="border p-2">Tax %</th>
                                    <th className="border p-2">Total</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extras.map((ex, idx) => {
                                    const lineSubtotal = Number(ex.price || 0) * Number(ex.quantity || 1);
                                    const lineTax = (lineSubtotal * Number(ex.tax || 0)) / 100;
                                    const lineTotal = lineSubtotal + lineTax;
                                    return (
                                        <tr key={ex.tempId}>
                                            <td className="border p-1">
                                                <input type="text" value={ex.name} onChange={e => handleExtraChange(idx, "name", e.target.value)} className="w-full p-1 border rounded" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" value={ex.price} onChange={e => handleExtraChange(idx, "price", Number(e.target.value))} className="w-full p-1 border rounded" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" min={1} value={ex.quantity} onChange={e => handleExtraChange(idx, "quantity", Number(e.target.value))} className="w-full p-1 border rounded" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" value={ex.tax} onChange={e => handleExtraChange(idx, "tax", Number(e.target.value))} className="w-full p-1 border rounded" />
                                            </td>
                                            <td className="border p-1 text-right">${lineTotal.toFixed(2)}</td>
                                            <td className="border p-1 text-center">
                                                <button onClick={() => removeExtra(idx)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Totals */}
                <div className="mt-6 text-right font-semibold space-y-1 text-gray-700 dark:text-gray-200">
                    <p>Room Price: ${roomPrice.toFixed(2)}</p>
                    <p>Extras Subtotal: ${extrasSubtotal.toFixed(2)}</p>
                    <p>Subtotal: ${subtotal.toFixed(2)}</p>
                    <p>Taxes: ${totalTax.toFixed(2)}</p>
                    <p className="text-lg font-bold">Grand Total: ${grandTotal.toFixed(2)}</p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {loading ? "Updating..." : "Update Booking"}
                    </button>
                </div>
            </div>
        </div>
    );
}




