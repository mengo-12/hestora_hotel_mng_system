'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useRouter } from "next/navigation";

export default function FoliosPage() {
    const [folios, setFolios] = useState([]);
    const socket = useSocket();
    const router = useRouter();

    useEffect(() => {
        fetchFolios();

        if (socket) {
            socket.on("FOLIO_UPDATED", updatedFolio => {
                setFolios(prev => prev.map(f => f.id === updatedFolio.id ? updatedFolio : f));
            });
            socket.on("FOLIO_CREATED", newFolio => {
                setFolios(prev => [...prev, newFolio]);
            });
        }

        return () => {
            if (socket) {
                socket.off("FOLIO_UPDATED");
                socket.off("FOLIO_CREATED");
            }
        };
    }, [socket]);

    const fetchFolios = async () => {
        try {
            const res = await fetch("/api/folios");
            const data = await res.json();
            setFolios(Array.isArray(data) ? data : []);
        } catch {
            setFolios([]);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Folios</h1>
            {folios.length === 0 && <p>No folios found.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folios.map(f => (
                    <div
                        key={f.id}
                        className="p-4 rounded-lg shadow cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105"
                        onClick={() => router.push(`/folios/${f.id}`)}
                    >
                        <h2 className="text-lg font-semibold mb-2">{f.guest?.firstName} {f.guest?.lastName}</h2>
                        <p><b>Booking ID:</b> {f.bookingId}</p>
                        <p><b>Status:</b> {f.status}</p>
                        <p><b>Total Charges:</b> {f.charges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0}</p>
                        <p><b>Total Payments:</b> {f.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0}</p>
                        <p><b>Balance:</b> {(f.charges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0) - (f.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
