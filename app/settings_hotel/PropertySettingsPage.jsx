'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function PropertySettings() {
    const { data: session } = useSession();
    const [property, setProperty] = useState({});
    const [loading, setLoading] = useState(true);

    // صلاحيات المستخدم
    const userRole = session?.user?.role || "FrontDesk";
    const canEditAll = ["ADMIN"].includes(userRole);
    const canEditPartial = ["Manager"].includes(userRole);
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-4 p-4">
            <input 
                name="name" 
                value={property.name || ""} 
                onChange={handleChange} 
                placeholder="Hotel Name" 
                disabled={readOnly ? true : false}
            />
            <input 
                name="phone" 
                value={property.phone || ""} 
                onChange={handleChange} 
                placeholder="Phone" 
                disabled={readOnly ? true : false}
            />
            <input 
                name="email" 
                value={property.email || ""} 
                onChange={handleChange} 
                placeholder="Email" 
                disabled={readOnly ? true : false}
            />
            <input 
                name="address" 
                value={property.address || ""} 
                onChange={handleChange} 
                placeholder="Address" 
                disabled={readOnly ? true : false}
            />
            <input 
                name="currency" 
                value={property.currency || ""} 
                onChange={handleChange} 
                placeholder="Currency" 
                disabled={!canEditAll} // فقط Admin يمكنه تعديل العملة
            />
            <input 
                name="timezone" 
                value={property.timezone || ""} 
                onChange={handleChange} 
                placeholder="Timezone" 
                disabled={readOnly ? true : false}
            />
            <input 
                name="checkInTime" 
                value={property.checkInTime || ""} 
                onChange={handleChange} 
                placeholder="Check-in HH:mm" 
                disabled={readOnly ? true : false}
            />
            <input 
                name="checkOutTime" 
                value={property.checkOutTime || ""} 
                onChange={handleChange} 
                placeholder="Check-out HH:mm" 
                disabled={readOnly ? true : false}
            />
            <textarea 
                name="cancellationPolicy" 
                value={property.cancellationPolicy || ""} 
                onChange={handleChange} 
                placeholder="Cancellation Policy" 
                disabled={readOnly ? true : false}
            />
            <textarea 
                name="depositPolicy" 
                value={property.depositPolicy || ""} 
                onChange={handleChange} 
                placeholder="Deposit Policy" 
                disabled={readOnly ? true : false}
            />
            {!readOnly && (
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Save
                </button>
            )}
            {readOnly && <p className="text-gray-500">You do not have permission to edit these settings.</p>}
        </div>
    );
}
