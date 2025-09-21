// // 'use client';
// // import { useEffect, useState, useCallback } from "react";
// // import { useSocket } from "@/app/components/SocketProvider";

// // export default function FolioPage({ bookingId, session }) {

// //     const sessionUser = session?.user || null;
// //     const socket = useSocket();

// //     const [folios, setFolios] = useState([]);
// //     const [loading, setLoading] = useState(true);
// //     const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "" });
// //     const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "" });

// //     const role = sessionUser?.role || "FrontDesk";
// //     const canAddCharge = ["Admin", "Manager", "FrontDesk"].includes(role);
// //     const canDeleteCharge = ["Admin", "Manager"].includes(role);
// //     const canAddPayment = ["Admin", "Manager", "FrontDesk"].includes(role);
// //     const canDeletePayment = ["Admin", "Manager"].includes(role);
// //     const canCloseFolio = ["Admin", "Manager"].includes(role);

// //     // Fetch folios
// //     const fetchFolios = useCallback(async () => {
// //         if (!bookingId) return;
// //         try {
// //             const res = await fetch(`/api/folios/${bookingId}`);
// //             if (!res.ok) throw new Error("Failed to fetch folio");
// //             const data = await res.json();
// //             setFolios(data);
// //         } catch (err) {
// //             console.error(err);
// //         } finally {
// //             setLoading(false);
// //         }
// //     }, [bookingId]);

// //     useEffect(() => {
// //         fetchFolios();
// //     }, [fetchFolios]);

// //     // Socket listeners
// //     useEffect(() => {
// //         if (!socket || !bookingId) return;
// //         const onFolioUpdated = () => fetchFolios();
// //         ["BOOKING_UPDATED","CHARGE_ADDED","CHARGE_DELETED","PAYMENT_ADDED","PAYMENT_DELETED","FOLIO_CLOSED"].forEach(event => {
// //             socket.on(event, onFolioUpdated);
// //         });
// //         return () => {
// //             ["BOOKING_UPDATED","CHARGE_ADDED","CHARGE_DELETED","PAYMENT_ADDED","PAYMENT_DELETED","FOLIO_CLOSED"].forEach(event => {
// //                 socket.off(event, onFolioUpdated);
// //             });
// //         };
// //     }, [socket, bookingId]);

// //     if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
// //     if (!folios || folios.length === 0) return <p className="text-center mt-4">الفاتورة غير موجودة</p>;

// //     // دمج كل الـ charges و payments لجميع الفواتير ضمن الـ group
// //     const allCharges = folios.flatMap(f => f.charges.map(c => ({...c, folioId: f.id, guestName: f.guest?.name})));
// //     const allPayments = folios.flatMap(f => f.payments.map(p => ({...p, folioId: f.id, guestName: f.guest?.name})));

// //     // الحسابات
// //     const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
// //     const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
// //     const totalCharges = subtotal + taxTotal;
// //     const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
// //     const balance = totalCharges - totalPayments;

// //     // CRUD Functions
// //     const handleAddCharge = async () => {
// //         if (!canAddCharge) return alert("ليس لديك صلاحية لإضافة Charges");
// //         try {
// //             const amount = Number(newCharge.amount);
// //             const taxPercent = Number(newCharge.tax || 0);

// //             await fetch(`/api/folios/${bookingId}/charges`, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify({ ...newCharge, amount, tax: taxPercent, postedById: sessionUser.id }),
// //             });
// //             setNewCharge({ code: "", description: "", amount: "", tax: "" });
// //             fetchFolios();
// //         } catch (err) {
// //             console.error(err);
// //             alert(err.message);
// //         }
// //     };

// //     const handleDeleteCharge = async (chargeId) => {
// //         if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
// //         try {
// //             await fetch(`/api/folios/${bookingId}/charges`, {
// //                 method: "DELETE",
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify({ chargeId }),
// //             });
// //             fetchFolios();
// //         } catch (err) {
// //             console.error(err);
// //             alert(err.message);
// //         }
// //     };

