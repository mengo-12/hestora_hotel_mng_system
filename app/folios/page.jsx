'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/components/SocketProvider";

export default function FoliosPage() {
    const router = useRouter();
    const socket = useSocket();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const refreshTimeoutRef = useRef(null);

    // جلب جميع الحجوزات
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bookings");
            if (!res.ok) throw new Error("Failed to fetch bookings");
            const data = await res.json();

            // تصفية لتجنب تكرار الحجوزات الجماعية أو الشركات
            const uniqueBookings = [];
            const groupsAdded = new Set();
            const companiesAdded = new Set();

            data.forEach(b => {
                if (b.groupId) {
                    if (!groupsAdded.has(b.groupId)) {
                        uniqueBookings.push({ type: "group", id: b.groupId, name: b.group?.name || "مجموعة" });
                        groupsAdded.add(b.groupId);
                    }
                } else if (b.companyId) {
                    if (!companiesAdded.has(b.companyId)) {
                        uniqueBookings.push({ type: "company", id: b.companyId, name: b.company?.name || "شركة" });
                        companiesAdded.add(b.companyId);
                    }
                } else {
                    uniqueBookings.push({ type: "individual", id: b.id, guest: b.guest, room: b.room });
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

    // ✅ البث socket لتحديث الحجوزات
    useEffect(() => {
        if (!socket) return;

        const handleBookingChange = () => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = setTimeout(() => {
                fetchBookings();
                refreshTimeoutRef.current = null;
            }, 300);
        };

        const events = ["BOOKING_CREATED", "BOOKING_UPDATED", "BOOKING_DELETED"];
        events.forEach(e => socket.on(e, handleBookingChange));

        return () => {
            events.forEach(e => socket.off(e, handleBookingChange));
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, [socket]);

    if (loading) return <p className="p-4">Loading...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">All Folios</h1>
            {bookings.length === 0 && <p>No bookings found.</p>}
            <ul className="space-y-2">
                {bookings.map(b => (
                    <li key={`${b.type}-${b.id}`}>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => {
                                if (b.type === "group") router.push(`/folios/group/${b.id}`);
                                else if (b.type === "company") router.push(`/folios/company/${b.id}`);
                                else router.push(`/folios/${b.id}`);
                            }}
                        >
                            {b.type === "group" && `Group: ${b.name}`}
                            {b.type === "company" && `Company: ${b.name}`}
                            {b.type === "individual" && `${b.guest?.firstName} ${b.guest?.lastName}`}
                            {b.room?.number && ` - Room: ${b.room.number}`}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
