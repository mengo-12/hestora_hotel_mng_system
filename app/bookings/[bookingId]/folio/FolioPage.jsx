// "use client";
// import { useEffect, useState, useCallback } from "react";
// import { getSession } from "next-auth/react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function FolioPage({ bookingId, userProperties, session }){
//     // const bookingId = params.bookingId;
//     const sessionUser = session?.user || null;

//     const [folio, setFolio] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "" });
//     const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "" });
//     const socket = useSocket();

//     const role = sessionUser?.role || "FrontDesk";

//     const canAddCharge = ["Admin", "Manager", "FrontDesk"].includes(role);
//     const canDeleteCharge = ["Admin", "Manager"].includes(role);
//     const canAddPayment = ["Admin", "Manager", "FrontDesk"].includes(role);
//     const canDeletePayment = ["Admin", "Manager"].includes(role);
//     const canCloseFolio = ["Admin", "Manager"].includes(role);

//     const fetchFolio = useCallback(async () => {
//         try {
//             const res = await fetch(`/api/folios/${bookingId}`);
//             if (!res.ok) throw new Error("Failed to fetch folio");
//             const data = await res.json();
//             setFolio(data);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }, [bookingId]);

//     useEffect(() => {
//         if (bookingId) fetchFolio();
//     }, [bookingId, fetchFolio]);

//     // ======= Socket listeners =======
//     useEffect(() => {
//         if (!socket || !bookingId) return;

//         const onFolioUpdated = () => fetchFolio();
//         socket.on("BOOKING_UPDATED", onFolioUpdated);
//         socket.on("CHARGE_ADDED", onFolioUpdated);
//         socket.on("CHARGE_DELETED", onFolioUpdated);
//         socket.on("PAYMENT_ADDED", onFolioUpdated);
//         socket.on("PAYMENT_DELETED", onFolioUpdated);
//         socket.on("FOLIO_CLOSED", onFolioUpdated);

//         return () => {
//             socket.off("BOOKING_UPDATED", onFolioUpdated);
//             socket.off("CHARGE_ADDED", onFolioUpdated);
//             socket.off("CHARGE_DELETED", onFolioUpdated);
//             socket.off("PAYMENT_ADDED", onFolioUpdated);
//             socket.off("PAYMENT_DELETED", onFolioUpdated);
//             socket.off("FOLIO_CLOSED", onFolioUpdated);
//         };
//     }, [socket, bookingId]);

//     if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
//     if (!folio) return <p className="text-center mt-4">الفاتورة غير موجودة</p>;

//     const totalCharges = folio.charges.reduce((sum, c) => sum + Number(c.amount || 0) + Number(c.tax || 0), 0);
//     const totalPayments = folio.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
//     const balance = totalCharges - totalPayments;

//     // ======= Mutations with permission check =======
//     const handleAddCharge = async () => {
//         if (!canAddCharge) return alert("ليس لديك صلاحية لإضافة Charges");
//         try {
//             await fetch(`/api/folios/${bookingId}/charges`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     ...newCharge,
//                     amount: Number(newCharge.amount),
//                     tax: Number(newCharge.tax || 0),
//                     postedById: sessionUser.id,
//                 }),
//             });
//             setNewCharge({ code: "", description: "", amount: "", tax: "" });
//             fetchFolio();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const handleDeleteCharge = async (chargeId) => {
//         if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
//         try {
//             await fetch(`/api/folios/${bookingId}/charges`, {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ chargeId }),
//             });
//             fetchFolio();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const handleAddPayment = async () => {
//         if (!canAddPayment) return alert("ليس لديك صلاحية لإضافة Payments");
//         try {
//             await fetch(`/api/folios/${bookingId}/payments`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     ...newPayment,
//                     amount: Number(newPayment.amount),
//                     postedById: sessionUser.id,
//                 }),
//             });
//             setNewPayment({ method: "", amount: "", ref: "" });
//             fetchFolio();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const handleDeletePayment = async (paymentId) => {
//         if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
//         try {
//             await fetch(`/api/folios/${bookingId}/payments`, {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ paymentId }),
//             });
//             fetchFolio();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const toggleFolioStatus = async () => {
//         if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
//         try {
//             await fetch(`/api/folios/${bookingId}/close`, { method: "POST" });
//             fetchFolio();
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     return (
//         <div className="p-6 max-w-5xl mx-auto">
//             <div className=" rounded shadow p-4 mb-6">
//                 <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
//                 <p>Status: <span className="font-semibold">{folio.status}</span></p>
//                 <p>Total Charges: <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
//                 <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
//                 <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
//                 <div className="flex gap-3 mt-4 flex-wrap">
//                     <button
//                         onClick={toggleFolioStatus}
//                         className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
//                         disabled={!canCloseFolio}
//                     >
//                         {folio.status === "Open" ? "Close Folio" : "Reopen Folio"}
//                     </button>
//                     <button
//                         onClick={() => window.open(`/invoice/${folio.id}`, "_blank")}
//                         className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//                     >
//                         Print Folio
//                     </button>
//                 </div>
//             </div>

//             {/* Charges */}
//             <div className=" rounded shadow p-4 mb-6">
//                 <h3 className="text-xl font-semibold mb-3">Charges</h3>
//                 <table className="w-full border text-sm">
//                     <thead className="">
//                         <tr>
//                             <th className="border p-2">Code</th>
//                             <th className="border p-2">Description</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Tax</th>
//                             <th className="border p-2">Posted At</th>
//                             <th className="border p-2">By</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {folio.charges.map((c) => (
//                             <tr key={c.id}>
//                                 <td className="border p-2">{c.code}</td>
//                                 <td className="border p-2">{c.description}</td>
//                                 <td className="border p-2">{c.amount}</td>
//                                 <td className="border p-2">{c.tax}</td>
//                                 <td className="border p-2">{new Date(c.postedAt).toLocaleString()}</td>
//                                 <td className="border p-2">{c.postedBy?.name || "System"}</td>
//                                 <td className="border p-2 text-center">
//                                     {canDeleteCharge && (
//                                         <button
//                                             onClick={() => handleDeleteCharge(c.id)}
//                                             className="text-red-500 hover:text-red-700"
//                                         >
//                                             حذف
//                                         </button>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 {canAddCharge && (
//                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
//                         <input placeholder="Code" className="border p-2 rounded flex-1" value={newCharge.code} onChange={(e) => setNewCharge({ ...newCharge, code: e.target.value })}/>
//                         <input placeholder="Description" className="border p-2 rounded flex-1" value={newCharge.description} onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}/>
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}/>
//                         <input placeholder="Tax" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={(e) => setNewCharge({ ...newCharge, tax: e.target.value })}/>
//                         <button onClick={handleAddCharge} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
//                     </div>
//                 )}
//             </div>

