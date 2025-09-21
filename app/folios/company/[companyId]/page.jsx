'use client';
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useSocket } from "@/app/components/SocketProvider";

export default function CompanyFolioPage({ params }) {
    const companyId = params?.companyId;
    const socket = useSocket(); // 🟢 إضافة

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
            .catch(err => {
                console.error("getSession error:", err);
                setSession(null);
            });
    }, []);

    // دالة fetch مع فحص JSON
    const safeFetchJson = async (url, options = {}) => {
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            if (!res.ok) throw new Error(`HTTP error ${res.status}: ${text}`);
            try {
                return JSON.parse(text);
            } catch (err) {
                throw new Error(`Invalid JSON response: ${text}`);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            throw err;
        }
    };

    // جلب الحجوزات والفواتير
    const fetchCompanyData = async () => {
        if (!companyId || !session) return;
        setLoading(true);
        setError(null);
        try {
            const data = await safeFetchJson(`/api/folios/company/${companyId}`);

            // API يعيد { charges, payments, bookings }
            setBookings(Array.isArray(data.bookings) ? data.bookings : []);

            // نحتاج هنا لتكوين folios وهمية لكل Guest إذا لم تكن موجودة
            const foliosData = [
                {
                    id: "companyFolio",
                    charges: Array.isArray(data.charges) ? data.charges : [],
                    payments: Array.isArray(data.payments) ? data.payments : [],
                    booking: null, // لا يوجد booking محدد هنا
                }
            ];
            setFolios(foliosData);
        } catch (err) {
            setError(err.message || "Failed to fetch company data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanyData(); }, [companyId, session]);

    // 🟢 البثوص الذكية
    useEffect(() => {
        if (!socket) return;

        const onFolioUpdated = () => fetchCompanyData();

        ["BOOKING_UPDATED", "CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"]
            .forEach(event => socket.on(event, onFolioUpdated));

        return () => {
            ["BOOKING_UPDATED", "CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"]
                .forEach(event => socket.off(event, onFolioUpdated));
        };
    }, [socket]);


    if (!session) return <p>Loading session...</p>;
    if (loading) return <p className="p-4">جاري تحميل بيانات الشركة...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;

    // دمج Charges و Payments لكل الفواتير
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

    // CRUD functions
    const handleAddCharge = async () => {
        if (!canAddCharge) return alert("ليس لديك صلاحية لإضافة Charges");
        try {
            await safeFetchJson(`/api/folios/company/${companyId}/charges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newCharge,
                    amount: Number(newCharge.amount),
                    tax: Number(newCharge.tax || 0),
                    postedById: session.user.id
                })
            });
            setNewCharge({ code: "", description: "", amount: "", tax: "", guestId: "" });
            fetchCompanyData();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteCharge = async (chargeId) => {
        if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
        try {
            await safeFetchJson(`/api/folios/company/${companyId}/charges`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId }),
            });
            fetchCompanyData();
        } catch (err) { alert(err.message); }
    };

    const handleAddPayment = async () => {
        if (!canAddPayment) return alert("ليس لديك صلاحية لإضافة Payments");
        try {
            await safeFetchJson(`/api/folios/company/${companyId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newPayment,
                    amount: Number(newPayment.amount),
                    postedById: session.user.id
                }),
            });
            setNewPayment({ method: "", amount: "", ref: "", guestId: "" });
            fetchCompanyData();
        } catch (err) { alert(err.message); }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
        try {
            await safeFetchJson(`/api/folios/company/${companyId}/payments`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
            });
            fetchCompanyData();
        } catch (err) { alert(err.message); }
    };

    const toggleFolioStatus = async () => {
        if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
        try {
            await safeFetchJson(`/api/folios/company/${companyId}/close`, { method: "POST" });
            fetchCompanyData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">فاتورة الشركة</h1>

            {/* Rooming List */}
            <div className="rounded shadow p-4">
                <h2 className="text-xl font-bold mb-3">Rooming List</h2>
                <table className="w-full border text-sm">
                    <thead>
                        <tr>
                            <th className="border p-2">Guest</th>
                            <th className="border p-2">Room</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Check-in</th>
                            <th className="border p-2">Check-out</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.id}>
                                <td className="border p-2">{b.guest?.firstName} {b.guest?.lastName}</td>
                                <td className="border p-2">{b.room?.number || "-"}</td>
                                <td className="border p-2">{b.status}</td>
                                <td className="border p-2">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "-"}</td>
                                <td className="border p-2">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Folio Summary */}
            <div className="rounded shadow p-4 mb-6">
                <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
                <p>Subtotal: <span className="font-bold">{subtotal.toFixed(2)}</span></p>
                <p>Tax Total: <span className="text-orange-600 font-bold">{taxTotal.toFixed(2)}</span></p>
                <p>Total Charges: <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
                <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
                <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
                {canCloseFolio && (
                    <button onClick={toggleFolioStatus} className="bg-yellow-500 text-white px-4 py-2 rounded mt-3 hover:bg-yellow-600">
                        Toggle Folio Status
                    </button>
                )}
            </div>

            {/* Charges Table */}
            <div className="rounded shadow p-4 mb-6">
                <h3 className="text-xl font-semibold mb-3">Charges</h3>
                <table className="w-full border text-sm">
                    <thead>
                        <tr>
                            <th className="border p-2">Guest</th>
                            <th className="border p-2">Code</th>
                            <th className="border p-2">Description</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Tax %</th>
                            <th className="border p-2">Tax Value</th>
                            <th className="border p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCharges.map(c => {
                            const taxValue = (Number(c.amount || 0) * Number(c.tax || 0)) / 100;
                            return (
                                <tr key={`${c.id}-${c.folioId}`}>
                                    <td className="border p-2">{c.guestName}</td>
                                    <td className="border p-2">{c.code}</td>
                                    <td className="border p-2">{c.description}</td>
                                    <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
                                    <td className="border p-2">{c.tax}%</td>
                                    <td className="border p-2">{taxValue.toFixed(2)}</td>
                                    <td className="border p-2 text-center">
                                        {canDeleteCharge && (
                                            <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">حذف</button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {canAddCharge && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <select value={newCharge.guestId} onChange={(e) => setNewCharge({ ...newCharge, guestId: e.target.value })} className="border p-2 rounded">
                            <option value="">اختر الضيف</option>
                            {bookings.map(b => <option key={b.id} value={b.guest?.id}>{b.guest?.firstName} {b.guest?.lastName}</option>)}
                        </select>
                        <input placeholder="Code" className="border p-2 rounded flex-1" value={newCharge.code} onChange={(e) => setNewCharge({ ...newCharge, code: e.target.value })} />
                        <input placeholder="Description" className="border p-2 rounded flex-1" value={newCharge.description} onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })} />
                        <input placeholder="Tax %" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={(e) => setNewCharge({ ...newCharge, tax: e.target.value })} />
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
                            <th className="border p-2">Guest</th>
                            <th className="border p-2">Method</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Reference</th>
                            <th className="border p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allPayments.map(p => (
                            <tr key={`${p.id}-${p.folioId}`}>
                                <td className="border p-2">{p.guestName}</td>
                                <td className="border p-2">{p.method}</td>
                                <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
                                <td className="border p-2">{p.ref || "-"}</td>
                                <td className="border p-2 text-center">
                                    {canDeletePayment && (
                                        <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">حذف</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {canAddPayment && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <select value={newPayment.guestId} onChange={(e) => setNewPayment({ ...newPayment, guestId: e.target.value })} className="border p-2 rounded">
                            <option value="">اختر الضيف</option>
                            {bookings.map(b => <option key={b.id} value={b.guest?.id}>{b.guest?.firstName} {b.guest?.lastName}</option>)}
                        </select>
                        <input placeholder="Method" className="border p-2 rounded flex-1" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
                        <input placeholder="Reference" className="border p-2 rounded flex-1" value={newPayment.ref} onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })} />
                        <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
                    </div>
                )}
            </div>
        </div>
    )
}




