// 'use client';
// import { useEffect, useState, useCallback } from 'react';
// import { useSocket } from '@/app/components/SocketProvider';
// import { use } from 'react';

// export default function BookingFolioPage({ params, session }) {
//     const { bookingId } = use(params);
//     const sessionUser = session?.user || null;
//     const socket = useSocket();

//     const [folio, setFolio] = useState(null);
//     const [charges, setCharges] = useState([]);
//     const [payments, setPayments] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [newCharge, setNewCharge] = useState({ code: '', description: '', amount: '', tax: '' });
//     const [newPayment, setNewPayment] = useState({ method: '', amount: '', ref: '' });

//     const role = sessionUser?.role || 'FrontDesk';
//     const canAddCharge = ['Admin', 'Manager', 'FrontDesk'].includes(role);
//     const canDeleteCharge = ['Admin', 'Manager'].includes(role);
//     const canAddPayment = ['Admin', 'Manager', 'FrontDesk'].includes(role);
//     const canDeletePayment = ['Admin', 'Manager'].includes(role);
//     const canCloseFolio = ['Admin', 'Manager'].includes(role);

//     // ✅ fetchFolio function متاحة في أي مكان
//     const fetchFolio = useCallback(async () => {
//         setLoading(true);
//         try {
//             const folioRes = await fetch(`/api/folios/${bookingId}`);
//             const folioData = await folioRes.json();
//             setFolio(folioData);

//             const chargesRes = await fetch(`/api/folios/${bookingId}/charges`);
//             setCharges(await chargesRes.json());

//             const paymentsRes = await fetch(`/api/folios/${bookingId}/payments`);
//             setPayments(await paymentsRes.json());
//         } catch (err) {
//             console.error("Failed to fetch folio:", err);
//         } finally {
//             setLoading(false);
//         }
//     }, [bookingId]);

//     useEffect(() => {
//         fetchFolio();
//     }, [fetchFolio]);

//     // ✅ socket listener مع debounce
//     useEffect(() => {
//         if (!socket) return;
//         let timeout = null;

//         const onUpdate = () => {
//             if (timeout) clearTimeout(timeout);
//             timeout = setTimeout(() => {
//                 fetchFolio();
//                 timeout = null;
//             }, 300); // debounce 300ms
//         };

//         const events = [
//             'BOOKING_UPDATED',
//             'CHARGE_ADDED',
//             'CHARGE_DELETED',
//             'PAYMENT_ADDED',
//             'PAYMENT_DELETED',
//             'FOLIO_CLOSED'
//         ];
//         events.forEach(e => socket.on(e, onUpdate));

//         return () => {
//             events.forEach(e => socket.off(e, onUpdate));
//             if (timeout) clearTimeout(timeout);
//         };
//     }, [socket, fetchFolio]);

//     if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
//     if (!folio) return <p className="text-center mt-4">لا توجد فواتير</p>;


//     const safeCharges = Array.isArray(charges) ? charges : [];
//     const safePayments = Array.isArray(payments) ? payments : [];

//     const subtotal = safeCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
//     const taxTotal = safeCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
//     const totalCharges = subtotal + taxTotal;
//     const totalPayments = safePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
//     const balance = totalCharges - totalPayments;
//     // ---------------- CRUD Functions ----------------

//     const handleAddCharge = async () => {
//         if (!canAddCharge) return alert('ليس لديك صلاحية لإضافة Charges');
//         try {
//             const { code, description, amount, tax } = newCharge;
//             const res = await fetch(`/api/folios/${bookingId}/charges`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ code, description, amount: Number(amount), tax: Number(tax || 0), postedById: sessionUser.id }),
//             });
//             if (!res.ok) throw new Error('Failed to add charge');
//             setNewCharge({ code: '', description: '', amount: '', tax: '' });
//             fetchFolio();
//         } catch (err) { console.error(err); alert(err.message); }
//     };

//     const handleDeleteCharge = async (id) => {
//         if (!canDeleteCharge) return alert('ليس لديك صلاحية لحذف Charges');
//         try {
//             await fetch(`/api/folios/${bookingId}/charges`, {
//                 method: 'DELETE',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ chargeId: id }),
//             });
//             fetchFolio();
//         } catch (err) { console.error(err); alert(err.message); }
//     };

//     const handleAddPayment = async () => {
//         if (!canAddPayment) return alert('ليس لديك صلاحية لإضافة Payments');
//         try {
//             const { method, amount, ref } = newPayment;
//             const res = await fetch(`/api/folios/${bookingId}/payments`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ method, amount: Number(amount), ref, postedById: sessionUser.id }),
//             });
//             if (!res.ok) throw new Error('Failed to add payment');
//             setNewPayment({ method: '', amount: '', ref: '' });
//             fetchFolio();
//         } catch (err) { console.error(err); alert(err.message); }
//     };

