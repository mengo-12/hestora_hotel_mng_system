// 'use client';

// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export default function NightAuditPage({ initialPropertyId, initialProperties, session, darkMode = false }) {
//     const socket = useSocket();
//     const role = session?.user?.role || "Guest";

//     const canRunAudit = ["Admin", "Manager"].includes(role);
//     const canExport = ["Admin", "Manager"].includes(role);
//     const canView = ["Admin", "Manager"].includes(role);

//     if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

//     const [properties, setProperties] = useState(initialProperties || []);
//     const [selectedProperty, setSelectedProperty] = useState(initialPropertyId || "");
//     const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
//     const [logs, setLogs] = useState([]);
//     const [bookings, setBookings] = useState([]);
//     const [summary, setSummary] = useState(null);
//     const [running, setRunning] = useState(false);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         if (!properties || properties.length === 0) {
//             fetch("/api/properties").then(r => r.json()).then(d => setProperties(d || [])).catch(console.error);
//         }
//     }, [properties]);

//     useEffect(() => {
//         if (!socket) return;
//         const handle = (payload) => {
//             setLogs(prev => [{ id: Date.now(), ...payload, createdAt: new Date() }, ...prev]);
//         };
//         socket.on("AUDIT_STEP_COMPLETED", handle);
//         socket.on("ROOM_CHARGE_POSTED", handle);
//         socket.on("audit-log", handle);
//         return () => {
//             socket.off("AUDIT_STEP_COMPLETED", handle);
//             socket.off("ROOM_CHARGE_POSTED", handle);
//             socket.off("audit-log", handle);
//         };
//     }, [socket]);

//     const fetchAuditData = async (propId = selectedProperty, date = auditDate) => {
//         if (!propId) return;
//         try {
//             const res = await fetch(`/api/night-audit?propertyId=${propId}&date=${date}`);
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || "Failed to fetch audit data");
//             setBookings(data.bookings || []);
//             setSummary(data.summary || null);
//         } catch (err) { console.error(err); setError(err.message); }
//     };

//     const runAudit = async () => {
//         if (!canRunAudit) return alert("You do not have permission to run night audit.");
//         if (!selectedProperty) { setError("Please select a Property"); return; }
//         setRunning(true); setError(null);
//         try {
//             const res = await fetch("/api/night-audit", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ propertyId: selectedProperty, date: auditDate })
//             });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || "Night audit failed");
//             setBookings(data.bookings || []);
//             setSummary(data.summary || null);
//             setLogs(prev => [
//                 { id: Date.now(), step: "NIGHT_AUDIT_RUN", message: `Night audit executed for ${auditDate}`, createdAt: new Date() },
//                 ...prev
//             ]);
//         } catch (err) { console.error(err); setError(err.message); }
//         finally { setRunning(false); }
//     };

//     // ================= Export PDF =================
//     const exportPDF = () => {
//         if (!bookings || bookings.length === 0) return alert("No bookings to export.");
//         const doc = new jsPDF();
//         doc.setFontSize(18);
//         doc.text("Night Audit Report", 14, 20);
//         doc.setFontSize(12);
//         doc.text(`Property: ${properties.find(p => p.id === selectedProperty)?.name || "-"}`, 14, 28);
//         doc.text(`Date: ${auditDate}`, 14, 34);

//         bookings.forEach((b, idx) => {
//             const yStart = 40 + idx * 60;
//             const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
//             const subtotal = b.folio?.subtotal ?? 0;
//             const taxTotal = b.folio?.taxTotal ?? 0;
//             const totalCharges = b.folio?.totalCharges ?? 0;
//             const totalPayments = b.folio?.totalPayments ?? 0;
//             const balance = b.folio?.balance ?? 0;

//             doc.text(`Room: ${b.room?.number || "-"}`, 14, yStart);
//             doc.text(`Guest: ${guestName} • Status: ${b.status} • RoomType: ${b.room?.roomType?.name || "-"}`, 14, yStart + 6);
//             doc.text(`Subtotal: ${subtotal.toFixed(2)} | Tax: ${taxTotal.toFixed(2)} | Total: ${totalCharges.toFixed(2)} | Payments: ${totalPayments.toFixed(2)} | Balance: ${balance.toFixed(2)}`, 14, yStart + 12);

