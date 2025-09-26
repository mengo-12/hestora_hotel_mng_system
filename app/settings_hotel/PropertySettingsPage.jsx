// 'use client';
// import { useEffect, useState } from "react";
// import { useSession } from "next-auth/react";

// export default function PropertySettings() {
//     const { data: session } = useSession();
//     const [property, setProperty] = useState({});
//     const [loading, setLoading] = useState(true);

//     // صلاحيات المستخدم
//     const userRole = session?.user?.role || "FrontDesk";
//     const canEditAll = ["Admin"].includes(userRole);
//     const canEditPartial = ["Manager"].includes(userRole);
//     const readOnly = ["FrontDesk", "HK"].includes(userRole);

//     useEffect(() => {
//         fetch("/api/settings/property")
//             .then(res => res.json())
//             .then(data => {
//                 setProperty(data);
//                 setLoading(false);
//             });
//     }, []);

//     const handleChange = (e) => {
//         if (readOnly) return;
//         const { name, value } = e.target;
//         setProperty({ ...property, [name]: value });
//     };

//     const handleSave = async () => {
//         if (readOnly) return;
//         await fetch("/api/settings/property", {
//             method: "PATCH",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(property)
//         });
//         alert("Property updated!");
//     };

//     if (loading) return <div>Loading...</div>;


//     return (
//         <div className="space-y-4 p-4">
//             <input 
//                 name="name" 
//                 value={property.name || ""} 
//                 onChange={handleChange} 
//                 placeholder="Hotel Name" 
//                 disabled={readOnly ? true : false}
//             />
//             <input 
//                 name="phone" 
//                 value={property.phone || ""} 
//                 onChange={handleChange} 
//                 placeholder="Phone" 
//                 disabled={readOnly ? true : false}
//             />
//             <input 
//                 name="email" 
//                 value={property.email || ""} 
//                 onChange={handleChange} 
//                 placeholder="Email" 
//                 disabled={readOnly ? true : false}
//             />
//             <input 
//                 name="address" 
//                 value={property.address || ""} 
//                 onChange={handleChange} 
//                 placeholder="Address" 
//                 disabled={readOnly ? true : false}
//             />
//             <input 
//                 name="currency" 
//                 value={property.currency || ""} 
//                 onChange={handleChange} 
//                 placeholder="Currency" 
//                 disabled={!canEditAll} // فقط Admin يمكنه تعديل العملة
//             />
//             <input 
//                 name="timezone" 
//                 value={property.timezone || ""} 
//                 onChange={handleChange} 
//                 placeholder="Timezone" 
//                 disabled={readOnly ? true : false}
//             />
//             <input 
//                 name="checkInTime" 
//                 value={property.checkInTime || ""} 
//                 onChange={handleChange} 
//                 placeholder="Check-in HH:mm" 
//                 disabled={readOnly ? true : false}
//             />
//             <input 
//                 name="checkOutTime" 
//                 value={property.checkOutTime || ""} 
//                 onChange={handleChange} 
//                 placeholder="Check-out HH:mm" 
//                 disabled={readOnly ? true : false}
//             />
//             <textarea 
//                 name="cancellationPolicy" 
//                 value={property.cancellationPolicy || ""} 
//                 onChange={handleChange} 
//                 placeholder="Cancellation Policy" 
//                 disabled={readOnly ? true : false}
//             />
//             <textarea 
//                 name="depositPolicy" 
//                 value={property.depositPolicy || ""} 
//                 onChange={handleChange} 
//                 placeholder="Deposit Policy" 
//                 disabled={readOnly ? true : false}
//             />
//             {!readOnly && (
//                 <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//                     Save
//                 </button>
//             )}
//             {readOnly && <p className="text-gray-500">You do not have permission to edit these settings.</p>}
//         </div>
//     );
// }




'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function PropertySettings() {
    const { data: session } = useSession();
    const [property, setProperty] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general"); // تبويبات

    const userRole = session?.user?.role || "FrontDesk";
    const canEditAll = ["Admin"].includes(userRole);
    const readOnly = ["FrontDesk", "HK"].includes(userRole);

    useEffect(() => {
        fetch("/api/settings/property")
            .then(res => res.json())
            .then(data => {
                setProperty(data);
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        if (readOnly) return;
        const { name, value } = e.target;
        setProperty({ ...property, [name]: value });
    };

    const handleSave = async () => {
        if (readOnly) return;
        await fetch("/api/settings/property", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(property)
        });
        alert("Property updated!");
    };

    if (loading) return <div className="text-center p-6">Loading...</div>;

    // تبويبات تصميم
    const tabs = [
        { id: "general", label: "General" },
        { id: "times", label: "Times" },
        { id: "policies", label: "Policies" }
    ];

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">🏨 Property Settings</h2>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 -mb-px font-medium text-gray-700 dark:text-gray-300 border-b-2 ${
                            activeTab === tab.id
                                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                : "border-transparent hover:text-gray-900 dark:hover:text-white"
                        } transition`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "general" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Hotel Name</label>
                        <input
                            name="name"
                            value={property.name || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Hotel Name"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Phone</label>
                        <input
                            name="phone"
                            value={property.phone || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Phone"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Email</label>
                        <input
                            name="email"
                            value={property.email || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Email"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Address</label>
                        <input
                            name="address"
                            value={property.address || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Address"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Currency</label>
                        <input
                            name="currency"
                            value={property.currency || ""}
                            onChange={handleChange}
                            disabled={!canEditAll}
                            className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${!canEditAll ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed' : 'border-gray-300 dark:border-gray-700'}`}
                            placeholder="Currency"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Timezone</label>
                        <input
                            name="timezone"
                            value={property.timezone || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Timezone"
                        />
                    </div>
                </div>
            )}

            {activeTab === "times" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Check-in Time</label>
                        <input
                            name="checkInTime"
                            value={property.checkInTime || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="HH:mm"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Check-out Time</label>
                        <input
                            name="checkOutTime"
                            value={property.checkOutTime || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="HH:mm"
                        />
                    </div>
                </div>
            )}

            {activeTab === "policies" && (
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Cancellation Policy</label>
                        <textarea
                            name="cancellationPolicy"
                            value={property.cancellationPolicy || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                            placeholder="Cancellation Policy"
                            rows={3}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">Deposit Policy</label>
                        <textarea
                            name="depositPolicy"
                            value={property.depositPolicy || ""}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                            placeholder="Deposit Policy"
                            rows={3}
                        />
                    </div>
                </div>
            )}

            {/* Save Button */}
            {!readOnly ? (
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                    Save
                </button>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">You do not have permission to edit these settings.</p>
            )}
        </div>
    );
}
