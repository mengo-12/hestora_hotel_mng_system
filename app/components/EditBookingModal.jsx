'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { v4 as uuidv4 } from "uuid";

export default function EditBookingModal({ booking, isOpen, onClose, properties, guests, rooms, companies }) {
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
            if (Array.isArray(data)) setRatePlans(data);
            else setRatePlans([]);
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
                tax: Number(e.tax || 0), // نخزن النسبة (15)
                status: e.status || "Unpaid"
            }));
            setExtras(mappedExtras);
            setDeletedIds([]);

            // جلب RatePlans للفندق الحالي
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
            tax: Number(extraTax) || 0, // نسبة
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
    const calculateExtrasSubtotal = () => {
        return extras?.reduce((sum, ex) => {
            const price = Number(ex.price || 0);
            const qty = Number(ex.quantity || 1);
            return sum + price * qty;
        }, 0) || 0;
    };

    const calculateExtrasTax = () => {
        return extras?.reduce((sum, ex) => {
            const price = Number(ex.price || 0);
            const qty = Number(ex.quantity || 1);
            const taxRate = Number(ex.tax || 0); // نسبة مئوية
            return sum + (price * qty * taxRate) / 100;
        }, 0) || 0;
    };

    const selectedRatePlanData = ratePlans.find(rp => rp.id === form.ratePlanId);
    const roomPrice = Number(selectedRatePlanData?.basePrice || 0);

    const extrasSubtotal = calculateExtrasSubtotal();
    const extrasTax = calculateExtrasTax();

    // المجموع الفرعي
    const subtotal = roomPrice + extrasSubtotal;

    // الضريبة العامة على الغرفة (مثلاً 15%)
    const generalTax = (roomPrice * 15) / 100;
    const totalTax = generalTax + extrasTax;

    // الإجمالي
    const grandTotal = subtotal + totalTax;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Edit Booking</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label>Property *</label>
                        <select name="propertyId" value={form.propertyId || ""} onChange={handleChange} className="w-full border rounded p-1">
                            <option value="">Select Property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>

                        <label>Guest *</label>
                        <select name="guestId" value={form.guestId || ""} onChange={handleChange} className="w-full border rounded p-1">
                            <option value="">Select Guest</option>
                            {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                        </select>

                        <label>Check-In *</label>
                        <input type="datetime-local" name="checkIn" value={form.checkIn?.slice(0, 16) || ""} onChange={handleChange} className="w-full border rounded p-1" />
                        <label>Check-Out *</label>
                        <input type="datetime-local" name="checkOut" value={form.checkOut?.slice(0, 16) || ""} onChange={handleChange} className="w-full border rounded p-1" />
                    </div>

                    <div className="space-y-2">
                        <label>Room *</label>
                        <select name="roomId" value={form.roomId || ""} onChange={handleChange} className="w-full border rounded p-1">
                            <option value="">Select Room</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>)}
                        </select>

                        <label>Rate Plan</label>
                        <select name="ratePlanId" value={form.ratePlanId || ""} onChange={handleChange} className="w-full border rounded p-1">
                            <option value="">Select Rate Plan</option>
                            {ratePlans.map(rp => (
                                <option key={rp.id} value={rp.id}>
                                    {rp.name} {rp.mealPlan ? `(${rp.mealPlan})` : ""} {rp.isPublic ? "[Public]" : "[Negotiated]"} {rp.parentRatePlan ? `[Derived from ${rp.parentRatePlan.name}]` : ""}
                                </option>
                            ))}
                        </select>

                        <label>Company</label>
                        <select name="companyId" value={form.companyId || ""} onChange={handleChange} className="w-full border rounded p-1">
                            <option value="">Select Company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <label>Special Requests</label>
                        <textarea name="specialRequests" value={form.specialRequests || ""} onChange={handleChange} className="w-full border rounded p-1" />
                    </div>
                </div>

                {/* Extras Table */}
                <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold mb-2">Extras / Services</h3>
                    <div className="grid grid-cols-5 gap-2 items-end mb-2">
                        <input type="text" placeholder="Service Name" value={extraName} onChange={e => setExtraName(e.target.value)} className="border rounded p-1" />
                        <input type="number" placeholder="Price" value={extraPrice} onChange={e => setExtraPrice(e.target.value)} className="border rounded p-1" />
                        <input type="number" placeholder="Qty" min={1} value={extraQty} onChange={e => setExtraQty(Number(e.target.value))} className="border rounded p-1" />
                        <input type="number" placeholder="Tax %" value={extraTax} onChange={e => setExtraTax(e.target.value)} className="border rounded p-1" />
                        <button onClick={addExtra} className="px-2 py-1 bg-green-500 text-white rounded">Add</button>
                    </div>

                    {extras.length > 0 && (
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border p-1">Name</th>
                                    <th className="border p-1">Price</th>
                                    <th className="border p-1">Qty</th>
                                    <th className="border p-1">Tax %</th>
                                    <th className="border p-1">Total</th>
                                    <th className="border p-1">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extras.map((ex, idx) => {
                                    const price = Number(ex.price || 0);
                                    const qty = Number(ex.quantity || 1);
                                    const taxRate = Number(ex.tax || 0);
                                    const lineSubtotal = price * qty;
                                    const lineTax = (lineSubtotal * taxRate) / 100;
                                    const lineTotal = lineSubtotal + lineTax;

                                    return (
                                        <tr key={ex.tempId}>
                                            <td className="border p-1">
                                                <input type="text" value={ex.name} onChange={e => handleExtraChange(idx, "name", e.target.value)} className="w-full border rounded p-1" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" value={ex.price} onChange={e => handleExtraChange(idx, "price", Number(e.target.value))} className="w-full border rounded p-1" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" min={1} value={ex.quantity} onChange={e => handleExtraChange(idx, "quantity", Number(e.target.value))} className="w-full border rounded p-1" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" value={ex.tax} onChange={e => handleExtraChange(idx, "tax", Number(e.target.value))} className="w-full border rounded p-1" />
                                            </td>
                                            <td className="border p-1 text-right">
                                                ${lineTotal.toFixed(2)}
                                            </td>
                                            <td className="border p-1 text-center">
                                                <button onClick={() => removeExtra(idx)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-4 text-right font-semibold">
                    <p>Room Price: ${roomPrice.toFixed(2)}</p>
                    <p>Extras Subtotal: ${extrasSubtotal.toFixed(2)}</p>
                    <p>Subtotal: ${subtotal.toFixed(2)}</p>
                    <p>Taxes: ${totalTax.toFixed(2)}</p>
                    <p className="text-lg">Grand Total: ${grandTotal.toFixed(2)}</p>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {loading ? "Updating..." : "Update Booking"}
                    </button>
                </div>
            </div>
        </div>
    );
}