//             if (b.folio?.charges?.length > 0) {
//                 const tableData = b.folio.charges.map(c => [
//                     c.description,
//                     c.code,
//                     Number(c.amount || 0).toFixed(2),
//                     Number(c.tax || 0),
//                     (Number(c.amount || 0) + (Number(c.amount || 0) * Number(c.tax || 0) / 100)).toFixed(2),
//                     new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()
//                 ]);
//                 autoTable(doc, {
//                     startY: yStart + 18,
//                     head: [["Charge", "Code", "Amount", "Tax %", "Total", "Time"]],
//                     body: tableData,
//                     theme: "grid",
//                     headStyles: { fillColor: [41, 128, 185] }
//                 });
//             }
//         });

//         doc.save(`NightAudit_${auditDate}.pdf`);
//     };

//     // ================= Export CSV =================
//     const exportCSV = () => {
//         if (!bookings || bookings.length === 0) return alert("No bookings to export.");
//         let csv = `Room,Guest,Status,RoomType,Nights,Company,FolioID,Subtotal,TaxTotal,TotalCharges,TotalPayments,Balance\n`;

//         bookings.forEach(b => {
//             const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
//             const subtotal = b.folio?.subtotal ?? 0;
//             const taxTotal = b.folio?.taxTotal ?? 0;
//             const totalCharges = b.folio?.totalCharges ?? 0;
//             const totalPayments = b.folio?.totalPayments ?? 0;
//             const balance = b.folio?.balance ?? 0;

//             csv += [
//                 b.room?.number || "-",
//                 `"${guestName}"`,
//                 b.status,
//                 b.room?.roomType?.name || "-",
//                 b.nights || 1,
//                 b.company?.name || "-",
//                 b.folio?.id || "-",
//                 subtotal.toFixed(2),
//                 taxTotal.toFixed(2),
//                 totalCharges.toFixed(2),
//                 totalPayments.toFixed(2),
//                 balance.toFixed(2)
//             ].join(",") + "\n";

//             // Charges detail
//             if (b.folio?.charges?.length > 0) {
//                 csv += `Charge Details:\nDescription,Code,Amount,Tax %,Total,Time\n`;
//                 b.folio.charges.forEach(c => {
//                     csv += [
//                         `"${c.description}"`,
//                         c.code,
//                         Number(c.amount || 0).toFixed(2),
//                         Number(c.tax || 0),
//                         (Number(c.amount || 0) + (Number(c.amount || 0) * Number(c.tax || 0) / 100)).toFixed(2),
//                         new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()
//                     ].join(",") + "\n";
//                 });
//             }
//         });



//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `NightAudit_${auditDate}.csv`;
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     // ================= Print Night Audit =================
//     const printAudit = () => {
//         if (!bookings || bookings.length === 0) return alert("No bookings to print.");
//         const printWindow = window.open("", "_blank");
//         if (!printWindow) return;

//         const style = `
//         <style>
//             body { font-family: Arial, sans-serif; padding: 20px; }
//             h1 { text-align: center; margin-bottom: 10px; }
//             .folio { margin-bottom: 30px; padding: 10px; border: 1px solid #999; page-break-after: always; }
//             .header { text-align: center; margin-bottom: 10px; font-size: 14px; }
//             table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//             th, td { border: 1px solid #333; padding: 4px; text-align: left; font-size: 12px; }
//             th { background-color: #ddd; }
//         </style>
//     `;

//         let html = `<html><head><title>Night Audit ${auditDate}</title>${style}</head><body>`;
//         html += `<h1>Night Audit Report</h1>`;
//         html += `<p class="header">Property: ${properties.find(p => p.id === selectedProperty)?.name || "-"} | Date: ${auditDate}</p>`;

