
'use client';
import { useState, useEffect } from "react";

export default function AddRoomModal({ isOpen, onClose, onSaved, userId }) {
    const [form, setForm] = useState({
        propertyId: "",
        number: "",
        roomTypeId: "",
        status: "VACANT",
        floor: "",
        notes: ""
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [localProperties, setLocalProperties] = useState([]);
    const [localRoomTypes, setLocalRoomTypes] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setForm({
                propertyId: "",
                number: "",
                roomTypeId: "",
                status: "VACANT",
                floor: "",
                notes: ""
            });
            setError(null);

            // Fetch Properties
            fetch("/api/properties")
                .then(res => res.json())
                .then(data => {
                    // تأكد من أن البيانات مصفوفة
                    setLocalProperties(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error("Failed to fetch properties:", err);
                    setLocalProperties([]);
                });

            // Fetch Room Types
            fetch("/api/roomTypes")
                .then(res => res.json())
                .then(data => {
                    setLocalRoomTypes(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error("Failed to fetch room types:", err);
                    setLocalRoomTypes([]);
                });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.propertyId) return setError("Property is required");
        if (!form.roomTypeId) return setError("Room Type is required");
        if (!form.number.trim()) return setError("Room Number is required");
        if (isNaN(form.floor) && form.floor !== "") return setError("Floor must be a number");
        if (form.notes.length > 250) return setError("Notes cannot exceed 250 characters");

        setLoading(true);
        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            setLoading(false);
            if (res.ok) {
                onSaved && onSaved(data);
                onClose();
            } else {
                setError(data.error || "Error adding room");
            }
        } catch (err) {
            setLoading(false);
            setError("Failed to add room");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Room</h2>

                {error && <div className="mb-3 p-2 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 rounded-lg">{error}</div>}

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Property */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Property *</label>
                        <select name="propertyId" value={form.propertyId} onChange={handleChange} required
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                            <option value="">Select Property</option>
                            {Array.isArray(localProperties) && localProperties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Room Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Room Number *</label>
                        <input type="text" name="number" value={form.number} onChange={handleChange} required
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    {/* Room Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Room Type *</label>
                        <select name="roomTypeId" value={form.roomTypeId} onChange={handleChange} required
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                            <option value="">Select Room Type</option>
                            {Array.isArray(localRoomTypes) && localRoomTypes.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
                        <select name="status" value={form.status} onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                            <option value="VACANT">Vacant</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                    </div>

                    {/* Floor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Floor</label>
                        <input type="number" name="floor" value={form.floor} onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} maxLength={250}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <p className="text-xs text-gray-400 mt-1">{form.notes.length}/250</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : "Save"}</button>
                    </div>

                </form>
            </div>
        </div>
    );
}

