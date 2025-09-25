// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function EditGroupBookingModal({
//     isOpen,
//     onClose,
//     booking,
//     properties = [],
//     roomBlocks = [], // ✅ جديد
//     onBookingUpdated
// }) {
//     const socket = useSocket();

//     const [groups, setGroups] = useState([]);
//     const [groupId, setGroupId] = useState("");
//     const [propertyId, setPropertyId] = useState("");
//     const [roomTypeId, setRoomTypeId] = useState("");
//     const [roomTypes, setRoomTypes] = useState([]);
//     const [roomBlockId, setRoomBlockId] = useState(""); // ✅ جديد
//     const [checkIn, setCheckIn] = useState("");
//     const [checkOut, setCheckOut] = useState("");
//     const [adults, setAdults] = useState(1);
//     const [children, setChildren] = useState(0);
//     const [specialRequests, setSpecialRequests] = useState("");

//     // --- Fetch groups عند تحميل المودال ---
//     useEffect(() => {
//         const fetchGroups = async () => {
//             try {
//                 const res = await fetch("/api/groups");
//                 const data = await res.json();
//                 setGroups(data || []);
//             } catch (err) {
//                 console.error("Failed to fetch groups:", err);
//             }
//         };
//         fetchGroups();
//     }, []);

//     // تهيئة الحقول عند فتح المودال أو تغير booking
//     useEffect(() => {
//         if (booking) {
//             setGroupId(booking.groupId || "");
//             setPropertyId(booking.propertyId || "");
//             setRoomTypeId(booking.roomTypeId || "");
//             setRoomBlockId(booking.roomBlockId || ""); // ✅ جديد
//             setCheckIn(booking.checkIn ? booking.checkIn.slice(0, 10) : "");
//             setCheckOut(booking.checkOut ? booking.checkOut.slice(0, 10) : "");
//             setAdults(booking.adults || 1);
//             setChildren(booking.children || 0);
//             setSpecialRequests(booking.specialRequests || "");
//         }
//     }, [booking]);

//     // Fetch room types عند تغير property
//     useEffect(() => {
//         const fetchRoomTypes = async () => {
//             if (!propertyId) {
//                 setRoomTypes([]);
//                 setRoomTypeId("");
//                 return;
//             }
//             try {
//                 const res = await fetch(`/api/roomTypes?propertyId=${propertyId}`);
//                 if (!res.ok) throw new Error("Failed to fetch room types");
//                 const data = await res.json();
//                 setRoomTypes(data);
//                 if (!data.find(rt => rt.id === roomTypeId)) setRoomTypeId("");
//             } catch (err) {
//                 console.error(err);
//                 setRoomTypes([]);
//             }
//         };
//         fetchRoomTypes();
//     }, [propertyId, roomTypeId]);

//     const handleSubmit = async () => {
//         if (!groupId || !propertyId || !roomTypeId || !checkIn || !checkOut) {
//             alert("Please fill in all required fields.");
//             return;
//         }

//         const payload = {
//             groupId,
//             propertyId,
//             roomTypeId,
//             roomBlockId, // ✅ أرسل RoomBlock
//             checkIn,
//             checkOut,
//             adults,
//             children,
//             specialRequests
//         };

//         try {
//             const res = await fetch(`/api/groupBookings/${booking.id}`, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload)
//             });

//             if (!res.ok) throw new Error("Failed to update group booking");

//             const updatedBooking = await res.json();

//             if (onBookingUpdated) onBookingUpdated(updatedBooking);
//             if (socket) socket.emit("GROUPBOOKING_UPDATED", updatedBooking);
//             onClose();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     if (!isOpen || !booking) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Edit Group Booking</h2>

//                 {/* Group */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Group *</label>
//                     <select
//                         value={groupId}
//                         onChange={e => setGroupId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Group</option>
//                         {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Property */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Property *</label>
//                     <select
//                         value={propertyId}
//                         onChange={e => setPropertyId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Property</option>
//                         {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Room Type */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Room Type *</label>
//                     <select
//                         value={roomTypeId}
//                         onChange={e => setRoomTypeId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Room Type</option>
//                         {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Room Block */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Room Block</label>
//                     <select
//                         value={roomBlockId}
//                         onChange={e => setRoomBlockId(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Room Block</option>
//                         {roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
//                     </select>
//                 </div>

