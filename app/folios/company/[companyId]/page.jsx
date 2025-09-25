// 'use client';
// import { useEffect, useState } from "react";
// import { getSession } from "next-auth/react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function CompanyFolioPage({ params }) {
//     const companyId = params?.companyId;
//     const socket = useSocket();

//     const [session, setSession] = useState(null);
//     const [bookings, setBookings] = useState([]);
//     const [folios, setFolios] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "", guestId: "" });
//     const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "", guestId: "" });

//     // الصلاحيات
//     const role = session?.user?.role || "FrontDesk";
//     const canAddCharge = ["Admin", "Manager", "FrontDesk"].includes(role);
//     const canDeleteCharge = ["Admin", "Manager"].includes(role);
//     const canAddPayment = ["Admin", "Manager", "FrontDesk"].includes(role);
//     const canDeletePayment = ["Admin", "Manager"].includes(role);
//     const canCloseFolio = ["Admin", "Manager"].includes(role);

//     // جلب الجلسة
//     useEffect(() => {
//         getSession()
//             .then(sess => setSession(sess))
//             .catch(err => {
//                 console.error("getSession error:", err);
//                 setSession(null);
//             });
//     }, []);

//     // دالة fetch آمنة
//     const safeFetchJson = async (url, options = {}) => {
//         try {
//             const res = await fetch(url, options);
//             const text = await res.text();
//             if (!res.ok) throw new Error(`HTTP error ${res.status}: ${text}`);
//             return JSON.parse(text);
//         } catch (err) {
//             console.error("Fetch error:", err);
//             throw err;
//         }
//     };

//     // جلب بيانات الشركة: bookings + folios
//     const fetchCompanyData = async () => {
//         if (!companyId || !session) return;
//         setLoading(true);
//         setError(null);
//         try {
//             const data = await safeFetchJson(`/api/folios/company/${companyId}`);
//             setBookings(Array.isArray(data.bookings) ? data.bookings : []);

//             // Folio وهمي يجمع كل Charges و Payments
//             const foliosData = [
//                 {
//                     id: "companyFolio",
//                     charges: Array.isArray(data.charges) ? data.charges : [],
//                     payments: Array.isArray(data.payments) ? data.payments : [],
//                     booking: null,
//                 }
//             ];
//             setFolios(foliosData);
//         } catch (err) {
//             setError(err.message || "Failed to fetch company data");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchCompanyData(); }, [companyId, session]);



//     useEffect(() => {
//         if (!socket) return;

//         // دالة الاستقبال لجميع الأحداث
//         const onBookingEvent = (payload) => {
//             const bookingIds = bookings.map(b => b.id);

//             const event = payload?.event;
//             const data = payload?.data || {};

//             // في الحذف: payload.data.id يحتوي على id
//             const payloadBookingId = data?.bookingId || data?.id || payload?.bookingId || payload?.id;
//             const payloadCompanyId = data?.companyId || payload?.companyId;

//             // التعامل مع كل الأحداث
//             if (
//                 (event === "BOOKING_DELETED" && payloadBookingId) || // حذف
//                 (payloadBookingId && bookingIds.includes(payloadBookingId)) || // تعديل أو إنشاء
//                 (payloadCompanyId === companyId) // أي حدث متعلق بالشركة
//             ) {
//                 fetchCompanyData(); // تحديث تلقائي للفواتير
//             }
//         };

//         const events = [
//             "BOOKING_UPDATED",
//             "BOOKING_CREATED",
//             "BOOKING_DELETED",
//             "FOLIO_CREATED",
//             "CHARGE_ADDED",
//             "CHARGE_DELETED",
//             "PAYMENT_ADDED",
//             "PAYMENT_DELETED",
//             "FOLIO_CLOSED"
//         ];

//         // الاشتراك في الأحداث
//         events.forEach(event => socket.on(event, onBookingEvent));

//         // تنظيف الاشتراك عند تفكيك المكون
//         return () => events.forEach(event => socket.off(event, onBookingEvent));

//     }, [socket, bookings, companyId]);


//     if (!session) return <p>Loading session...</p>;
//     if (loading) return <p className="p-4">جاري تحميل بيانات الشركة...</p>;
//     if (error) return <p className="p-4 text-red-500">{error}</p>;

//     // دمج Charges و Payments لكل الفواتير
//     const allCharges = folios.flatMap(f => (f.charges ?? []).map(c => ({
//         ...c,
//         folioId: f.id,
//         guestName: c.booking?.guest ? `${c.booking.guest.firstName} ${c.booking.guest.lastName}` : "-"
//     })));
//     const allPayments = folios.flatMap(f => (f.payments ?? []).map(p => ({
//         ...p,
//         folioId: f.id,
//         guestName: p.booking?.guest ? `${p.booking.guest.firstName} ${p.booking.guest.lastName}` : "-"
//     })));