//     const handleDeletePayment = async (id) => {
//         if (!canDeletePayment) return alert('ليس لديك صلاحية لحذف Payments');
//         try {
//             await fetch(`/api/folios/${bookingId}/payments`, {
//                 method: 'DELETE',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ paymentId: id }),
//             });
//             fetchFolio();
//         } catch (err) { console.error(err); alert(err.message); }
//     };

//     const toggleFolioStatus = async () => {
//         if (!canCloseFolio) return alert('ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة');
//         try {
//             await fetch(`/api/folios/${bookingId}/close`, { method: 'POST' });
//             fetchFolio();
//         } catch (err) { console.error(err); }
//     };

//     // ---------------- Render ----------------

//     return (
//         <div className="p-6 max-w-5xl mx-auto">
//             <div className="rounded shadow p-4 mb-6">
//                 <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
//                 <p>Subtotal: <span className="font-bold">{subtotal.toFixed(2)}</span></p>
//                 <p>Tax Total: <span className="font-bold text-orange-600">{taxTotal.toFixed(2)}</span></p>
//                 <p>Total Charges: <span className="font-bold text-red-600">{totalCharges.toFixed(2)}</span></p>
//                 <p>Total Payments: <span className="font-bold text-green-600">{totalPayments.toFixed(2)}</span></p>
//                 <p>Balance: <span className="font-bold text-blue-600">{balance.toFixed(2)}</span></p>
//                 <button onClick={toggleFolioStatus} className="bg-yellow-500 text-white px-4 py-2 rounded mt-3">
//                     {folio.status === 'Open' ? 'Close Folio' : 'Reopen Folio'}
//                 </button>
//             </div>

//             {/* Charges Table */}
//             <div className="rounded shadow p-4 mb-6">
//                 <h3 className="text-xl font-semibold mb-3">Charges</h3>
//                 <table className="w-full border text-sm">
//                     <thead>
//                         <tr>
//                             <th className="border p-2">Code</th>
//                             <th className="border p-2">Description</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Tax %</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {safeCharges.map(c => (
//                             <tr key={c.id}>
//                                 <td className="border p-2">{c.code}</td>
//                                 <td className="border p-2">{c.description}</td>
//                                 <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
//                                 <td className="border p-2">{c.tax}</td>
//                                 <td className="border p-2 text-center">
//                                     {canDeleteCharge && <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">حذف</button>}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 {canAddCharge && (
//                     <div className="mt-4 flex gap-2 flex-wrap">
//                         <input placeholder="Code" className="border p-2 rounded" value={newCharge.code} onChange={e => setNewCharge({ ...newCharge, code: e.target.value })} />
//                         <input placeholder="Description" className="border p-2 rounded" value={newCharge.description} onChange={e => setNewCharge({ ...newCharge, description: e.target.value })} />
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })} />
//                         <input placeholder="Tax %" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={e => setNewCharge({ ...newCharge, tax: e.target.value })} />
//                         <button onClick={handleAddCharge} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
//                     </div>
//                 )}
//             </div>

//             {/* Payments Table */}
//             <div className="rounded shadow p-4">
//                 <h3 className="text-xl font-semibold mb-3">Payments</h3>
//                 <table className="w-full border text-sm">
//                     <thead>
//                         <tr>
//                             <th className="border p-2">Method</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Reference</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {safePayments.map(p => (
//                             <tr key={p.id}>
//                                 <td className="border p-2">{p.method}</td>
//                                 <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
//                                 <td className="border p-2">{p.ref || '-'}</td>
//                                 <td className="border p-2 text-center">
//                                     {canDeletePayment && <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">حذف</button>}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 {canAddPayment && (
//                     <div className="mt-4 flex gap-2 flex-wrap">
//                         <input placeholder="Method" className="border p-2 rounded" value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value })} />
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
//                         <input placeholder="Reference" className="border p-2 rounded" value={newPayment.ref} onChange={e => setNewPayment({ ...newPayment, ref: e.target.value })} />
//                         <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }



'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/app/components/SocketProvider';
import { FaBed, FaMoneyBillWave, FaReceipt } from "react-icons/fa";