//         bookings.forEach(b => {
//             const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
//             const subtotal = b.folio?.subtotal ?? 0;
//             const taxTotal = b.folio?.taxTotal ?? 0;
//             const totalCharges = b.folio?.totalCharges ?? 0;
//             const totalPayments = b.folio?.totalPayments ?? 0;
//             const balance = b.folio?.balance ?? 0;

//             html += `<div class="folio">
//             <strong>Room:</strong> ${b.room?.number || "-"} <br/>
//             <strong>Guest:</strong> ${guestName} • Status: ${b.status} • RoomType: ${b.room?.roomType?.name || "-"} • Nights: ${b.nights || 1} • Company: ${b.company?.name || "-"} <br/>
//             <strong>Folio ID:</strong> ${b.folio?.id || "-"} <br/>
//             <strong>Subtotal:</strong> ${subtotal.toFixed(2)} | 
//             <strong>Tax Total:</strong> ${taxTotal.toFixed(2)} | 
//             <strong>Total Charges:</strong> ${totalCharges.toFixed(2)} | 
//             <strong>Total Payments:</strong> ${totalPayments.toFixed(2)} | 
//             <strong>Balance:</strong> ${balance.toFixed(2)}
//         `;

//             if (b.folio?.charges?.length > 0) {
//                 html += `<table><thead><tr><th>Charge</th><th>Code</th><th>Amount</th><th>Tax %</th><th>Total</th><th>Time</th></tr></thead><tbody>`;
//                 b.folio.charges.forEach(c => {
//                     const amount = Number(c.amount || 0);
//                     const taxPercent = Number(c.tax || 0);
//                     const total = amount + (amount * taxPercent / 100);
//                     html += `<tr>
//                     <td>${c.description}</td>
//                     <td>${c.code}</td>
//                     <td>${amount.toFixed(2)}</td>
//                     <td>${taxPercent.toFixed(2)}</td>
//                     <td>${total.toFixed(2)}</td>
//                     <td>${new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()}</td>
//                 </tr>`;
//                 });
//                 html += `</tbody></table>`;
//             }

//             html += `</div>`;
//         });

//         html += `</body></html>`;

//         printWindow.document.write(html);
//         printWindow.document.close();
//         printWindow.focus();
//         printWindow.print();
//     };

//     // ================= Render =================
//     return (
//         <div className={`${darkMode ? "bg-gray-900 text-white min-h-screen" : "bg-white text-black"} p-6`}>
//             <h1 className="text-2xl font-bold mb-4">Night Audit</h1>
//             <div className="flex flex-wrap gap-4 mb-4 items-center">
//                 <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="border p-2 rounded text-black">
//                     <option value="">-- Select Property --</option>
//                     {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                 </select>
//                 <input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} className="border p-2 rounded text-black" />
//                 <button onClick={() => fetchAuditData(selectedProperty, auditDate)} className="bg-gray-600 text-white px-4 py-2 rounded">Fetch Data</button>
//                 <button onClick={runAudit} disabled={running || !canRunAudit} className={`px-4 py-2 rounded ${running ? "bg-blue-400" : "bg-blue-600 text-white"}`}>{running ? "Running..." : "Run Night Audit"}</button>
//                 {canExport && (
//                     <>
//                         <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
//                         <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded">Export CSV</button>
//                         <button onClick={printAudit} className="bg-blue-500 text-white px-4 py-2 rounded">Print</button>
//                     </>
//                 )}
//             </div>

//             {error && <div className="text-red-400 mb-4">{error}</div>}

//             <div className="space-y-4">
//                 {bookings.length === 0 ? <div>No bookings found for the selected date.</div> : bookings.map(b => {
//                     const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");

//                     const subtotal = b.folio?.subtotal ?? 0;
//                     const taxTotal = b.folio?.taxTotal ?? 0;
//                     const totalCharges = b.folio?.totalCharges ?? 0;
//                     const totalPayments = b.folio?.totalPayments ?? 0;
//                     const balance = b.folio?.balance ?? 0;

