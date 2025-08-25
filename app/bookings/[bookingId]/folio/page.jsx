'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useParams } from "next/navigation";

export default function FolioPage() {
    const params = useParams();
    const bookingId = params.bookingId;
    const socket = useSocket();

    const [folio, setFolio] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "" });
    const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "" });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchFolio();

        if (socket) {
            socket.on("FOLIO_UPDATED", (updatedFolio) => {
                if (updatedFolio.bookingId === bookingId) setFolio(updatedFolio);
            });
        }

        return () => {
            if (socket) socket.off("FOLIO_UPDATED");
        };
    }, [socket]);

    const fetchFolio = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}`);
            if (!res.ok) throw new Error("Failed to fetch folio");
            const data = await res.json();
            setFolio(data);
        } catch (err) {
            console.error(err);
            setFolio(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCharge = async () => {
        if (!newCharge.code || !newCharge.amount) return alert("Code and amount required");
        setProcessing(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}/charges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCharge)
            });
            if (!res.ok) throw new Error("Failed to add charge");
            setNewCharge({ code: "", description: "", amount: "", tax: "" });
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally { setProcessing(false); }
    };

    const handleDeleteCharge = async (chargeId) => {
        if (!confirm("Are you sure to delete this charge?")) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}/charges/${chargeId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete charge");
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally { setProcessing(false); }
    };

    const handleAddPayment = async () => {
        if (!newPayment.method || !newPayment.amount) return alert("Method and amount required");
        setProcessing(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPayment)
            });
            if (!res.ok) throw new Error("Failed to add payment");
            setNewPayment({ method: "", amount: "", ref: "" });
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally { setProcessing(false); }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!confirm("Are you sure to delete this payment?")) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}/payments/${paymentId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete payment");
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally { setProcessing(false); }
    };

    const handleCloseFolio = async () => {
        if (!confirm("Close this folio? Once closed, no more charges/payments allowed.")) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}/close`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to close folio");
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally { setProcessing(false); }
    };

    if (loading) return <div className="p-6">Loading folio...</div>;
    if (!folio) return <div className="p-6">No folio found for this booking.</div>;

    const totalCharges = folio.charges?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
    const totalPayments = folio.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const balance = totalCharges - totalPayments;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Folio for {folio.guest?.firstName} {folio.guest?.lastName}</h1>
            <p><b>Status:</b> {folio.status}</p>
            <p><b>Booking ID:</b> {folio.bookingId}</p>

            {/* Charges */}
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Charges</h2>
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700">
                            <th className="border p-2">Code</th>
                            <th className="border p-2">Description</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Tax</th>
                            <th className="border p-2">Posted By</th>
                            <th className="border p-2">Posted At</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {folio.charges?.map(c => (
                            <tr key={c.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                <td className="border p-2">{c.code}</td>
                                <td className="border p-2">{c.description}</td>
                                <td className="border p-2">{c.amount}</td>
                                <td className="border p-2">{c.tax || 0}</td>
                                <td className="border p-2">{c.postedBy?.name || "N/A"}</td>
                                <td className="border p-2">{new Date(c.postedAt).toLocaleString()}</td>
                                <td className="border p-2">
                                    <button onClick={() => handleDeleteCharge(c.id)} disabled={processing} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {folio.status === "Open" && (
                            <tr>
                                <td className="border p-2"><input type="text" placeholder="Code" value={newCharge.code} onChange={e => setNewCharge({...newCharge, code: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"><input type="text" placeholder="Description" value={newCharge.description} onChange={e => setNewCharge({...newCharge, description: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"><input type="number" placeholder="Amount" value={newCharge.amount} onChange={e => setNewCharge({...newCharge, amount: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"><input type="number" placeholder="Tax" value={newCharge.tax} onChange={e => setNewCharge({...newCharge, tax: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"></td>
                                <td className="border p-2"></td>
                                <td className="border p-2"><button onClick={handleAddCharge} disabled={processing} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Add</button></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payments */}
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Payments</h2>
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700">
                            <th className="border p-2">Method</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Reference</th>
                            <th className="border p-2">Posted By</th>
                            <th className="border p-2">Posted At</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {folio.payments?.map(p => (
                            <tr key={p.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                <td className="border p-2">{p.method}</td>
                                <td className="border p-2">{p.amount}</td>
                                <td className="border p-2">{p.ref || "-"}</td>
                                <td className="border p-2">{p.postedBy?.name || "N/A"}</td>
                                <td className="border p-2">{new Date(p.postedAt).toLocaleString()}</td>
                                <td className="border p-2">
                                    <button onClick={() => handleDeletePayment(p.id)} disabled={processing} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {folio.status === "Open" && (
                            <tr>
                                <td className="border p-2"><input type="text" placeholder="Method" value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"><input type="number" placeholder="Amount" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"><input type="text" placeholder="Reference" value={newPayment.ref} onChange={e => setNewPayment({...newPayment, ref: e.target.value})} className="w-full border p-1"/></td>
                                <td className="border p-2"></td>
                                <td className="border p-2"></td>
                                <td className="border p-2"><button onClick={handleAddPayment} disabled={processing} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add</button></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 text-right">
                <p><b>Total Charges:</b> {totalCharges}</p>
                <p><b>Total Payments:</b> {totalPayments}</p>
                <p><b>Balance:</b> {balance}</p>
                {folio.status === "Open" && <button onClick={handleCloseFolio} disabled={processing} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 mt-2">Close Folio</button>}
            </div>
        </div>
    );
}
