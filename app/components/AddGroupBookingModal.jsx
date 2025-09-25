// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function AddGroupBookingModal({ isOpen, onClose, groups, properties, roomBlocks = [], onBookingAdded }) {
//     const socket = useSocket();

//     const [groupId, setGroupId] = useState("");
//     const [propertyId, setPropertyId] = useState("");
//     const [roomTypeId, setRoomTypeId] = useState("");
//     const [roomTypes, setRoomTypes] = useState([]);
//     const [availableRooms, setAvailableRooms] = useState([]);
//     const [selectedRoomId, setSelectedRoomId] = useState("");
//     const [roomBlockId, setRoomBlockId] = useState("");
//     const [checkIn, setCheckIn] = useState("");
//     const [checkOut, setCheckOut] = useState("");
//     const [adults, setAdults] = useState(1);
//     const [children, setChildren] = useState(0);
//     const [specialRequests, setSpecialRequests] = useState("");
//     const [extras, setExtras] = useState([]);

//     // جلب Room Types عند اختيار Property
//     useEffect(() => {
//         if (!propertyId) return setRoomTypes([]);
//         fetch(`/api/roomTypes?propertyId=${propertyId}`)
//             .then(res => res.json())
//             .then(data => setRoomTypes(Array.isArray(data) ? data : []))
//             .catch(() => setRoomTypes([]));
//     }, [propertyId]);

//     // جلب الغرف المتاحة حسب RoomType والتواريخ
//     useEffect(() => {
//         if (!roomTypeId || !checkIn || !checkOut || !propertyId) return setAvailableRooms([]);
//         fetch(`/api/rooms/available?propertyId=${propertyId}&roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}`)
//             .then(res => res.json())
//             .then(data => setAvailableRooms(Array.isArray(data) ? data : []))
//             .catch(() => setAvailableRooms([]));
//     }, [roomTypeId, checkIn, checkOut, propertyId]);

//     const handleSubmit = async () => {
//         if (!groupId || !propertyId || !roomTypeId || !checkIn || !checkOut || !selectedRoomId) {
//             alert("Please fill all required fields.");
//             return;
//         }

//         const payload = {
//             groupId,
//             propertyId,
//             roomTypeId,
//             roomId: selectedRoomId,
//             roomBlockId,
//             checkIn,
//             checkOut,
//             adults,
//             children,
//             specialRequests,
//             extras
//         };

//         try {
//             const res = await fetch("/api/groupBookings", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload)
//             });
//             if (!res.ok) throw new Error("Failed to create booking");

//             const newBooking = await res.json();
//             onBookingAdded?.(newBooking);
//             socket?.emit("GROUPBOOKING_CREATED", newBooking);

//             // Reset form
//             setGroupId(""); setPropertyId(""); setRoomTypeId(""); setSelectedRoomId(""); setRoomBlockId("");
//             setCheckIn(""); setCheckOut(""); setAdults(1); setChildren(0); setSpecialRequests(""); setExtras([]);
//             setAvailableRooms([]);
//             onClose();
//         } catch (err) {
//             alert(err.message);
//         }
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[450px] max-h-[90vh] overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Add Group Booking</h2>

//                 {/* Group */}
//                 <div className="mb-3">
//                     <label>Group *</label>
//                     <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full border rounded p-2">
//                         <option value="">Select Group</option>
//                         {Array.isArray(groups) && groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Property */}
//                 <div className="mb-3">
//                     <label>Property *</label>
//                     <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full border rounded p-2">
//                         <option value="">Select Property</option>
//                         {Array.isArray(properties) && properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Room Type */}
//                 <div className="mb-3">
//                     <label>Room Type *</label>
//                     <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="w-full border rounded p-2">
//                         <option value="">Select Room Type</option>
//                         {Array.isArray(roomTypes) && roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Room Block */}
//                 <div className="mb-3">
//                     <label>Room Block</label>
//                     <select value={roomBlockId} onChange={e => setRoomBlockId(e.target.value)} className="w-full border rounded p-2">
//                         <option value="">Select Room Block</option>
//                         {Array.isArray(roomBlocks) && roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Available Rooms */}
//                 <div className="mb-3">
//                     <label>Available Rooms *</label>
//                     <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="w-full border rounded p-2">
//                         <option value="">Select Room</option>
//                         {Array.isArray(availableRooms) && availableRooms.map(r => <option key={r.id} value={r.id}>{r.number}</option>)}
//                     </select>
//                 </div>

//                 {/* Dates */}
//                 <div className="mb-3">
//                     <label>Check-in *</label>
//                     <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border rounded p-2" />
//                 </div>
//                 <div className="mb-3">
//                     <label>Check-out *</label>
//                     <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border rounded p-2" />
//                 </div>

//                 {/* Guests */}
//                 <div className="mb-3 flex space-x-2">
//                     <div className="flex-1">
//                         <label>Adults</label>
//                         <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded p-2" />
//                     </div>
//                     <div className="flex-1">
//                         <label>Children</label>
//                         <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded p-2" />
//                     </div>
//                 </div>

//                 {/* Special Requests */}
//                 <div className="mb-3">
//                     <label>Special Requests</label>
//                     <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border rounded p-2" />
//                 </div>

//                 {/* Extras */}
//                 <div className="mb-3">
//                     <label>Extras</label>
//                     <input type="text" placeholder="Extra name,price,qty (comma-separated)" onBlur={e => {
//                         if (!e.target.value) return;
//                         const [name, price, qty] = e.target.value.split(",");
//                         setExtras([...extras, { name, unitPrice: Number(price), quantity: Number(qty) }]);
//                         e.target.value = "";
//                     }} className="w-full border rounded p-2" />
//                     {extras.length > 0 && <ul className="mt-1 text-sm">
//                         {extras.map((ex, i) => <li key={i}>{ex.name} - {ex.quantity} x {ex.unitPrice}</li>)}
//                     </ul>}
//                 </div>