// //     const handleAddPayment = async () => {
// //         if (!canAddPayment) return alert("ليس لديك صلاحية لإضافة Payments");
// //         try {
// //             await fetch(`/api/folios/${bookingId}/payments`, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify({ ...newPayment, amount: Number(newPayment.amount), postedById: sessionUser.id }),
// //             });
// //             setNewPayment({ method: "", amount: "", ref: "" });
// //             fetchFolios();
// //         } catch (err) {
// //             console.error(err);
// //             alert(err.message);
// //         }
// //     };

// //     const handleDeletePayment = async (paymentId) => {
// //         if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
// //         try {
// //             await fetch(`/api/folios/${bookingId}/payments`, {
// //                 method: "DELETE",
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify({ paymentId }),
// //             });
// //             fetchFolios();
// //         } catch (err) {
// //             console.error(err);
// //             alert(err.message);
// //         }
// //     };

// //     const toggleFolioStatus = async () => {
// //         if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
// //         try {
// //             await fetch(`/api/folios/${bookingId}/close`, { method: "POST" });
// //             fetchFolios();
// //         } catch (err) {
// //             console.error(err);
// //         }
// //     };

// //     const printFolio = () => {
// //         const printWindow = window.open("", "_blank");
// //         if (!printWindow) return alert("Unable to open print window.");

// //         printWindow.document.write(`<html><head><title>Folio</title></head><body>`);
// //         folios.forEach(f => {
// //             printWindow.document.write(`<h2>Folio ID: ${f.id} (${f.guest?.name || "N/A"})</h2>`);
// //             printWindow.document.write(`<p>Status: ${f.status}</p>`);
// //             printWindow.document.write(`<p>Room: ${f.booking?.room?.number || "-"}</p>`);
// //             printWindow.document.write(`<table border="1" cellpadding="4" cellspacing="0"><thead><tr><th>Code</th><th>Description</th><th>Amount</th><th>Tax %</th><th>Tax Value</th><th>Total</th></tr></thead><tbody>`);
// //             f.charges.forEach(c => {
// //                 const taxValue = (Number(c.amount || 0) * Number(c.tax || 0)) / 100;
// //                 const total = Number(c.amount || 0) + taxValue;
// //                 printWindow.document.write(`<tr><td>${c.code}</td><td>${c.description}</td><td>${Number(c.amount).toFixed(2)}</td><td>${c.tax}%</td><td>${taxValue.toFixed(2)}</td><td>${total.toFixed(2)}</td></tr>`);
// //             });
// //             printWindow.document.write(`</tbody></table><hr/>`);
// //         });
// //         printWindow.document.write(`</body></html>`);
// //         printWindow.document.close();
// //         printWindow.focus();
// //         printWindow.print();
// //     };

// //     return (
// //         <div className="p-6 max-w-5xl mx-auto">
// //             {/* Folio Summary */}
// //             <div className="rounded shadow p-4 mb-6">
// //                 <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
// //                 <p>Subtotal (قبل الضريبة): <span className="text-gray-800 font-bold">{subtotal.toFixed(2)}</span></p>
// //                 <p>Tax Total (الضريبة): <span className="text-orange-600 font-bold">{taxTotal.toFixed(2)}</span></p>
// //                 <p>Total Charges (الإجمالي مع الضريبة): <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
// //                 <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
// //                 <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
// //                 <div className="flex gap-3 mt-4 flex-wrap">
// //                     <button
// //                         onClick={toggleFolioStatus}
// //                         className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
// //                         disabled={!canCloseFolio}
// //                     >
// //                         {folios.some(f => f.status === "Open") ? "Close Folio" : "Reopen Folio"}
// //                     </button>
// //                     <button onClick={printFolio} className="bg-blue-500 text-white px-4 py-2 rounded">Print</button>
// //                 </div>
// //             </div>

