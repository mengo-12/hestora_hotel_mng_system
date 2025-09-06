'use client';
import { useEffect, useState } from "react";

export default function PropertySettings() {
    const [property, setProperty] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/settings/property")
            .then(res => res.json())
            .then(data => {
                setProperty(data);
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        setProperty({ ...property, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
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
            <input name="name" value={property.name || ""} onChange={handleChange} placeholder="Hotel Name" />
            <input name="phone" value={property.phone || ""} onChange={handleChange} placeholder="Phone" />
            <input name="email" value={property.email || ""} onChange={handleChange} placeholder="Email" />
            <input name="address" value={property.address || ""} onChange={handleChange} placeholder="Address" />
            <input name="currency" value={property.currency || ""} onChange={handleChange} placeholder="Currency" />
            <input name="timezone" value={property.timezone || ""} onChange={handleChange} placeholder="Timezone" />
            <input name="checkInTime" value={property.checkInTime || ""} onChange={handleChange} placeholder="Check-in HH:mm" />
            <input name="checkOutTime" value={property.checkOutTime || ""} onChange={handleChange} placeholder="Check-out HH:mm" />
            <textarea name="cancellationPolicy" value={property.cancellationPolicy || ""} onChange={handleChange} placeholder="Cancellation Policy" />
            <textarea name="depositPolicy" value={property.depositPolicy || ""} onChange={handleChange} placeholder="Deposit Policy" />
            <button onClick={handleSave}>Save</button>
        </div>
    );
}
