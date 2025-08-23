'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function EditBookingModal({ booking, isOpen, onClose, properties, guests, rooms, ratePlans, companies }) {
    const socket = useSocket();
    const [form, setForm] = useState({ ...booking });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && booking) {
            setForm({ ...booking });
        }
    }, [isOpen, booking]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update booking");
            }

            const updatedBooking = await res.json();

            // البث عالمي
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_UPDATED", data: updatedBooking }),
                });
            } catch (err) {
                console.error("Socket broadcast failed:", err);
            }

            onClose();

        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Edit Booking</h2>

                <div className="space-y-2">
                    {/* نفس الحقول كما في AddBookingModal */}
                    <label>Property</label>
                    <select name="propertyId" value={form.propertyId || ""} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <label>Guest</label>
                    <select name="guestId" value={form.guestId || ""} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="">Select Guest</option>
                        {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                    </select>

                    <label>Room</label>
                    <select name="roomId" value={form.roomId || ""} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="">Select Room</option>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>)}
                    </select>

                    <label>Rate Plan</label>
                    <select name="ratePlanId" value={form.ratePlanId || ""} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="">Select Rate Plan</option>
                        {ratePlans.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
                    </select>

                    <label>Company (Optional)</label>
                    <select name="companyId" value={form.companyId || ""} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <label>Check-In</label>
                    <input type="datetime-local" name="checkIn" value={form.checkIn?.slice(0,16) || ""} onChange={handleChange} className="w-full p-2 border rounded" />

                    <label>Check-Out</label>
                    <input type="datetime-local" name="checkOut" value={form.checkOut?.slice(0,16) || ""} onChange={handleChange} className="w-full p-2 border rounded" />

                    <label>Adults</label>
                    <input type="number" min={1} name="adults" value={form.adults || 1} onChange={handleChange} className="w-full p-2 border rounded" />

                    <label>Children</label>
                    <input type="number" min={0} name="children" value={form.children || 0} onChange={handleChange} className="w-full p-2 border rounded" />

                    <label>Special Requests</label>
                    <textarea name="specialRequests" value={form.specialRequests || ""} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                    <button onClick={handleUpdate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {loading ? "Updating..." : "Update Booking"}
                    </button>
                </div>
            </div>
        </div>
    );
}