// //             {/* Charges Table */}
// //             <div className="rounded shadow p-4 mb-6">
// //                 <h3 className="text-xl font-semibold mb-3">Charges</h3>
// //                 <table className="w-full border text-sm">
// //                     <thead>
// //                         <tr>
// //                             <th className="border p-2">Code</th>
// //                             <th className="border p-2">Description</th>
// //                             <th className="border p-2">Amount</th>
// //                             <th className="border p-2">Tax %</th>
// //                             <th className="border p-2">Tax Value</th>
// //                             <th className="border p-2">Posted At</th>
// //                             <th className="border p-2">By</th>
// //                             <th className="border p-2">Action</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //                         {allCharges.map(c => {
// //                             const taxValue = (Number(c.amount || 0) * Number(c.tax || 0)) / 100;
// //                             return (
// //                                 <tr key={`${c.id}-${c.folioId}`}>
// //                                     <td className="border p-2">{c.code}</td>
// //                                     <td className="border p-2">{c.description}</td>
// //                                     <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
// //                                     <td className="border p-2">{c.tax}%</td>
// //                                     <td className="border p-2">{taxValue.toFixed(2)}</td>
// //                                     <td className="border p-2">{new Date(c.postedAt).toLocaleString()}</td>
// //                                     <td className="border p-2">{c.postedBy?.name || "System"} {c.guestName ? `(${c.guestName})` : ""}</td>
// //                                     <td className="border p-2 text-center">
// //                                         {canDeleteCharge && (
// //                                             <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">
// //                                                 حذف
// //                                             </button>
// //                                         )}
// //                                     </td>
// //                                 </tr>
// //                             );
// //                         })}
// //                     </tbody>
// //                 </table>

// //                 {canAddCharge && (
// //                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
// //                         <input placeholder="Code" className="border p-2 rounded flex-1" value={newCharge.code} onChange={(e) => setNewCharge({ ...newCharge, code: e.target.value })} />
// //                         <input placeholder="Description" className="border p-2 rounded flex-1" value={newCharge.description} onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })} />
// //                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })} />
// //                         <input placeholder="Tax %" type="number" className="border p-2 rounded w-24" value={newCharge.tax} onChange={(e) => setNewCharge({ ...newCharge, tax: e.target.value })} />
// //                         <button onClick={handleAddCharge} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
// //                     </div>
// //                 )}
// //             </div>

// //             {/* Payments Table */}
// //             <div className="rounded shadow p-4">
// //                 <h3 className="text-xl font-semibold mb-3">Payments</h3>
// //                 <table className="w-full border text-sm">
// //                     <thead>
// //                         <tr>
// //                             <th className="border p-2">Method</th>
// //                             <th className="border p-2">Amount</th>
// //                             <th className="border p-2">Reference</th>
// //                             <th className="border p-2">Posted At</th>
// //                             <th className="border p-2">By</th>
// //                             <th className="border p-2">Action</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //                         {allPayments.map(p => (
// //                             <tr key={`${p.id}-${p.folioId}`}>
// //                                 <td className="border p-2">{p.method}</td>
// //                                 <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
// //                                 <td className="border p-2">{p.ref || "-"}</td>
// //                                 <td className="border p-2">{new Date(p.postedAt).toLocaleString()}</td>
// //                                 <td className="border p-2">{p.postedBy?.name || "System"} {p.guestName ? `(${p.guestName})` : ""}</td>
// //                                 <td className="border p-2 text-center">
// //                                     {canDeletePayment && (
// //                                         <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700">
// //                                             حذف
// //                                         </button>
// //                                     )}
// //                                 </td>
// //                             </tr>
// //                         ))}
// //                     </tbody>
// //                 </table>

// //                 {canAddPayment && (
// //                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
// //                         <input placeholder="Method" className="border p-2 rounded flex-1" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} />
// //                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
// //                         <input placeholder="Reference (اختياري)" className="border p-2 rounded flex-1" value={newPayment.ref} onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })} />
// //                         <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
// //                     </div>
// //                 )}
// //             </div>
// //         </div>
// //     );
// // }







// 'use client';
// import { useEffect, useState, useCallback } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function FolioPage({ bookingId, groupId, session }) {
//     const sessionUser = session?.user || null;
//     const socket = useSocket();

//     const [folios, setFolios] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [newCharge, setNewCharge] = useState({ code: "", description: "", amount: "", tax: "" });
//     const [newPayment, setNewPayment] = useState({ method: "", amount: "", ref: "" });