//     const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
//     const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
//     const totalCharges = subtotal + taxTotal;
//     const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
//     const balance = totalCharges - totalPayments;
//     // CRUD functions
//     const handleAddCharge = async () => {
//         if (!canAddCharge) return alert("ليس لديك صلاحية لإضافة Charges");
//         try {
//             await safeFetchJson(`/api/folios/company/${companyId}/charges`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     ...newCharge,
//                     amount: Number(newCharge.amount),
//                     tax: Number(newCharge.tax || 0),
//                     postedById: session.user.id
//                 })
//             });
//             setNewCharge({ code: "", description: "", amount: "", tax: "", guestId: "" });
//             fetchCompanyData();
//         } catch (err) { alert(err.message); }
//     };

//     const handleDeleteCharge = async (chargeId) => {
//         if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
//         try {
//             await safeFetchJson(`/api/folios/company/${companyId}/charges`, {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ chargeId }),
//             });
//             fetchCompanyData();
//         } catch (err) { alert(err.message); }
//     };

//     const handleAddPayment = async () => {
//         if (!canAddPayment) return alert("ليس لديك صلاحية لإضافة Payments");
//         try {
//             await safeFetchJson(`/api/folios/company/${companyId}/payments`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     ...newPayment,
//                     amount: Number(newPayment.amount),
//                     postedById: session.user.id
//                 }),
//             });
//             setNewPayment({ method: "", amount: "", ref: "", guestId: "" });
//             fetchCompanyData();
//         } catch (err) { alert(err.message); }
//     };

//     const handleDeletePayment = async (paymentId) => {
//         if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
//         try {
//             await safeFetchJson(`/api/folios/company/${companyId}/payments`, {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ paymentId }),
//             });
//             fetchCompanyData();
//         } catch (err) { alert(err.message); }
//     };

//     const toggleFolioStatus = async () => {
//         if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
//         try {
//             await safeFetchJson(`/api/folios/company/${companyId}/close`, { method: "POST" });
//             fetchCompanyData();
//         } catch (err) { console.error(err); }
//     };

//     return (
//         <div className="p-6 space-y-6">
//             <h1 className="text-2xl font-bold mb-4">فاتورة الشركة</h1>

//             {/* Rooming List */}
//             <div className="rounded shadow p-4">
//                 <h2 className="text-xl font-bold mb-3">Rooming List</h2>
//                 <table className="w-full border text-sm">
//                     <thead>
//                         <tr>
//                             <th className="border p-2">Guest</th>
//                             <th className="border p-2">Room</th>
//                             <th className="border p-2">Status</th>
//                             <th className="border p-2">Check-in</th>
//                             <th className="border p-2">Check-out</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {bookings.map(b => (
//                             <tr key={b.id}>
//                                 <td className="border p-2">{b.guest?.firstName} {b.guest?.lastName}</td>
//                                 <td className="border p-2">{b.room?.number || "-"}</td>
//                                 <td className="border p-2">{b.status}</td>
//                                 <td className="border p-2">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "-"}</td>
//                                 <td className="border p-2">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "-"}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Folio Summary */}
//             <div className="rounded shadow p-4 mb-6">
//                 <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
//                 <p>Subtotal: <span className="font-bold">{subtotal.toFixed(2)}</span></p>
//                 <p>Tax Total: <span className="text-orange-600 font-bold">{taxTotal.toFixed(2)}</span></p>
//                 <p>Total Charges: <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
//                 <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
//                 <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
//                 {canCloseFolio && (
//                     <button onClick={toggleFolioStatus} className="bg-yellow-500 text-white px-4 py-2 rounded mt-3 hover:bg-yellow-600">
//                         Toggle Folio Status
//                     </button>
//                 )}
//             </div>

//             {/* Charges Table */}
//             <div className="rounded shadow p-4 mb-6">
//                 <h3 className="text-xl font-semibold mb-3">Charges</h3>
//                 <table className="w-full border text-sm">
//                     <thead>
//                         <tr>
//                             <th className="border p-2">Guest</th>
//                             <th className="border p-2">Code</th>
//                             <th className="border p-2">Description</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Tax %</th>
//                             <th className="border p-2">Tax Value</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {allCharges.map(c => {
//                             const taxValue = (Number(c.amount || 0) * Number(c.tax || 0)) / 100;
//                             return (
//                                 <tr key={`${c.id}-${c.folioId}`}>
//                                     <td className="border p-2">{c.guestName}</td>
//                                     <td className="border p-2">{c.code}</td>
//                                     <td className="border p-2">{c.description}</td>
//                                     <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
//                                     <td className="border p-2">{c.tax}%</td>
//                                     <td className="border p-2">{taxValue.toFixed(2)}</td>
//                                     <td className="border p-2 text-center">
//                                         {canDeleteCharge && (
//                                             <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">حذف</button>
//                                         )}
//                                     </td>
//                                 </tr>
//                             )
//                         })}
//                     </tbody>
//                 </table>