//                 {/* Dates */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Check-in *</label>
//                     <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border rounded p-2" />
//                 </div>
//                 <div className="mb-3">
//                     <label className="block mb-1">Check-out *</label>
//                     <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border rounded p-2" />
//                 </div>

//                 {/* Guests */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Adults</label>
//                     <input type="number" value={adults} min={1} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded p-2" />
//                 </div>
//                 <div className="mb-3">
//                     <label className="block mb-1">Children</label>
//                     <input type="number" value={children} min={0} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded p-2" />
//                 </div>

//                 {/* Special Requests */}
//                 <div className="mb-3">
//                     <label className="block mb-1">Special Requests</label>
//                     <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border rounded p-2" placeholder="Any special requests?" />
//                 </div>

//                 {/* Buttons */}
//                 <div className="flex justify-end space-x-2 mt-4">
//                     <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
//                     <button onClick={handleSubmit} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Update Booking</button>
//                 </div>
//             </div>
//         </div>
//     );
// }




'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { FaBuilding, FaUserFriends, FaBed, FaCalendarAlt, FaInfoCircle, FaList } from "react-icons/fa";

export default function EditGroupBookingModal({
    isOpen,
    onClose,
    booking,
    properties = [],
    roomBlocks = [],
    onBookingUpdated
}) {
    const socket = useSocket();

    const [groups, setGroups] = useState([]);
    const [groupId, setGroupId] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomBlockId, setRoomBlockId] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [specialRequests, setSpecialRequests] = useState("");

    // Fetch groups عند تحميل المودال
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await fetch("/api/groups");
                const data = await res.json();
                setGroups(data || []);
            } catch (err) {
                console.error("Failed to fetch groups:", err);
            }
        };
        fetchGroups();
    }, []);

    // تهيئة الحقول عند فتح المودال أو تغير booking
    useEffect(() => {
        if (booking) {
            setGroupId(booking.groupId || "");
            setPropertyId(booking.propertyId || "");
            setRoomTypeId(booking.roomTypeId || "");
            setRoomBlockId(booking.roomBlockId || "");
            setCheckIn(booking.checkIn ? booking.checkIn.slice(0, 16) : "");
            setCheckOut(booking.checkOut ? booking.checkOut.slice(0, 16) : "");
            setAdults(booking.adults || 1);
            setChildren(booking.children || 0);
            setSpecialRequests(booking.specialRequests || "");
        }
    }, [booking]);

    // Fetch room types عند تغير property
    useEffect(() => {
        const fetchRoomTypes = async () => {
            if (!propertyId) {
                setRoomTypes([]);
                setRoomTypeId("");
                return;
            }
            try {
                const res = await fetch(`/api/roomTypes?propertyId=${propertyId}`);
                const data = await res.json();
                setRoomTypes(data);
                if (!data.find(rt => rt.id === roomTypeId)) setRoomTypeId("");
            } catch {
                setRoomTypes([]);
            }
        };
        fetchRoomTypes();
    }, [propertyId, roomTypeId]);

    const handleSubmit = async () => {
        if (!groupId || !propertyId || !roomTypeId || !checkIn || !checkOut) {
            alert("Please fill in all required fields.");
            return;
        }

        const payload = { groupId, propertyId, roomTypeId, roomBlockId, checkIn, checkOut, adults, children, specialRequests };

        try {
            const res = await fetch(`/api/groupBookings/${booking.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to update group booking");

            const updatedBooking = await res.json();
            onBookingUpdated?.(updatedBooking);
            socket?.emit("GROUPBOOKING_UPDATED", updatedBooking);
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!isOpen || !booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-[900px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">✏️ Edit Group Booking</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaUserFriends /> Group *</label>
                            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Group</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaBuilding /> Property *</label>
                            <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Property</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaBed /> Room Type *</label>
                            <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Room Type</option>
                                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaList /> Room Block</label>
                            <select value={roomBlockId} onChange={e => setRoomBlockId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                <option value="">Select Room Block</option>
                                {roomBlocks.map(rb => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaCalendarAlt /> Check-In *</label>
                            <input type="datetime-local" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaCalendarAlt /> Check-Out *</label>
                            <input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
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
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300"><FaInfoCircle /> Special Requests</label>
                            <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full p-2 mt-1 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" placeholder="Any special requests?" />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSubmit} className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Update Booking</button>
                </div>
            </div>
        </div>
    );
}