//     const role = sessionUser?.role || "FrontDesk";
//     const canAddCharge = ["Admin", "Manager", "FrontDesk"].includes(role);
//     const canDeleteCharge = ["Admin", "Manager"].includes(role);
//     const canAddPayment = ["Admin", "Manager", "FrontDesk"].includes(role);
//     const canDeletePayment = ["Admin", "Manager"].includes(role);
//     const canCloseFolio = ["Admin", "Manager"].includes(role);

//     const fetchFolios = useCallback(async () => {
//         setLoading(true);
//         try {
//             let url = `/api/folios/${bookingId}`;
//             if (groupId) url = `/api/folios/group/${groupId}`;

//             const res = await fetch(url);
//             if (!res.ok) throw new Error("Failed to fetch folios");

//             const data = await res.json();

//             if (groupId) {
//                 // API المجموعة: { folios, groupTotals }
//                 setFolios(Array.isArray(data.folios) ? data.folios : []);
//             } else {
//                 // API الحجز الفردي: يعيد الفاتورة مباشرة
//                 setFolios(data ? [data] : []);
//             }
//         } catch (err) {
//             console.error(err);
//             setFolios([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [bookingId, groupId]);


//     useEffect(() => { fetchFolios(); }, [fetchFolios]);

//     useEffect(() => {
//         if (!socket) return;
//         const onFolioUpdated = () => fetchFolios();
//         ["BOOKING_UPDATED", "CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => {
//             socket.on(event, onFolioUpdated);
//         });
//         return () => {
//             ["BOOKING_UPDATED", "CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => {
//                 socket.off(event, onFolioUpdated);
//             });
//         };
//     }, [socket, fetchFolios]);

//     if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
//     if (!folios.length) return <p className="text-center mt-4">لا توجد فواتير</p>;

//     // دمج كل charges و payments لجميع الفواتير ضمن المجموعة
//     const allCharges = folios.flatMap(f =>
//         (f.charges ?? []).map(c => ({
//             ...c,
//             folioId: f.id,
//             guestName: f.booking?.guest
//                 ? `${f.booking.guest.firstName} ${f.booking.guest.lastName}`
//                 : "-"
//         }))
//     );

//     const allPayments = folios.flatMap(f =>
//         (f.payments ?? []).map(p => ({
//             ...p,
//             folioId: f.id,
//             guestName: p.booking?.guest
//                 ? `${p.booking.guest.firstName} ${p.booking.guest.lastName}`
//                 : "-"
//         }))
//     );

//     const subtotal = allCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
//     const taxTotal = allCharges.reduce((sum, c) => sum + (Number(c.amount || 0) * Number(c.tax || 0)) / 100, 0);
//     const totalCharges = subtotal + taxTotal;
//     const totalPayments = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
//     const balance = totalCharges - totalPayments;

//     // CRUD functions
//     const handleAddCharge = async () => {
//         if (!canAddCharge) return alert("ليس لديك صلاحية لإضافة Charges");
//         try {
//             const amount = Number(newCharge.amount);
//             const taxPercent = Number(newCharge.tax || 0);