//                 {canAddCharge && (
//                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
//                         <select value={newCharge.guestId} onChange={(e) => setNewCharge({ ...newCharge, guestId: e.target.value })} className="border p-2 rounded">
//                             <option value="">اختر الضيف</option>
//                             {bookings.map(b => <option key={b.id} value={b.guest?.id}>{b.guest?.firstName} {b.guest?.lastName}</option>)}
//                         </select>
//                         <input placeholder="Code" className="border p-2 rounded flex-1" value={newCharge.code} onChange={(e) => setNewCharge({ ...newCharge, code: e.target.value })} />
//                         <input placeholder="Description" className="border p-2 rounded flex-1" value={newCharge.description} onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })} />
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })} />
//                         <input placeholder="Tax %" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={(e) => setNewCharge({ ...newCharge, tax: e.target.value })} />
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
//                             <th className="border p-2">Guest</th>
//                             <th className="border p-2">Method</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Reference</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {allPayments.map(p => (
//                             <tr key={`${p.id}-${p.folioId}`}>
//                                 <td className="border p-2">{p.guestName}</td>
//                                 <td className="border p-2">{p.method}</td>
//                                 <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
//                                 <td className="border p-2">{p.ref || "-"}</td>
//                                 <td className="border p-2 text-center">
//                                     {canDeletePayment && (
//                                         <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">حذف</button>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>

//                 {canAddPayment && (
//                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
//                         <select value={newPayment.guestId} onChange={(e) => setNewPayment({ ...newPayment, guestId: e.target.value })} className="border p-2 rounded">
//                             <option value="">اختر الضيف</option>
//                             {bookings.map(b => <option key={b.id} value={b.guest?.id}>{b.guest?.firstName} {b.guest?.lastName}</option>)}
//                         </select>
//                         <input placeholder="Method" className="border p-2 rounded flex-1" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} />
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
//                         <input placeholder="Reference" className="border p-2 rounded flex-1" value={newPayment.ref} onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })} />
//                         <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }




'use client';
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useSocket } from "@/app/components/SocketProvider";
import { FaReceipt, FaUser, FaCreditCard, FaBed } from "react-icons/fa";