//                 {/* Buttons */}
//                 <div className="flex justify-end space-x-2 mt-4">
//                     <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
//                     <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Booking</button>
//                 </div>
//             </div>
//         </div>
//     );
// }





'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { FaBuilding, FaUserFriends, FaBed, FaCalendarAlt, FaInfoCircle, FaPlus, FaTrash } from "react-icons/fa";

export default function AddGroupBookingModal({ isOpen, onClose, groups, properties, roomBlocks = [], onBookingAdded }) {
    const socket = useSocket();

    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedGuest, setSelectedGuest] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedRatePlan, setSelectedRatePlan] = useState("");
    const [groupId, setGroupId] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [specialRequests, setSpecialRequests] = useState("");
    const [roomTypes, setRoomTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [ratePlansForRoom, setRatePlansForRoom] = useState([]);

    // Extras
    const [extraName, setExtraName] = useState("");
    const [extraPrice, setExtraPrice] = useState("");
    const [extraQty, setExtraQty] = useState(1);
    const [extraTax, setExtraTax] = useState(0);
    const [extras, setExtras] = useState([]);

    // Totals
    const [roomPrice, setRoomPrice] = useState(0);
    const [extrasSubtotal, setExtrasSubtotal] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [totalTax, setTotalTax] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);

    // Fetch Room Types when Property changes
    useEffect(() => {
        if (!selectedProperty) return setRoomTypes([]);
        fetch(`/api/roomTypes?propertyId=${selectedProperty}`)
            .then(res => res.json())
            .then(data => setRoomTypes(Array.isArray(data) ? data : []))
            .catch(() => setRoomTypes([]));
    }, [selectedProperty]);

    // Fetch Available Rooms when RoomType or Dates change
    useEffect(() => {
        if (!selectedRoom || !checkIn || !checkOut || !selectedProperty) return setAvailableRooms([]);
        fetch(`/api/rooms/available?propertyId=${selectedProperty}&roomTypeId=${selectedRoom}&checkIn=${checkIn}&checkOut=${checkOut}`)
            .then(res => res.json())
            .then(data => setAvailableRooms(Array.isArray(data) ? data : []))
            .catch(() => setAvailableRooms([]));
    }, [selectedRoom, checkIn, checkOut, selectedProperty]);

    // Update totals whenever extras change
    useEffect(() => {
        const subtotalExtras = extras.reduce((acc, ex) => acc + ex.price * ex.quantity, 0);
        const taxTotal = extras.reduce((acc, ex) => acc + ((ex.price * ex.quantity * ex.tax) / 100), 0);
        setExtrasSubtotal(subtotalExtras);
        setTotalTax(taxTotal);
        const total = roomPrice + subtotalExtras + taxTotal;
        setSubtotal(roomPrice + subtotalExtras);
        setGrandTotal(total);
    }, [extras, roomPrice]);

    const addExtra = () => {
        if (!extraName || !extraPrice || !extraQty) return;
        setExtras([...extras, { name: extraName, price: Number(extraPrice), quantity: Number(extraQty), tax: Number(extraTax) }]);
        setExtraName(""); setExtraPrice(""); setExtraQty(1); setExtraTax(0);
    };

    const removeExtra = (index) => setExtras(extras.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!selectedProperty || !selectedGuest || !selectedRoom || !checkIn || !checkOut) {
            alert("Please fill all required fields.");
            return;
        }
        const payload = {
            propertyId: selectedProperty,
            guestId: selectedGuest,
            roomId: selectedRoom,
            ratePlanId: selectedRatePlan,
            groupId,
            companyId,
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
            setSelectedProperty(""); setSelectedGuest(""); setSelectedRoom(""); setSelectedRatePlan(""); setGroupId("");
            setCompanyId(""); setCheckIn(""); setCheckOut(""); setAdults(1); setChildren(0); setSpecialRequests(""); setExtras([]);
            setRoomTypes([]); setAvailableRooms([]);
            onClose();
        } catch (err) {
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
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaBuilding /> Property *</label>
                            <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Property</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaUserFriends /> Guest *</label>
                            <select value={selectedGuest} onChange={e => setSelectedGuest(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Guest</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaCalendarAlt /> Check-In *</label>
                            <input type="datetime-local" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaCalendarAlt /> Check-Out *</label>
                            <input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaBed /> Available Room *</label>
                            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Room</option>
                                {availableRooms.map(r => <option key={r.id} value={r.id}>{r.number} - {r.roomType?.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Rate Plan</label>
                            <select value={selectedRatePlan} onChange={e => setSelectedRatePlan(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Rate Plan</option>
                                {ratePlansForRoom.map(rp => <option key={rp.id} value={rp.id}>{rp.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Adults</label>
                                <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Children</label>
                                <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Company</label>
                            <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Company</option>
                                {groups.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaInfoCircle /> Special Requests</label>
                            <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>
                    </div>
                </div>

                {/* Extras Section */}
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Extras / Services</h3>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        <input type="text" placeholder="Service Name" value={extraName} onChange={e => setExtraName(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <input type="number" placeholder="Price" value={extraPrice} onChange={e => setExtraPrice(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <input type="number" placeholder="Qty" min={1} value={extraQty} onChange={e => setExtraQty(Number(e.target.value))} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <input type="number" placeholder="Tax %" value={extraTax} onChange={e => setExtraTax(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <button onClick={addExtra} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"><FaPlus /> Add</button>
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
                                            <button onClick={() => removeExtra(idx)} className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1"><FaTrash /></button>
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