//                     return (
//                         <div key={b.id} className={`${darkMode ? "bg-gray-800 text-white" : "bg-gray-100"} p-4 rounded shadow`}>
//                             <div className="flex justify-between items-center mb-2">
//                                 <div>
//                                     <div className="font-semibold">Room: {b.room?.number || "-"}</div>
//                                     <div className="text-sm">
//                                         Guest: {guestName} • Status: {b.status} • RoomType: {b.room?.roomType?.name || "-"} • Nights: {b.nights || 1} • Company: {b.company?.name || "-"}
//                                     </div>
//                                 </div>
//                                 <div className="text-right">
//                                     <div className="font-semibold">Balance: {balance.toFixed(2)}</div>
//                                     <div className="text-sm">Folio ID: {b.folio?.id || "-"}</div>
//                                 </div>
//                             </div>

//                             <div className="text-sm mt-2">
//                                 <p>Subtotal: {subtotal.toFixed(2)}</p>
//                                 <p>Tax Total: {taxTotal.toFixed(2)}</p>
//                                 <p>Total Charges: {totalCharges.toFixed(2)}</p>
//                                 <p>Total Payments: {totalPayments.toFixed(2)}</p>
//                                 <p>Balance: {balance.toFixed(2)}</p>
//                             </div>

//                             {b.folio?.charges?.length > 0 && (
//                                 <div className="overflow-x-auto mt-2">
//                                     <table className="min-w-full text-sm">
//                                         <thead className={`${darkMode ? "bg-gray-700" : "bg-white"}`}>
//                                             <tr>
//                                                 <th className="px-2 py-1 text-left">Charge</th>
//                                                 <th className="px-2 py-1 text-left">Code</th>
//                                                 <th className="px-2 py-1 text-left">Amount</th>
//                                                 <th className="px-2 py-1 text-left">Tax</th>
//                                                 <th className="px-2 py-1 text-left">Total</th>
//                                                 <th className="px-2 py-1 text-left">Time</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {b.folio.charges.map(c => (
//                                                 <tr key={c.id} className="border-t">
//                                                     <td className="px-2 py-1">{c.description}</td>
//                                                     <td className="px-2 py-1">{c.code}</td>
//                                                     <td className="px-2 py-1">{Number(c.amount || 0).toFixed(2)}</td>
//                                                     <td className="px-2 py-1">{Number(c.tax || 0)}</td>
//                                                     <td className="px-2 py-1">{(Number(c.amount || 0) + (Number(c.amount || 0) * Number(c.tax || 0) / 100)).toFixed(2)}</td>
//                                                     <td className="px-2 py-1">{new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             )}
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// }






'use client';

import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    FileDown,
    FileSpreadsheet,
    Printer,
    PlayCircle,
    Database,
    Building2,
    CalendarDays,
    Loader2,
    BedDouble,
    Percent,
    DollarSign,
    BarChart3,
    Clock
} from "lucide-react";