export default function BookingFolioPage({ params, session }) {
    const { bookingId } = params;
    const sessionUser = session?.user || null;
    const socket = useSocket();

    const [folios, setFolios] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCharge, setNewCharge] = useState({ code: '', description: '', amount: '', tax: '', guestId: '' });
    const [newPayment, setNewPayment] = useState({ method: '', amount: '', ref: '', guestId: '' });

    const role = sessionUser?.role || 'FrontDesk';
    const canAddCharge = ['Admin', 'Manager', 'FrontDesk'].includes(role);
    const canDeleteCharge = ['Admin', 'Manager'].includes(role);
    const canAddPayment = ['Admin', 'Manager', 'FrontDesk'].includes(role);
    const canDeletePayment = ['Admin', 'Manager'].includes(role);
    const canCloseFolio = ['Admin', 'Manager'].includes(role);

    const fetchFolio = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/folios/${bookingId}`);
            const folioData = await res.json();
            setFolios(folioData || []);
            setBookings(folioData.map(f => f.booking).filter(Boolean));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => { fetchFolio(); }, [fetchFolio]);

    useEffect(() => {
        if (!socket) return;
        const onUpdate = () => setTimeout(fetchFolio, 300);

        ['BOOKING_UPDATED', 'CHARGE_ADDED', 'CHARGE_DELETED', 'PAYMENT_ADDED', 'PAYMENT_DELETED', 'FOLIO_CLOSED']
            .forEach(e => socket.on(e, onUpdate));
        return () => ['BOOKING_UPDATED', 'CHARGE_ADDED', 'CHARGE_DELETED', 'PAYMENT_ADDED', 'PAYMENT_DELETED', 'FOLIO_CLOSED']
            .forEach(e => socket.off(e, onUpdate));
    }, [socket, fetchFolio]);

    if (loading) return <p className="p-4">جاري تحميل البيانات...</p>;
    if (!folios.length) return <p className="p-4 text-center">لا توجد فواتير</p>;

    const allCharges = folios.flatMap(f => (f.charges ?? []).map(c => ({
        ...c,
        folioId: f.id,
        guestName: f.booking?.guest ? `${f.booking.guest.firstName} ${f.booking.guest.lastName}` : "-"
    })));
    const allPayments = folios.flatMap(f => (f.payments ?? []).map(p => ({
        ...p,
        folioId: f.id,
        guestName: p.booking?.guest ? `${p.booking.guest.firstName} ${p.booking.guest.lastName}` : "-"
    })));

    const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
    const totalCharges = subtotal + taxTotal;
    const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = totalCharges - totalPayments;

    const handleAddCharge = async () => {
        if (!canAddCharge) return alert("ليس لديك صلاحية لإضافة Charges");
        try {
            await fetch(`/api/folios/${bookingId}/charges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newCharge,
                    amount: Number(newCharge.amount),
                    tax: Number(newCharge.tax || 0),
                    postedById: sessionUser.id
                })
            });
            setNewCharge({ code: '', description: '', amount: '', tax: '', guestId: '' });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleDeleteCharge = async (id) => {
        if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
        try {
            await fetch(`/api/folios/${bookingId}/charges`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId: id })
            });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleAddPayment = async () => {
        if (!canAddPayment) return alert("ليس لديك صلاحية لإضافة Payments");
        try {
            await fetch(`/api/folios/${bookingId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newPayment,
                    amount: Number(newPayment.amount),
                    postedById: sessionUser.id
                })
            });
            setNewPayment({ method: '', amount: '', ref: '', guestId: '' });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleDeletePayment = async (id) => {
        if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
        try {
            await fetch(`/api/folios/${bookingId}/payments`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: id })
            });
            fetchFolio();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const toggleFolioStatus = async () => {
        if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
        try { await fetch(`/api/folios/${bookingId}/close`, { method: 'POST' }); fetchFolio(); }
        catch (err) { console.error(err); }
    };

    return (
        <div className="p-6 space-y-8 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-6">📑 فاتورة الحجز الفردي</h1>

            {/* Folio Summary */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Folio Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">Subtotal: <span className="font-bold">{subtotal.toFixed(2)}</span></div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">Tax: <span className="text-orange-500 font-bold">{taxTotal.toFixed(2)}</span></div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">Charges: <span className="text-red-500 font-bold">{totalCharges.toFixed(2)}</span></div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">Payments: <span className="text-green-500 font-bold">{totalPayments.toFixed(2)}</span></div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">Balance: <span className="text-blue-500 font-bold">{balance.toFixed(2)}</span></div>
                </div>
            </div>

            {/* Rooming List */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><FaBed className="text-blue-500" /> Rooming List</h2>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">{bookings.length} Guests</span>
                </div>
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left">👤 Guest</th>
                                <th className="px-4 py-3 text-left">🏨 Room</th>
                                <th className="px-4 py-3 text-left">📌 Status</th>
                                <th className="px-4 py-3 text-left">📅 Check-in</th>
                                <th className="px-4 py-3 text-left">📅 Check-out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b, i) => (
                                <tr key={b.id} className={`${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800"} hover:bg-blue-50 dark:hover:bg-gray-700 transition`}>
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{b.guest?.firstName} {b.guest?.lastName}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.room?.number || "-"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${b.status === "CheckedIn" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" : b.status === "CheckedOut" ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300" : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"}`}>{b.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "-"}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "-"}</td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">لا يوجد ضيوف في القائمة</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charges */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100"><FaMoneyBillWave className="text-yellow-500" /> Charges</h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300">{allCharges.length} Items</span>
                </div>
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="w-full table-fixed text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="w-1/6 px-4 py-3 text-left">👤 Guest</th>
                                <th className="w-1/6 px-4 py-3 text-left">Code</th>
                                <th className="w-2/6 px-4 py-3 text-left">Description</th>
                                <th className="w-1/6 px-4 py-3 text-left">Amount</th>
                                <th className="w-1/12 px-4 py-3 text-left">Tax %</th>
                                {canDeleteCharge && <th className="w-1/12 px-4 py-3 text-center">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {allCharges.map((c, i) => (
                                <tr key={c.id} className={`${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800"} hover:bg-orange-50 dark:hover:bg-gray-700 transition`}>
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 break-words">{c.guestName}</td>
                                    <td className="px-4 py-3 break-words">{c.code}</td>
                                    <td className="px-4 py-3 break-words">{c.description}</td>
                                    <td className="px-4 py-3 text-green-600 dark:text-green-400">{Number(c.amount).toFixed(2)}</td>
                                    <td className="px-4 py-3">{c.tax}%</td>
                                    {canDeleteCharge && <td className="px-4 py-3 text-center"><button onClick={() => handleDeleteCharge(c.id)} className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-300 rounded-lg">حذف</button></td>}
                                </tr>
                            ))}
                            {allCharges.length === 0 && <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">لا توجد رسوم مضافة بعد</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments */}
            <div className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold mb-6">💳 Payments</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payments Table */}
                    <div className="lg:col-span-2">
                        <div className="overflow-x-auto border rounded-xl dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                    <tr>
                                        <th className="p-2 text-left">Guest</th>
                                        <th className="p-2 text-left">Method</th>
                                        <th className="p-2 text-left">Amount</th>
                                        <th className="p-2 text-left">Reference</th>
                                        <th className="p-2 text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {allPayments.map((p) => (
                                        <tr key={`${p.id}-${p.folioId}`} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="p-2">{p.guestName}</td>
                                            <td className="p-2">{p.method}</td>
                                            <td className="p-2">{Number(p.amount).toFixed(2)}</td>
                                            <td className="p-2">{p.ref || "-"}</td>
                                            <td className="p-2 text-center">
                                                {canDeletePayment && (
                                                    <button
                                                        onClick={() => handleDeletePayment(p.id)}
                                                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                    >
                                                        حذف
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {allPayments.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                لا توجد مدفوعات
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Form */}
                    {canAddPayment && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col gap-4 border dark:border-gray-700">
                            <h4 className="text-lg font-semibold">➕ إضافة دفعة</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Guest *</label>
                                <select
                                    value={newPayment.guestId}
                                    onChange={(e) =>
                                        setNewPayment({ ...newPayment, guestId: e.target.value })
                                    }
                                    className="w-full p-2 mt-1 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                >
                                    <option value="">اختر الضيف</option>
                                    {bookings.map((b) => (
                                        <option key={b.id} value={b.guest?.id}>
                                            {b.guest?.firstName} {b.guest?.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Method *</label>
                                <input
                                    placeholder="مثال: Cash, Card"
                                    className="w-full p-2 mt-1 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    value={newPayment.method}
                                    onChange={(e) =>
                                        setNewPayment({ ...newPayment, method: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Amount *</label>
                                <input
                                    placeholder="0.00"
                                    type="number"
                                    className="w-full p-2 mt-1 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    value={newPayment.amount}
                                    onChange={(e) =>
                                        setNewPayment({ ...newPayment, amount: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">Reference</label>
                                <input
                                    placeholder="رقم المعاملة أو المرجع"
                                    className="w-full p-2 mt-1 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                    value={newPayment.ref}
                                    onChange={(e) =>
                                        setNewPayment({ ...newPayment, ref: e.target.value })
                                    }
                                />
                            </div>

                            <button
                                onClick={handleAddPayment}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                إضافة
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {canCloseFolio && <div className="text-center mt-6"><button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition" onClick={toggleFolioStatus}>إغلاق / إعادة فتح الفاتورة</button></div>}
        </div>
    );
}