//             await fetch(`/api/folios/${folios[0].id}/charges`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ ...newCharge, amount, tax: taxPercent, postedById: sessionUser.id }),
//             });
//             setNewCharge({ code: "", description: "", amount: "", tax: "" });
//             fetchFolios();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const handleDeleteCharge = async (chargeId) => {
//         if (!canDeleteCharge) return alert("ليس لديك صلاحية لحذف Charges");
//         try {
//             await fetch(`/api/folios/${folios[0].id}/charges`, {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ chargeId }),
//             });
//             fetchFolios();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const handleAddPayment = async () => {
//         if (!canAddPayment) return alert("ليس لديك صلاحية لإضافة Payments");
//         try {
//             await fetch(`/api/folios/${folios[0].id}/payments`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ ...newPayment, amount: Number(newPayment.amount), postedById: sessionUser.id }),
//             });
//             setNewPayment({ method: "", amount: "", ref: "" });
//             fetchFolios();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const handleDeletePayment = async (paymentId) => {
//         if (!canDeletePayment) return alert("ليس لديك صلاحية لحذف Payments");
//         try {
//             await fetch(`/api/folios/${folios[0].id}/payments`, {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ paymentId }),
//             });
//             fetchFolios();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     const toggleFolioStatus = async () => {
//         if (!canCloseFolio) return alert("ليس لديك صلاحية لإغلاق أو إعادة فتح الفاتورة");
//         try {
//             await fetch(`/api/folios/${folios[0].id}/close`, { method: "POST" });
//             fetchFolios();
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     return (
//         <div className="p-6 max-w-5xl mx-auto">
//             <div className="rounded shadow p-4 mb-6">
//                 <h2 className="text-2xl font-bold mb-3">Folio Summary</h2>
//                 <p>Subtotal: <span className="text-gray-800 font-bold">{subtotal.toFixed(2)}</span></p>
//                 <p>Tax Total: <span className="text-orange-600 font-bold">{taxTotal.toFixed(2)}</span></p>
//                 <p>Total Charges: <span className="text-red-600 font-bold">{totalCharges.toFixed(2)}</span></p>
//                 <p>Total Payments: <span className="text-green-600 font-bold">{totalPayments.toFixed(2)}</span></p>
//                 <p>Balance: <span className="text-blue-600 font-bold">{balance.toFixed(2)}</span></p>
//                 <div className="flex gap-3 mt-4 flex-wrap">
//                     <button onClick={toggleFolioStatus} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600" disabled={!canCloseFolio}>
//                         {folios.some(f => f.status === "Open") ? "Close Folio" : "Reopen Folio"}
//                     </button>
//                 </div>
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
//                             <th className="border p-2">Tax Value</th>
//                             <th className="border p-2">Posted At</th>
//                             <th className="border p-2">By</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {allCharges.map(c => {
//                             const taxValue = (Number(c.amount || 0) * Number(c.tax || 0)) / 100;
//                             return (
//                                 <tr key={`${c.id}-${c.folioId}`}>
//                                     <td className="border p-2">{c.code}</td>
//                                     <td className="border p-2">{c.description}</td>
//                                     <td className="border p-2">{Number(c.amount).toFixed(2)}</td>
//                                     <td className="border p-2">{c.tax}%</td>
//                                     <td className="border p-2">{taxValue.toFixed(2)}</td>
//                                     <td className="border p-2">{new Date(c.postedAt).toLocaleString()}</td>
//                                     <td className="border p-2">{c.postedBy?.name || "System"} {c.guestName ? `(${c.guestName})` : ""}</td>
//                                     <td className="border p-2 text-center">
//                                         {canDeleteCharge && (
//                                             <button onClick={() => handleDeleteCharge(c.id)} className="text-red-500 hover:text-red-700">
//                                                 حذف
//                                             </button>
//                                         )}
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                 </table>

//                 {canAddCharge && (
//                     <div className="mt-4 flex flex-col sm:flex-row gap-2">
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
//                             <th className="border p-2">Method</th>
//                             <th className="border p-2">Amount</th>
//                             <th className="border p-2">Reference</th>
//                             <th className="border p-2">Posted At</th>
//                             <th className="border p-2">By</th>
//                             <th className="border p-2">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {allPayments.map(p => (
//                             <tr key={`${p.id}-${p.folioId}`}>
//                                 <td className="border p-2">{p.method}</td>
//                                 <td className="border p-2">{Number(p.amount).toFixed(2)}</td>
//                                 <td className="border p-2">{p.ref || "-"}</td>
//                                 <td className="border p-2">{new Date(p.postedAt).toLocaleString()}</td>
//                                 <td className="border p-2">{p.postedBy?.name || "System"} {p.guestName ? `(${p.guestName})` : ""}</td>
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
//                         <input placeholder="Method" className="border p-2 rounded flex-1" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} />
//                         <input placeholder="Amount" type="number" className="border p-2 rounded w-24" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
//                         <input placeholder="Reference (اختياري)" className="border p-2 rounded flex-1" value={newPayment.ref} onChange={(e) => setNewPayment({ ...newPayment, ref: e.target.value })} />
//                         <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add</button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
