'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function AddGroupBookingModal({ isOpen, onClose, groups, properties, roomBlocks = [], onBookingAdded }) {
    const socket = useSocket();

    const [groupId, setGroupId] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [roomTypes, setRoomTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [roomBlockId, setRoomBlockId] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [specialRequests, setSpecialRequests] = useState("");
    const [extras, setExtras] = useState([]);

    // جلب Room Types عند اختيار Property
    useEffect(() => {
        if (!propertyId) return setRoomTypes([]);
        fetch(`/api/roomTypes?propertyId=${propertyId}`)
            .then(res => res.json())
            .then(data => setRoomTypes(Array.isArray(data) ? data : []))
            .catch(() => setRoomTypes([]));
    }, [propertyId]);

    // جلب الغرف المتاحة حسب RoomType والتواريخ
    useEffect(() => {
        if (!roomTypeId || !checkIn || !checkOut || !propertyId) return setAvailableRooms([]);
        fetch(`/api/rooms/available?propertyId=${propertyId}&roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}`)
            .then(res => res.json())
            .then(data => setAvailableRooms(Array.isArray(data) ? data : []))
            .catch(() => setAvailableRooms([]));
    }, [roomTypeId, checkIn, checkOut, propertyId]);

    const handleSubmit = async () => {
        if (!groupId || !propertyId || !roomTypeId || !checkIn || !checkOut || !selectedRoomId) {
            alert("Please fill all required fields.");
            return;
        }

        const payload = {
            groupId,
            propertyId,
            roomTypeId,
            roomId: selectedRoomId,
            roomBlockId,
            checkIn,
            checkOut,
            adults,
            children,
            specialRequests,
            extras
        };

        try {
            const res = await fetch("/api/groupBookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to create booking");

            const newBooking = await res.json();
            onBookingAdded?.(newBooking);
            socket?.emit("GROUPBOOKING_CREATED", newBooking);

            // Reset form
            setGroupId(""); setPropertyId(""); setRoomTypeId(""); setSelectedRoomId(""); setRoomBlockId("");
            setCheckIn(""); setCheckOut(""); setAdults(1); setChildren(0); setSpecialRequests(""); setExtras([]);
            setAvailableRooms([]);
            onClose();
        } catch (err) {
            alert(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[450px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Add Group Booking</h2>

                {/* Group */}
                <div className="mb-3">
                    <label>Group *</label>
                    <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Group</option>
                        {Array.isArray(groups) && groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>

                {/* Property */}
                <div className="mb-3">
                    <label>Property *</label>
                    <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Property</option>
                        {Array.isArray(properties) && properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {/* Room Type */}
                <div className="mb-3">
                    <label>Room Type *</label>
                    <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Room Type</option>
                        {Array.isArray(roomTypes) && roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                </div>

                {/* Room Block */}
                <div className="mb-3">
                    <label>Room Block</label>
                    <select value={roomBlockId} onChange={e => setRoomBlockId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Room Block</option>
                        {Array.isArray(roomBlocks) && roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
                    </select>
                </div>

                {/* Available Rooms */}
                <div className="mb-3">
                    <label>Available Rooms *</label>
                    <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="w-full border rounded p-2">
                        <option value="">Select Room</option>
                        {Array.isArray(availableRooms) && availableRooms.map(r => <option key={r.id} value={r.id}>{r.number}</option>)}
                    </select>
                </div>

                {/* Dates */}
                <div className="mb-3">
                    <label>Check-in *</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div className="mb-3">
                    <label>Check-out *</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border rounded p-2" />
                </div>

                {/* Guests */}
                <div className="mb-3 flex space-x-2">
                    <div className="flex-1">
                        <label>Adults</label>
                        <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded p-2" />
                    </div>
                    <div className="flex-1">
                        <label>Children</label>
                        <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded p-2" />
                    </div>
                </div>

                {/* Special Requests */}
                <div className="mb-3">
                    <label>Special Requests</label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border rounded p-2" />
                </div>

                {/* Extras */}
                <div className="mb-3">
                    <label>Extras</label>
                    <input type="text" placeholder="Extra name,price,qty (comma-separated)" onBlur={e => {
                        if (!e.target.value) return;
                        const [name, price, qty] = e.target.value.split(",");
                        setExtras([...extras, { name, unitPrice: Number(price), quantity: Number(qty) }]);
                        e.target.value = "";
                    }} className="w-full border rounded p-2" />
                    {extras.length > 0 && <ul className="mt-1 text-sm">
                        {extras.map((ex, i) => <li key={i}>{ex.name} - {ex.quantity} x {ex.unitPrice}</li>)}
                    </ul>}
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Booking</button>
                </div>
            </div>
        </div>
    );
}
