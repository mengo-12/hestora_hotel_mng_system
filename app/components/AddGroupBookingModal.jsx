'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddGroupBookingModal({ isOpen, onClose, groups, properties, onBookingAdded }) {
    const socket = useSocket();

    const [groupId, setGroupId] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [roomTypes, setRoomTypes] = useState([]);
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [specialRequests, setSpecialRequests] = useState("");

    // --- Fetch room types when property changes ---
    useEffect(() => {
        const fetchRoomTypes = async () => {
            if (!propertyId) {
                setRoomTypes([]);
                setRoomTypeId("");
                return;
            }
            try {
                const res = await fetch(`/api/roomTypes?propertyId=${propertyId}`);
                if (!res.ok) throw new Error("Failed to fetch room types");
                const data = await res.json();
                setRoomTypes(data);
                setRoomTypeId("");
            } catch (err) {
                console.error(err);
                setRoomTypes([]);
            }
        };

        fetchRoomTypes();
    }, [propertyId]);

    const handleSubmit = async () => {
        if (!groupId || !propertyId || !roomTypeId || !checkIn || !checkOut) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const payload = {
                groupId: groupId || null,
                propertyId,
                roomTypeId,
                checkIn,
                checkOut,
                adults,
                children,
                specialRequests
            };

            const res = await fetch("/api/groupBookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create group booking");
            }

            const newBooking = await res.json();

            if (onBookingAdded) onBookingAdded(newBooking);

            if (socket) socket.emit("GROUPBOOKING_CREATED", newBooking);

            // Reset form
            setGroupId(""); setPropertyId(""); setRoomTypeId(""); setRoomTypes([]);
            setCheckIn(""); setCheckOut(""); setAdults(1); setChildren(0); setSpecialRequests("");
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Add Group Booking</h2>

                <div className="mb-3">
                    <label className="block mb-1">Group *</label>
                    <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Group</option>
                        {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Property *</label>
                    <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Property</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Room Type *</label>
                    <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Room Type</option>
                        {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Check-in *</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Check-out *</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Adults</label>
                    <input type="number" value={adults} min={1} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded p-2" />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Children</label>
                    <input type="number" value={children} min={0} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded p-2" />
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Special Requests</label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border rounded p-2" placeholder="Any special requests?" />
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Booking</button>
                </div>
            </div>
        </div>
    );
}
