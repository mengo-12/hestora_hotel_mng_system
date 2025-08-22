'use client';
import { useState, useEffect } from "react";
import GuestModal from "../components/GuestModal";
import { useSocket } from "../components/SocketProvider";

export default function GuestsPage() {
    const [guests, setGuests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalGuest, setModalGuest] = useState(null);
    const socket = useSocket();

    const fetchGuests = async () => {
        const res = await fetch("/api/guests");
        const data = await res.json();
        setGuests(data);
    };

    useEffect(() => { fetchGuests(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("GUEST_UPDATED", (updatedGuest) => {
            setGuests(prev => {
                const index = prev.findIndex(g => g.id === updatedGuest.id);
                if (index !== -1) prev[index] = updatedGuest;
                else prev.push(updatedGuest);
                return [...prev];
            });
        });
        return () => socket.off("GUEST_UPDATED");
    }, [socket]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Guests</h1>
            <button
                onClick={() => { setModalGuest(null); setShowModal(true); }}
                className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Guest
            </button>

            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Email</th>
                    </tr>
                </thead>
                <tbody>
                    {guests.map(g => (
                        <tr key={g.id} className="border-b">
                            <td className="p-2">{g.firstName} {g.lastName}</td>
                            <td className="p-2">{g.phone || "-"}</td>
                            <td className="p-2">{g.email || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <GuestModal
                    guest={modalGuest}
                    onClose={() => setShowModal(false)}
                    onSaved={() => fetchGuests()}
                />
            )}
        </div>
    );
}
