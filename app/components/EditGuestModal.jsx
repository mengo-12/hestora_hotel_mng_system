// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function EditGuestModal({ guest, isOpen, onClose, onSaved, properties, hotelGroups }) {
//     const [firstName, setFirstName] = useState("");
//     const [lastName, setLastName] = useState("");
//     const [phone, setPhone] = useState("");
//     const [email, setEmail] = useState("");
//     const [nationality, setNationality] = useState("");
//     const [passportNumber, setPassportNumber] = useState("");
//     const [dateOfBirth, setDateOfBirth] = useState("");
//     const [propertyId, setPropertyId] = useState("");
//     const [hotelGroupId, setHotelGroupId] = useState("");
//     const socket = useSocket();
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         if (guest) {
//             setFirstName(guest.firstName || "");
//             setLastName(guest.lastName || "");
//             setPhone(guest.phone || "");
//             setEmail(guest.email || "");
//             setNationality(guest.nationality || "");
//             setPassportNumber(guest.passportNumber || "");
//             setDateOfBirth(guest.dateOfBirth ? guest.dateOfBirth.slice(0,10) : "");
//             setPropertyId(guest.propertyId || "");
//             setHotelGroupId(guest.hotelGroupId || "");
//         }
//     }, [guest]);

//     if (!isOpen) return null;

//     const handleSave = async () => {
//         if (!firstName.trim() || !lastName.trim()) {
//             alert("First and last name are required");
//             return;
//         }

//         setLoading(true);
//         try {
//             const res = await fetch(`/api/guests/${guest.id}`, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     firstName,
//                     lastName,
//                     phone,
//                     email,
//                     nationality,
//                     passportNumber,
//                     dateOfBirth: dateOfBirth || null,
//                     propertyId: propertyId || null,
//                     hotelGroupId: hotelGroupId || null
//                 }),
//             });
//             const data = await res.json();

//             if (!res.ok) throw new Error(data.error || "Failed to update guest");

//             // بث عالمي
//             try {
//                 await fetch("http://localhost:3001/api/broadcast", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ event: "GUEST_UPDATED", data }),
//                 });
//             } catch (err) {
//                 console.error("Socket broadcast failed:", err);
//             }

//             onSaved();
//             onClose();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };


//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Edit Guest</h2>
//                 <div className="space-y-2">
//                     <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded"/>
//                     <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded"/>
//                     <input type="text" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded"/>
//                     <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded"/>
//                     <input type="text" placeholder="Nationality" value={nationality} onChange={e => setNationality(e.target.value)} className="w-full p-2 border rounded"/>
//                     <input type="text" placeholder="Passport Number" value={passportNumber} onChange={e => setPassportNumber(e.target.value)} className="w-full p-2 border rounded"/>
//                     <input type="date" placeholder="Date of Birth" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full p-2 border rounded"/>
//                     <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full p-2 border rounded">
//                         {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                     <select value={hotelGroupId} onChange={e => setHotelGroupId(e.target.value)} className="w-full p-2 border rounded">
//                         <option value="">No Group</option>
//                         {hotelGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                     </select>
//                 </div>
//                 <div className="mt-4 flex justify-end gap-2">
//                     <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
//                     <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//                         {loading ? "Saving..." : "Save"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }



// الكود الاعلى اصلي


'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function EditGuestModal({ guest, isOpen, onClose, onSaved, properties, hotelGroups }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [nationality, setNationality] = useState("");
    const [passportNumber, setPassportNumber] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [hotelGroupId, setHotelGroupId] = useState("");
    const socket = useSocket();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (guest) {
            setFirstName(guest.firstName || "");
            setLastName(guest.lastName || "");
            setPhone(guest.phone || "");
            setEmail(guest.email || "");
            setNationality(guest.nationality || "");
            setPassportNumber(guest.passportNumber || "");
            setDateOfBirth(guest.dateOfBirth ? guest.dateOfBirth.slice(0,10) : "");
            setPropertyId(guest.propertyId || "");
            setHotelGroupId(guest.hotelGroupId || "");
        }
    }, [guest]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            alert("First and last name are required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/guests/${guest.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    email,
                    nationality,
                    passportNumber,
                    dateOfBirth: dateOfBirth || null,
                    propertyId: propertyId || null,
                    hotelGroupId: hotelGroupId || null
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update guest");

            // Broadcast
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "GUEST_UPDATED", data }),
                });
            } catch (err) {
                console.error("Socket broadcast failed:", err);
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Edit Guest</h2>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">First Name *</label>
                        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Last Name *</label>
                        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                        <input type="text" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nationality</label>
                        <input type="text" placeholder="Nationality" value={nationality} onChange={e => setNationality(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Passport Number</label>
                        <input type="text" placeholder="Passport Number" value={passportNumber} onChange={e => setPassportNumber(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date of Birth</label>
                        <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg text-gray-600 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Property</label>
                        <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Hotel Group</label>
                        <select value={hotelGroupId} onChange={e => setHotelGroupId(e.target.value)}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                            <option value="">No Group</option>
                            {hotelGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                        {loading ? "Saving..." : "Save Guest"}
                    </button>
                </div>
            </div>
        </div>
    );
}
