
"use client";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useSocket } from "@/app/components/SocketProvider";

export default function FolioPage({ params }) {
    const bookingId = params.bookingId;

    const [sessionUser, setSessionUser] = useState(null);
    const [folio, setFolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "" });
    const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "" });
    const socket = useSocket();

    const fetchSessionUser = async () => {
        const session = await getSession();
        if (session?.user) setSessionUser(session.user);
    };

    const fetchFolio = async () => {
        try {
            const res = await fetch(`/api/folios/${bookingId}`);
            if (!res.ok) throw new Error("Failed to fetch folio");
            const data = await res.json();
            setFolio(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessionUser();
        if (bookingId) fetchFolio();
    }, [bookingId]);

    // الاستماع لأحداث الـ socket مع منع التكرار
    useEffect(() => {
        if (!socket || !folio?.id) return;

        const onChargeAdded = ({ folioId, charge }) => {
            if (folioId !== folio.id) return;
            setFolio(prev => {
                if (!prev) return prev;
                if (prev.charges.some(c => c.id === charge.id)) return prev;
                return { ...prev, charges: [...prev.charges, charge] };
            });
        };

        const onChargeDeleted = ({ folioId, chargeId }) => {
            if (folioId !== folio.id) return;
            setFolio(prev => ({
                ...prev,
                charges: prev.charges.filter(c => c.id !== chargeId)
            }));
        };

        const onPaymentAdded = ({ folioId, payment }) => {
            if (folioId !== folio.id) return;
            setFolio(prev => {
                if (prev.payments.some(p => p.id === payment.id)) return prev;
                return { ...prev, payments: [...prev.payments, payment] };
            });
        };

        const onPaymentDeleted = ({ folioId, paymentId }) => {
            if (folioId !== folio.id) return;
            setFolio(prev => ({
                ...prev,
                payments: prev.payments.filter(p => p.id !== paymentId)
            }));
        };

        const onFolioClosed = ({ folioId }) => {
            if (folioId !== folio.id) return;
            setFolio(prev => ({ ...prev, status: "Closed" }));
        };

        socket.on("CHARGE_ADDED", onChargeAdded);
        socket.on("CHARGE_DELETED", onChargeDeleted);
        socket.on("PAYMENT_ADDED", onPaymentAdded);
        socket.on("PAYMENT_DELETED", onPaymentDeleted);
        socket.on("FOLIO_CLOSED", onFolioClosed);

        return () => {
            socket.off("CHARGE_ADDED", onChargeAdded);
            socket.off("CHARGE_DELETED", onChargeDeleted);
            socket.off("PAYMENT_ADDED", onPaymentAdded);
            socket.off("PAYMENT_DELETED", onPaymentDeleted);
            socket.off("FOLIO_CLOSED", onFolioClosed);
        };
    }, [socket, folio?.id]);

    if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
    if (!folio) return <p className="text-center mt-4">الفاتورة غير موجودة</p>;

    const userId = sessionUser?.id;
    const totalCharges = folio?.charges.reduce((sum, c) => sum + Number(c.amount) + Number(c.tax || 0), 0) || 0;
    const totalPayments = folio?.payments.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const balance = totalCharges - totalPayments;

    const handleAddCharge = async () => {
        if (!userId) return alert("يجب تسجيل الدخول لإضافة Charge");
        try {
            const res = await fetch(`/api/folios/${bookingId}/charges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newCharge,
                    amount: Number(newCharge.amount),
                    tax: Number(newCharge.tax || 0),
                    postedById: userId  // إضافة هذا السطر
                    
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            setNewCharge({ code: "", description: "", amount: "", tax: "" });
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleDeleteCharge = async (chargeId) => {
        try {
            const res = await fetch(`/api/folios/${bookingId}/charges`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId }),
            });
            if (!res.ok) throw new Error(await res.text());
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleAddPayment = async () => {
        if (!userId) return alert("يجب تسجيل الدخول لإضافة Payment");
        try {
            const res = await fetch(`/api/folios/${bookingId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newPayment, amount: Number(newPayment.amount), postedById: userId }),
            });
            if (!res.ok) throw new Error(await res.text());
            setNewPayment({ method: "", amount: "", ref: "" });
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        try {
            const res = await fetch(`/api/folios/${bookingId}/payments`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) throw new Error(await res.text());
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const toggleFolioStatus = async () => {
        try {
            const res = await fetch(`/api/folios/${bookingId}/close`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to close folio");
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className={`${darkMode ? "dark" : ""}`}>
            <div className="p-6 space-y-6 max-w-5xl mx-auto dark:bg-gray-900 dark:text-gray-200 min-h-screen">
                {/* ملخص الفاتورة */}
                <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                    <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
                    <p>Status: <span className="font-semibold">{folio.status}</span></p>
                    <p>Total Charges: <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
                    <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
                    <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
                    <div className="flex gap-3 mt-4 flex-wrap">
                        <button onClick={toggleFolioStatus} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                            {folio.status === "Open" ? "Close Folio" : "Reopen Folio"}
                        </button>
                        <button onClick={handlePrint} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            Print Folio
                        </button>
                    </div>
                </div>

                {/* Charges */}
                <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                    <h3 className="text-xl font-semibold mb-3">Charges</h3>
                    <table className="w-full border text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="border p-2">Code</th>
                                <th className="border p-2">Description</th>
                                <th className="border p-2">Amount</th>
                                <th className="border p-2">Tax</th>
                                <th className="border p-2">Posted At</th>
                                <th className="border p-2">By</th>
                                <th className="border p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folio.charges.map(c => (
                                <tr key={c.id} className="even:bg-gray-50 dark:even:bg-gray-700">
                                    <td className="border p-2">{c.code}</td>
                                    <td className="border p-2">{c.description}</td>
                                    <td className="border p-2">{c.amount}</td>
                                    <td className="border p-2">{c.tax}</td>
                                    <td className="border p-2">{new Date(c.postedAt).toLocaleString()}</td>
                                    <td className="border p-2">{c.postedBy?.name || "System"}</td>
                                    <td className="border p-2 text-center">
                                        <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input placeholder="Code" className="border p-2 rounded flex-1 dark:bg-gray-700 dark:text-white" value={newCharge.code} onChange={e => setNewCharge({ ...newCharge, code: e.target.value })} />
                        <input placeholder="Description" className="border p-2 rounded flex-1 dark:bg-gray-700 dark:text-white" value={newCharge.description} onChange={e => setNewCharge({ ...newCharge, description: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24 dark:bg-gray-700 dark:text-white" value={newCharge.amount} onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })} />
                        <input placeholder="Tax" type="number" className="border p-2 rounded w-24 dark:bg-gray-700 dark:text-white" value={newCharge.tax} onChange={e => setNewCharge({ ...newCharge, tax: e.target.value })} />
                        <button onClick={handleAddCharge} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
                    </div>
                </div>

                {/* Payments */}
                <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                    <h3 className="text-xl font-semibold mb-3">Payments</h3>
                    <table className="w-full border text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="border p-2">Method</th>
                                <th className="border p-2">Amount</th>
                                <th className="border p-2">Reference</th>
                                <th className="border p-2">Posted At</th>
                                <th className="border p-2">By</th>
                                <th className="border p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folio.payments.map(p => (
                                <tr key={p.id} className="even:bg-gray-50 dark:even:bg-gray-700">
                                    <td className="border p-2">{p.method}</td>
                                    <td className="border p-2">{p.amount}</td>
                                    <td className="border p-2">{p.ref || "-"}</td>
                                    <td className="border p-2">{new Date(p.postedAt).toLocaleString()}</td>
                                    <td className="border p-2">{p.postedBy?.name || "System"}</td>
                                    <td className="border p-2 text-center">
                                        <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input placeholder="Method" className="border p-2 rounded flex-1 dark:bg-gray-700 dark:text-white" value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24 dark:bg-gray-700 dark:text-white" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
                        <input placeholder="Reference (اختياري)" className="border p-2 rounded flex-1 dark:bg-gray-700 dark:text-white" value={newPayment.ref} onChange={e => setNewPayment({ ...newPayment, ref: e.target.value })} />
                        <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
                    </div>
                </div>
            </div>
        </div>
    );
}










