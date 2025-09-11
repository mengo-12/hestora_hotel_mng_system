'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/app/components/SocketProvider";

export default function FolioPage() {
    const { folioId } = useParams();
    const socket = useSocket();

    const [folio, setFolio] = useState(null);
    const [charges, setCharges] = useState([]);
    const [payments, setPayments] = useState([]);
    const [newCharge, setNewCharge] = useState({ code: '', description: '', amount: '' });
    const [newPayment, setNewPayment] = useState({ method: '', amount: '' });

    useEffect(() => {
        fetchFolio();

        if (socket) {
            socket.on("FOLIO_UPDATED", updatedFolio => {
                if (updatedFolio.id === folioId) {
                    setFolio(updatedFolio);
                    setCharges(updatedFolio.charges || []);
                    setPayments(updatedFolio.payments || []);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off("FOLIO_UPDATED");
            }
        };
    }, [socket, folioId]);

    const fetchFolio = async () => {
        try {
            const res = await fetch(`/api/folios/${folioId}`);
            if (!res.ok) throw new Error("Folio not found");
            const data = await res.json();
            setFolio(data);
            setCharges(data.charges || []);
            setPayments(data.payments || []);
        } catch (err) {
            console.error(err);
            setFolio(null);
        }
    };

    const handleAddCharge = async () => {
        if (!newCharge.code || !newCharge.amount) return alert("Code and Amount are required");
        try {
            const res = await fetch(`/api/folios/${folioId}/charges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCharge)
            });
            if (!res.ok) throw new Error("Failed to add charge");
            const added = await res.json();
            setCharges(prev => [...prev, added]);
            setNewCharge({ code: '', description: '', amount: '' });
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleAddPayment = async () => {
        if (!newPayment.method || !newPayment.amount) return alert("Method and Amount are required");
        try {
            const res = await fetch(`/api/folios/${folioId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPayment)
            });
            if (!res.ok) throw new Error("Failed to add payment");
            const added = await res.json();
            setPayments(prev => [...prev, added]);
            setNewPayment({ method: '', amount: '' });
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!folio) return <div className="p-6">Loading Folio...</div>;

    const totalCharges = charges.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = totalCharges - totalPayments;


    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Folio for {folio.guest?.firstName} {folio.guest?.lastName}</h1>
            <p><b>Status:</b> {folio.status}</p>
            <p><b>Booking ID:</b> {folio.bookingId}</p>

            {/* Charges */}
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Charges</h2>
                <table className="w-full border border-gray-300 dark:border-gray-600 mb-4">
                    <thead className="bg-gray-200 dark:bg-gray-700">
                        <tr>
                            <th className="border px-2 py-1">Code</th>
                            <th className="border px-2 py-1">Description</th>
                            <th className="border px-2 py-1">Amount</th>
                            <th className="border px-2 py-1">Tax</th>
                            <th className="border px-2 py-1">Posted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {charges.map(c => (
                            <tr key={c.id}>
                                <td className="border px-2 py-1">{c.code}</td>
                                <td className="border px-2 py-1">{c.description}</td>
                                <td className="border px-2 py-1">{c.amount}</td>
                                <td className="border px-2 py-1">{c.tax || 0}</td>
                                <td className="border px-2 py-1">{new Date(c.postedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Add Charge */}
                <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="Code" value={newCharge.code} onChange={e => setNewCharge({...newCharge, code: e.target.value})} className="border px-2 py-1 rounded"/>
                    <input type="text" placeholder="Description" value={newCharge.description} onChange={e => setNewCharge({...newCharge, description: e.target.value})} className="border px-2 py-1 rounded"/>
                    <input type="number" placeholder="Amount" value={newCharge.amount} onChange={e => setNewCharge({...newCharge, amount: e.target.value})} className="border px-2 py-1 rounded"/>
                    <button onClick={handleAddCharge} className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700">Add Charge</button>
                </div>
            </div>

            {/* Payments */}
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Payments</h2>
                <table className="w-full border border-gray-300 dark:border-gray-600 mb-4">
                    <thead className="bg-gray-200 dark:bg-gray-700">
                        <tr>
                            <th className="border px-2 py-1">Method</th>
                            <th className="border px-2 py-1">Amount</th>
                            <th className="border px-2 py-1">Posted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p.id}>
                                <td className="border px-2 py-1">{p.method}</td>
                                <td className="border px-2 py-1">{p.amount}</td>
                                <td className="border px-2 py-1">{new Date(p.postedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Add Payment */}
                <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="Method" value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} className="border px-2 py-1 rounded"/>
                    <input type="number" placeholder="Amount" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="border px-2 py-1 rounded"/>
                    <button onClick={handleAddPayment} className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Add Payment</button>
                </div>
            </div>

            {/* Balance */}
            <div className="mt-4 text-right">
                <p className="font-semibold">Total Charges: {totalCharges}</p>
                <p className="font-semibold">Total Payments: {totalPayments}</p>
                <p className="font-bold text-lg">Balance: {balance}</p>
            </div>
        </div>
    );
}
