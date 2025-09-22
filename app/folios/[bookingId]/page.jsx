'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/app/components/SocketProvider';
import { use } from 'react';

export default function BookingFolioPage({ params, session }) {
    const { bookingId } = use(params);
    const sessionUser = session?.user || null;
    const socket = useSocket();

    const [folio, setFolio] = useState(null);
    const [charges, setCharges] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newCharge, setNewCharge] = useState({ code: '', description: '', amount: '', tax: '' });
    const [newPayment, setNewPayment] = useState({ method: '', amount: '', ref: '' });

    const role = sessionUser?.role || 'FrontDesk';
    const canAddCharge = ['Admin', 'Manager', 'FrontDesk'].includes(role);
    const canDeleteCharge = ['Admin', 'Manager'].includes(role);
    const canAddPayment = ['Admin', 'Manager', 'FrontDesk'].includes(role);
    const canDeletePayment = ['Admin', 'Manager'].includes(role);
    const canCloseFolio = ['Admin', 'Manager'].includes(role);

    // ✅ fetchFolio function متاحة في أي مكان
    const fetchFolio = useCallback(async () => {
        setLoading(true);
        try {
            const folioRes = await fetch(`/api/folios/${bookingId}`);
            const folioData = await folioRes.json();
            setFolio(folioData);

            const chargesRes = await fetch(`/api/folios/${bookingId}/charges`);
            setCharges(await chargesRes.json());

            const paymentsRes = await fetch(`/api/folios/${bookingId}/payments`);
            setPayments(await paymentsRes.json());
        } catch (err) {
            console.error("Failed to fetch folio:", err);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchFolio();
    }, [fetchFolio]);

    // ✅ socket listener مع debounce
    useEffect(() => {
        if (!socket) return;
        let timeout = null;

        const onUpdate = () => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                fetchFolio();
                timeout = null;
            }, 300); // debounce 300ms
        };

        const events = [
            'BOOKING_UPDATED',
            'CHARGE_ADDED',
            'CHARGE_DELETED',
            'PAYMENT_ADDED',
            'PAYMENT_DELETED',
            'FOLIO_CLOSED'
        ];
        events.forEach(e => socket.on(e, onUpdate));

        return () => {
            events.forEach(e => socket.off(e, onUpdate));
            if (timeout) clearTimeout(timeout);
        };
    }, [socket, fetchFolio]);

    if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
    if (!folio) return <p className="text-center mt-4">لا توجد فواتير</p>;


    const safeCharges = Array.isArray(charges) ? charges : [];
    const safePayments = Array.isArray(payments) ? payments : [];

    const subtotal = safeCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const taxTotal = safeCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
    const totalCharges = subtotal + taxTotal;
    const totalPayments = safePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = totalCharges - totalPayments;
    // ---------------- CRUD Functions ----------------

    const handleAddCharge = async () => {
        if (!canAddCharge) return alert('ليس لديك صلاحية لإضافة Charges');
        try {
            const { code, description, amount, tax } = newCharge;
            const res = await fetch(`/api/folios/${bookingId}/charges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, description, amount: Number(amount), tax: Number(tax || 0), postedById: sessionUser.id }),
            });
            if (!res.ok) throw new Error('Failed to add charge');
            setNewCharge({ code: '', description: '', amount: '', tax: '' });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleDeleteCharge = async (id) => {
        if (!canDeleteCharge) return alert('ليس لديك صلاحية لحذف Charges');
        try {
            await fetch(`/api/folios/${bookingId}/charges`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chargeId: id }),
            });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleAddPayment = async () => {
        if (!canAddPayment) return alert('ليس لديك صلاحية لإضافة Payments');
        try {
            const { method, amount, ref } = newPayment;
            const res = await fetch(`/api/folios/${bookingId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method, amount: Number(amount), ref, postedById: sessionUser.id }),
            });
            if (!res.ok) throw new Error('Failed to add payment');
            setNewPayment({ method: '', amount: '', ref: '' });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleDeletePayment = async (id) => {
        if (!canDeletePayment) return alert('ليس لديك صلاحية لحذف Payments');
        try {
            await fetch(`/api/folios/${bookingId}/payments`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: id }),
            });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const toggleFolioStatus = async () => {
        if (!canCloseFolio) return alert('ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة');
        try {
            await fetch(`/api/folios/${bookingId}/close`, { method: 'POST' });
            fetchFolio();
        } catch (err) { console.error(err); }
    };

    // ---------------- Render ----------------

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="rounded shadow p-4 mb-6">
                <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
                <p>Subtotal: <span className="font-bold">{subtotal.toFixed(2)}</span></p>
                <p>Tax Total: <span className="font-bold text-orange-600">{taxTotal.toFixed(2)}</span></p>
                <p>Total Charges: <span className="font-bold text-red-600">{totalCharges.toFixed(2)}</span></p>
                <p>Total Payments: <span className="font-bold text-green-600">{totalPayments.toFixed(2)}</span></p>
                <p>Balance: <span className="font-bold text-blue-600">{balance.toFixed(2)}</span></p>
                <button onClick={toggleFolioStatus} className="bg-yellow-500 text-white px-4 py-2 rounded mt-3">
                    {folio.status === 'Open' ? 'Close Folio' : 'Reopen Folio'}
                </button>
            </div>

            {/* Charges Table */}
            <div className="rounded shadow p-4 mb-6">
                <h3 className="text-xl font-semibold mb-3">Charges</h3>
                <table className="w-full border text-sm">
                    <thead>
                        <tr>
                            <th className="border p-2">Code</th>
                            <th className="border p-2">Description</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Tax %</th>
                            <th className="border p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeCharges.map(c => (
                            <tr key={c.id}>
                                <td className="border p-2">{c.code}</td>
                                <td className="border p-2">{c.description}</td>
                                <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
                                <td className="border p-2">{c.tax}</td>
                                <td className="border p-2 text-center">
                                    {canDeleteCharge && <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">حذف</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {canAddCharge && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                        <input placeholder="Code" className="border p-2 rounded" value={newCharge.code} onChange={e => setNewCharge({ ...newCharge, code: e.target.value })} />
                        <input placeholder="Description" className="border p-2 rounded" value={newCharge.description} onChange={e => setNewCharge({ ...newCharge, description: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })} />
                        <input placeholder="Tax %" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={e => setNewCharge({ ...newCharge, tax: e.target.value })} />
                        <button onClick={handleAddCharge} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
                    </div>
                )}
            </div>

            {/* Payments Table */}
            <div className="rounded shadow p-4">
                <h3 className="text-xl font-semibold mb-3">Payments</h3>
                <table className="w-full border text-sm">
                    <thead>
                        <tr>
                            <th className="border p-2">Method</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Reference</th>
                            <th className="border p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safePayments.map(p => (
                            <tr key={p.id}>
                                <td className="border p-2">{p.method}</td>
                                <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
                                <td className="border p-2">{p.ref || '-'}</td>
                                <td className="border p-2 text-center">
                                    {canDeletePayment && <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">حذف</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {canAddPayment && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                        <input placeholder="Method" className="border p-2 rounded" value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
                        <input placeholder="Reference" className="border p-2 rounded" value={newPayment.ref} onChange={e => setNewPayment({ ...newPayment, ref: e.target.value })} />
                        <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
                    </div>
                )}
            </div>
        </div>
    );
}