export default function CompanyFolioPage({ params }) {
    const companyId = params?.companyId;
    const socket = useSocket();

    const [session, setSession] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [folios, setFolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "", guestId: "" });
    const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "", guestId: "" });

    // الصلاحيات
    const role = session?.user?.role || "FrontDesk";
    const canAddCharge = ["Admin", "Manager", "FrontDesk"].includes(role);
    const canDeleteCharge = ["Admin", "Manager"].includes(role);
    const canAddPayment = ["Admin", "Manager", "FrontDesk"].includes(role);
    const canDeletePayment = ["Admin", "Manager"].includes(role);
    const canCloseFolio = ["Admin", "Manager"].includes(role);

    // جلب الجلسة
    useEffect(() => {
        getSession()
            .then(sess => setSession(sess))
            .catch(err => { console.error(err); setSession(null); });
    }, []);

    const safeFetchJson = async (url, options = {}) => {
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            if (!res.ok) throw new Error(`HTTP error ${res.status}: ${text}`);
            return JSON.parse(text);
        } catch (err) { console.error(err); throw err; }
    };

    const fetchCompanyData = async () => {
        if (!companyId || !session) return;
        setLoading(true); setError(null);
        try {
            const data = await safeFetchJson(`/api/folios/company/${companyId}`);
            setBookings(Array.isArray(data.bookings) ? data.bookings : []);
            const foliosData = [
                {
                    id: "companyFolio",
                    charges: Array.isArray(data.charges) ? data.charges : [],
                    payments: Array.isArray(data.payments) ? data.payments : [],
                    booking: null,
                }
            ];
            setFolios(foliosData);
        } catch (err) { setError(err.message || "Failed to fetch company data"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCompanyData(); }, [companyId, session]);

    useEffect(() => {
        if (!socket) return;
        const onBookingEvent = (payload) => {
            const bookingIds = bookings.map(b => b.id);
            const event = payload?.event;
            const data = payload?.data || {};
            const payloadBookingId = data?.bookingId || data?.id || payload?.bookingId || payload?.id;
            const payloadCompanyId = data?.companyId || payload?.companyId;
            if (
                (event === "BOOKING_DELETED" && payloadBookingId) ||
                (payloadBookingId && bookingIds.includes(payloadBookingId)) ||
                (payloadCompanyId === companyId)
            ) { fetchCompanyData(); }
        };
        const events = [
            "BOOKING_UPDATED", "BOOKING_CREATED", "BOOKING_DELETED",
            "FOLIO_CREATED", "CHARGE_ADDED", "CHARGE_DELETED",
            "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"
        ];
        events.forEach(event => socket.on(event, onBookingEvent));
        return () => events.forEach(event => socket.off(event, onBookingEvent));
    }, [socket, bookings, companyId]);

    if (!session) return <p>Loading session...</p>;
    if (loading) return <p className="p-4">جاري تحميل بيانات الشركة...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;

    const allCharges = folios.flatMap(f => (f.charges ?? []).map(c => ({
        ...c,
        folioId: f.id,
        guestName: c.booking?.guest ? `${c.booking.guest.firstName} ${c.booking.guest.lastName}` : "-"
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

    const handleAddCharge = async () => { if (!canAddCharge) return alert("ليس لديك صلاحية"); try { await safeFetchJson(`/api/folios/company/${companyId}/charges`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newCharge, amount: Number(newCharge.amount), tax: Number(newCharge.tax || 0), postedById: session.user.id }) }); setNewCharge({ code: "", description: "", amount: "", tax: "", guestId: "" }); fetchCompanyData(); } catch (err) { alert(err.message); } };
    const handleDeleteCharge = async (chargeId) => { if (!canDeleteCharge) return alert("ليس لديك صلاحية"); try { await safeFetchJson(`/api/folios/company/${companyId}/charges`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chargeId }) }); fetchCompanyData(); } catch (err) { alert(err.message); } };
    const handleAddPayment = async () => { if (!canAddPayment) return alert("ليس لديك صلاحية"); try { await safeFetchJson(`/api/folios/company/${companyId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newPayment, amount: Number(newPayment.amount), postedById: session.user.id }) }); setNewPayment({ method: "", amount: "", ref: "", guestId: "" }); fetchCompanyData(); } catch (err) { alert(err.message); } };
    const handleDeletePayment = async (paymentId) => { if (!canDeletePayment) return alert("ليس لديك صلاحية"); try { await safeFetchJson(`/api/folios/company/${companyId}/payments`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId }) }); fetchCompanyData(); } catch (err) { alert(err.message); } };
    const toggleFolioStatus = async () => { if (!canCloseFolio) return alert("ليس لديك صلاحية"); try { await safeFetchJson(`/api/folios/company/${companyId}/close`, { method: "POST" }); fetchCompanyData(); } catch (err) { console.error(err); } };

    return (
        <div className="p-6 space-y-6">

            <h1 className="text-2xl font-bold mb-4">فاتورة الشركة</h1>

                        {/* Folio Summary */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Folio Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">
                        Subtotal: <span className="font-bold">{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">
                        Tax: <span className="text-orange-500 font-bold">{taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">
                        Charges: <span className="text-red-500 font-bold">{totalCharges.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">
                        Payments: <span className="text-green-500 font-bold">{totalPayments.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">
                        Balance: <span className="text-blue-500 font-bold">{balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Rooming List */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <FaBed className="text-blue-500" /> Rooming List
                    </h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        {bookings.length} Guests
                    </span>
                </div>
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left">👤 Guest</th>
                                <th className="px-4 py-3 text-left">🛏 Room</th>
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
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.status}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "-"}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Charges Table */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <FaReceipt className="text-orange-500" /> Charges
                    </h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300">{allCharges.length} Items</span>
                </div>
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left">👤 Guest</th>
                                <th className="px-4 py-3 text-left"># Code</th>
                                <th className="px-4 py-3 text-left">📝 Description</th>
                                <th className="px-4 py-3 text-left">💰 Amount</th>
                                <th className="px-4 py-3 text-left">📊 Tax %</th>
                                <th className="px-4 py-3 text-left">💵 Tax Value</th>
                                <th className="px-4 py-3 text-center">⚙️ Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allCharges.map((c, i) => {
                                const taxValue = (Number(c.amount || 0) * Number(c.tax || 0)) / 100;
                                return (
                                    <tr key={`${c.id}-${c.folioId}`} className={`${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800"} hover:bg-orange-50 dark:hover:bg-gray-700 transition`}>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{c.guestName}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.code}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.description}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{Number(c.amount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.tax}%</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{taxValue.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {canDeleteCharge && (
                                                <button onClick={() => handleDeleteCharge(c.id)} className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-300 transition flex items-center gap-1 mx-auto">
                                                    🗑 <span className="hidden sm:inline">حذف</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {allCharges.length === 0 && <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">لا توجد رسوم مضافة بعد</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments Table with Form */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 space-y-4">

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

            </div>
        </div>
    )
}