export default function NightAuditAdminClient({ initialPropertyId, initialProperties, session, darkMode = false }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const canRunAudit = ["Admin", "Manager"].includes(role);
    const canExport = ["Admin", "Manager"].includes(role);
    const canView = ["Admin", "Manager"].includes(role);

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    const [properties, setProperties] = useState(initialProperties || []);
    const [selectedProperty, setSelectedProperty] = useState(initialPropertyId || "");
    const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
    const [logs, setLogs] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!properties || properties.length === 0) {
            fetch("/api/properties")
                .then(r => r.json())
                .then(d => setProperties(d || []))
                .catch(console.error);
        }
    }, [properties]);

    useEffect(() => {
        if (!socket) return;
        const handle = (payload) => setLogs(prev => [{ id: Date.now(), ...payload, createdAt: new Date() }, ...prev]);
        socket.on("AUDIT_STEP_COMPLETED", handle);
        socket.on("ROOM_CHARGE_POSTED", handle);
        socket.on("audit-log", handle);
        return () => {
            socket.off("AUDIT_STEP_COMPLETED", handle);
            socket.off("ROOM_CHARGE_POSTED", handle);
            socket.off("audit-log", handle);
        };
    }, [socket]);

    const fetchAuditData = async (propId = selectedProperty, date = auditDate) => {
        if (!propId) return;
        try {
            const res = await fetch(`/api/night-audit?propertyId=${propId}&date=${date}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch audit data");
            setBookings(data.bookings || []);
            setSummary(data.summary || null);
        } catch (err) { console.error(err); setError(err.message); }
    };

    const runAudit = async () => {
        if (!canRunAudit) return alert("You do not have permission to run night audit.");
        if (!selectedProperty) { setError("Please select a Property"); return; }
        setRunning(true); setError(null);
        try {
            const res = await fetch("/api/night-audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: selectedProperty, date: auditDate })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Night audit failed");
            setBookings(data.bookings || []);
            setSummary(data.summary || null);
            setLogs(prev => [
                { id: Date.now(), step: "NIGHT_AUDIT_RUN", message: `Night audit executed for ${auditDate}`, createdAt: new Date() },
                ...prev
            ]);
        } catch (err) { console.error(err); setError(err.message); }
        finally { setRunning(false); }
    };

    // export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text(`Night Audit Report - ${auditDate}`, 14, 12);

        if (summary) {
            doc.setFontSize(10);
            doc.text(`Rooms Sold: ${summary.roomsSold}   Occupancy: ${summary.occupancy}%   ADR: ${summary.adr}   RevPAR: ${summary.revpar}`, 14, 20);
        }

        let cursorY = 30;
        for (const b of bookings) {
            if (cursorY > 260) { doc.addPage(); cursorY = 14; }
            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            doc.setFontSize(11);
            doc.text(`Room: ${b.room?.number || "-"}  Guest: ${guestName}  Status: ${b.status}`, 14, cursorY);
            cursorY += 6;

            const rows = (b.folio?.charges || []).map(c => [
                c.description,
                c.code || "",
                String(c.amount),
                new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()
            ]);

            autoTable(doc, {
                startY: cursorY,
                head: [["Charge", "Code", "Amount", "Time"]],
                body: rows,
                styles: { fontSize: 9 },
                theme: "grid",
            });

            cursorY = (doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : cursorY + 30);
        }

        doc.save(`NightAudit_${auditDate}.pdf`);
    };

    // export CSV
    const exportCSV = () => {
        if (!canExport) return alert("You do not have permission to export reports.");
        if (!bookings || bookings.length === 0) return;
        const rows = [["Room", "Guest", "Status", "Charge", "Code", "Amount", "Time"]];
        for (const b of bookings) {
            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            for (const c of (b.folio?.charges || [])) {
                rows.push([b.room?.number || "-", guestName, b.status, c.description, c.code || "", c.amount, new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()]);
            }
        }
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `NightAudit_${auditDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        if (!canExport) return alert("You do not have permission to print reports.");
        window.print();
    };

    return (
        <div className="p-6 space-y-8  dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">


            {/* KPI Cards */}
            {/* {summary && ( */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <BedDouble className="w-5 h-5" /> Rooms Sold
                    </div>
                    <div className="text-2xl font-bold">{summary?.roomsSold || 0}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <Percent className="w-5 h-5" /> Occupancy
                    </div>
                    <div className="text-2xl font-bold">{summary?.occupancy ?? 0}%</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <DollarSign className="w-5 h-5" /> ADR
                    </div>
                    <div className="text-2xl font-bold">{summary?.adr || 0}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                        <BarChart3 className="w-5 h-5" /> RevPAR
                    </div>
                    <div className="text-2xl font-bold">{summary?.revpar || 0}</div>
                </div>
            </div>
            {/* )} */}

            {/* Audit Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg">

                {/* Property Select */}
                <div className="flex items-center gap-2 w-full md:w-1/4">
                    <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                    <select
                        value={selectedProperty}
                        onChange={e => setSelectedProperty(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                    >
                        <option value="">-- Select Property --</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {/* Audit Date */}
                <div className="flex items-center gap-2 w-full md:w-1/5">
                    <CalendarDays className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                    <input
                        type="date"
                        value={auditDate}
                        onChange={e => setAuditDate(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                </div>

                {/* Fetch Data */}
                <button
                    onClick={() => fetchAuditData(selectedProperty, auditDate)}
                    className="bg-gray-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-700 transition shadow-md w-full md:w-auto justify-center"
                >
                    <BarChart3 className="w-5 h-5" /> Fetch Data
                </button>

                {/* Run Audit */}
                <button
                    onClick={runAudit}
                    disabled={running || !canRunAudit}
                    className={`px-4 py-3 rounded-xl flex items-center gap-2 shadow-md transition w-full md:w-auto justify-center ${running ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                    {running ? <Loader2 className="animate-spin w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    {running ? "Running..." : "Run Night Audit"}
                </button>

                {/* Export PDF */}
                <button
                    onClick={exportPDF}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition shadow-md w-full md:w-auto justify-center"
                    disabled={!canExport}
                >
                    <FileDown className="w-5 h-5" /> PDF
                </button>

                {/* Export CSV */}
                <button
                    onClick={exportCSV}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition shadow-md w-full md:w-auto justify-center"
                    disabled={!canExport}
                >
                    <FileSpreadsheet className="w-5 h-5" /> CSV
                </button>

                {/* Print */}
                <button
                    onClick={handlePrint}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition shadow-md w-full md:w-auto justify-center"
                    disabled={!canExport}
                >
                    <Printer className="w-5 h-5" /> Print
                </button>

            </div>


            {/* Error */}
            {error && <div className="text-red-500 mb-4">{error}</div>}

            {/* Bookings */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <BedDouble className="text-blue-500" /> Bookings
                    </h2>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        {bookings.length} Bookings
                    </span>
                </div>

                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left">🏨 Room</th>
                                <th className="px-4 py-3 text-left">👤 Guest</th>
                                <th className="px-4 py-3 text-left">📌 Status</th>
                                <th className="px-4 py-3 text-left">💰 Total</th>
                                <th className="px-4 py-3 text-left">🧾 Charges</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b, i) => {
                                const guestName = b.guest?.firstName
                                    ? `${b.guest.firstName} ${b.guest.lastName || ""}`
                                    : b.guest?.name || "-";
                                const total = (b.folio?.charges || []).reduce((s, c) => s + Number(c.amount), 0);

                                return (
                                    <tr
                                        key={b.id}
                                        className={`${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800"} hover:bg-blue-50 dark:hover:bg-gray-700 transition`}
                                    >
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.room?.number || "-"}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{guestName}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${b.status === "CheckedIn"
                                                    ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                                                    : b.status === "CheckedOut"
                                                        ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                                        : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"
                                                    }`}
                                            >
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{total}</td>
                                        <td className="px-4 py-3">
                                            {b.folio?.charges?.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg">
                                                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                                            <tr>
                                                                <th className="px-2 py-1 text-left font-medium">Charge</th>
                                                                <th className="px-2 py-1 text-left font-medium">Code</th>
                                                                <th className="px-2 py-1 text-left font-medium">Amount</th>
                                                                <th className="px-2 py-1 text-left font-medium">Time</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {b.folio.charges.map(c => (
                                                                <tr key={c.id} className="border-t border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-200">
                                                                    <td className="px-2 py-1">{c.description}</td>
                                                                    <td className="px-2 py-1">{c.code}</td>
                                                                    <td className="px-2 py-1">{String(c.amount)}</td>
                                                                    <td className="px-2 py-1">{new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 dark:text-gray-300 text-xs">No charges</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No bookings found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Logs */}
            <h2 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> Timeline (Realtime)
            </h2>
            <ul className="space-y-2">
                {logs.map((l, i) => (
                    <li key={i} className="border p-3 rounded bg-white dark:bg-gray-800 shadow">
                        <div className="text-sm font-semibold">{l.step || l.event || l.message}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                            {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : new Date(l.createdAt || Date.now()).toLocaleTimeString()}
                        </div>
                        {l.data && <pre className="mt-2 text-xs overflow-x-auto">{JSON.stringify(l.data, null, 2)}</pre>}
                    </li>
                ))}
            </ul>
        </div>
    );
}