//             {/* Payments */}
//             <div className=" rounded shadow p-4">
//                 <h3 className="text-xl font-semibold mb-3">Payments</h3>
//                 <table className="w-full border text-sm">
//                     <thead className="">
//                         <tr>
//                             <th className="border p-2">Method</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Reference</th>
//                             <th className="border p-2">Posted At</th>
//                             <th className="border p-2">By</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {folio.payments.map((p) => (
//                             <tr key={p.id}>
//                                 <td className="border p-2">{p.method}</td>
//                                 <td className="border p-2">{p.amount}</td>
//                                 <td className="border p-2">{p.ref || "-"}</td>
//                                 <td className="border p-2">{new Date(p.postedAt).toLocaleString()}</td>
//                                 <td className="border p-2">{p.postedBy?.name || "System"}</td>
//                                 <td className="border p-2 text-center">
//                                     {canDeletePayment && (
//                                         <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">
//                                             حذف
//                                         </button>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 {canAddPayment && (
//                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
//                         <input placeholder="Method" className="border p-2 rounded flex-1" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}/>
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}/>
//                         <input placeholder="Reference (اختياري)" className="border p-2 rounded flex-1" value={newPayment.ref} onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })}/>
//                         <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }



// كود الاعلى نسخة اصلية




"use client";
import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function FolioPage({ bookingId, userProperties, session }) {
    const sessionUser = session?.user || null;

    const [folio, setFolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "" });
    const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "" });
    const socket = useSocket();

    const role = sessionUser?.role || "FrontDesk";
    const canAddCharge = ["Admin", "Manager", "FrontDesk"].includes(role);
    const canDeleteCharge = ["Admin", "Manager"].includes(role);
    const canAddPayment = ["Admin", "Manager", "FrontDesk"].includes(role);
    const canDeletePayment = ["Admin", "Manager"].includes(role);
    const canCloseFolio = ["Admin", "Manager"].includes(role);

    const fetchFolio = useCallback(async () => {
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
    }, [bookingId]);

    useEffect(() => {
        if (bookingId) fetchFolio();
    }, [bookingId, fetchFolio]);

    // ======= Socket listeners =======
    useEffect(() => {
        if (!socket || !bookingId) return;

        const onFolioUpdated = () => fetchFolio();
        socket.on("BOOKING_UPDATED", onFolioUpdated);
        socket.on("CHARGE_ADDED", onFolioUpdated);
        socket.on("CHARGE_DELETED", onFolioUpdated);
        socket.on("PAYMENT_ADDED", onFolioUpdated);
        socket.on("PAYMENT_DELETED", onFolioUpdated);
        socket.on("FOLIO_CLOSED", onFolioUpdated);

        return () => {
            socket.off("BOOKING_UPDATED", onFolioUpdated);
            socket.off("CHARGE_ADDED", onFolioUpdated);
            socket.off("CHARGE_DELETED", onFolioUpdated);
            socket.off("PAYMENT_ADDED", onFolioUpdated);
            socket.off("PAYMENT_DELETED", onFolioUpdated);
            socket.off("FOLIO_CLOSED", onFolioUpdated);
        };
    }, [socket, bookingId]);

    if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
    if (!folio) return <p className="text-center mt-4">الفاتورة غير موجودة</p>;

    const totalCharges = folio.charges.reduce((sum, c) => sum + Number(c.amount || 0) + Number(c.tax || 0), 0);
    const totalPayments = folio.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = totalCharges - totalPayments;

    // ======= Mutations =======
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
                    postedById: sessionUser.id,
                }),
            });
            setNewCharge({ code: "", description: "", amount: "", tax: "" });
            fetchFolio();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleDeleteCharge = async (chargeId) => {
        if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
        try {
            await fetch(`/api/folios/${bookingId}/charges`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId }),
            });
            fetchFolio();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
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
                    postedById: sessionUser.id,
                }),
            });
            setNewPayment({ method: "", amount: "", ref: "" });
            fetchFolio();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
        try {
            await fetch(`/api/folios/${bookingId}/payments`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
            });
            fetchFolio();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const toggleFolioStatus = async () => {
        if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
        try {
            await fetch(`/api/folios/${bookingId}/close`, { method: "POST" });
            fetchFolio();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Booking Info */}
            {folio.booking && (
                <div className="rounded shadow p-4 mb-6 bg-gray-50">
                    <h2 className="text-2xl font-bold mb-3">Booking Details</h2>
                    <p><strong>Guest:</strong> {folio.booking.guest?.name}</p>
                    <p><strong>Room:</strong> {folio.booking.room?.number || "N/A"} ({folio.booking.room?.roomType?.name})</p>
                    <p><strong>Rate Plan:</strong> {folio.booking.ratePlan?.name || "N/A"}</p>
                    <p><strong>Check-In:</strong> {new Date(folio.booking.checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-Out:</strong> {new Date(folio.booking.checkOut).toLocaleDateString()}</p>
                </div>
            )}

            {/* Folio Summary */}
            <div className="rounded shadow p-4 mb-6">
                <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
                <p>Status: <span className="font-semibold">{folio.status}</span></p>
                <p>Total Charges: <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
                <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
                <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
                <div className="flex gap-3 mt-4 flex-wrap">
                    <button
                        onClick={toggleFolioStatus}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                        disabled={!canCloseFolio}
                    >
                        {folio.status === "Open" ? "Close Folio" : "Reopen Folio"}
                    </button>
                    <button
                        onClick={() => window.open(`/invoice/${folio.id}`, "_blank")}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                        Print Folio
                    </button>
                </div>
            </div>

            {/* Charges */}
            <div className="rounded shadow p-4 mb-6">
                <h3 className="text-xl font-semibold mb-3">Charges</h3>
                <table className="w-full border text-sm">
                    <thead>
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
                        {folio.charges.map((c) => (
                            <tr key={c.id}>
                                <td className="border p-2">{c.code}</td>
                                <td className="border p-2">{c.description}</td>
                                <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
                                <td className="border p-2">{Number(c.tax).toFixed(2)}</td>
                                <td className="border p-2">{new Date(c.postedAt).toLocaleString()}</td>
                                <td className="border p-2">{c.postedBy?.name || "System"}</td>
                                <td className="border p-2 text-center">
                                    {canDeleteCharge && (
                                        <button
                                            onClick={() => handleDeleteCharge(c.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            حذف
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {canAddCharge && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input placeholder="Code" className="border p-2 rounded flex-1" value={newCharge.code} onChange={(e) => setNewCharge({ ...newCharge, code: e.target.value })} />
                        <input placeholder="Description" className="border p-2 rounded flex-1" value={newCharge.description} onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })} />
                        <input placeholder="Tax" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={(e) => setNewCharge({ ...newCharge, tax: e.target.value })} />
                        <button onClick={handleAddCharge} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
                    </div>
                )}
            </div>

            {/* Payments */}
            <div className="rounded shadow p-4">
                <h3 className="text-xl font-semibold mb-3">Payments</h3>
                <table className="w-full border text-sm">
                    <thead>
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
                        {folio.payments.map((p) => (
                            <tr key={p.id}>
                                <td className="border p-2">{p.method}</td>
                                <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
                                <td className="border p-2">{p.ref || "-"}</td>
                                <td className="border p-2">{new Date(p.postedAt).toLocaleString()}</td>
                                <td className="border p-2">{p.postedBy?.name || "System"}</td>
                                <td className="border p-2 text-center">
                                    {canDeletePayment && (
                                        <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">
                                            حذف
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {canAddPayment && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input placeholder="Method" className="border p-2 rounded flex-1" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} />
                        <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
                        <input placeholder="Reference (اختياري)" className="border p-2 rounded flex-1" value={newPayment.ref} onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })} />
                        <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
                    </div>
                )}
            </div>
        </div>
    );
}


