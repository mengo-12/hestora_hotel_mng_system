'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FoliosPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // جلب جميع الحجوزات
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bookings");
            if (!res.ok) throw new Error("Failed to fetch bookings");
            const data = await res.json();
            
            // تصفية لتجنب تكرار الحجوزات الجماعية
            const uniqueBookings = [];
            const groupsAdded = new Set();

            data.forEach(b => {
                if (b.groupId) {
                    if (!groupsAdded.has(b.groupId)) {
                        uniqueBookings.push(b);
                        groupsAdded.add(b.groupId);
                    }
                } else {
                    uniqueBookings.push(b);
                }
            });

            setBookings(uniqueBookings);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    if (loading) return <p className="p-4">Loading...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">All Folios</h1>
            {bookings.length === 0 && <p>No bookings found.</p>}
            <ul className="space-y-2">
                {bookings.map(b => (
                    <li key={b.id}>
                        <button 
                            className="text-blue-600 hover:underline"
                            onClick={() => {
                                if (b.groupId) {
                                    router.push(`/folios/group/${b.groupId}`);
                                } else {
                                    router.push(`/folios/${b.id}`);
                                }
                            }}
                        >
                            {b.groupId 
                                ? `Group: ${b.group?.name || "مجموعة"}`
                                : `${b.guest?.firstName} ${b.guest?.lastName}`
                            } - Room: {b.room?.number || "N/A"}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
