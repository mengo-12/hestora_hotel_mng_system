'use client';
import { useState, useEffect } from "react";
import FolioModal from "../components/FolioModal";
import { useSocket } from "../components/SocketProvider";

export default function FoliosPage() {
    const [folios, setFolios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalFolio, setModalFolio] = useState(null);
    const socket = useSocket();

    const fetchFolios = async () => {
        const res = await fetch("/api/folios");
        const data = await res.json();
        setFolios(data);
    };

    useEffect(() => { fetchFolios(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("FOLIO_UPDATED", (updatedFolio) => {
            setFolios(prev => {
                const index = prev.findIndex(f => f.id === updatedFolio.id);
                if (index !== -1) prev[index] = updatedFolio;
                else prev.push(updatedFolio);
                return [...prev];
            });
        });
        return () => socket.off("FOLIO_UPDATED");
    }, [socket]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Folios</h1>
            <button
                onClick={() => { setModalFolio(null); setShowModal(true); }}
                className="bg-yellow-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Folio
            </button>

            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Booking ID</th>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {folios.map(f => (
                        <tr key={f.id} className="border-b">
                            <td className="p-2">{f.bookingId}</td>
                            <td className="p-2">{f.guest?.firstName} {f.guest?.lastName}</td>
                            <td className="p-2">{f.status}</td>
                            <td className="p-2">{f.balance}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <FolioModal
                    folio={modalFolio}
                    onClose={() => setShowModal(false)}
                    onSaved={() => fetchFolios()}
                />
            )}
        </div>
    );
}
