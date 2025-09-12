'use client';

import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function NightAuditPage({ initialPropertyId, initialProperties, session, darkMode = false }) {
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
            fetch("/api/properties").then(r => r.json()).then(d => setProperties(d || [])).catch(console.error);
        }
    }, [properties]);

    useEffect(() => {
        if (!socket) return;
        const handle = (payload) => {
            setLogs(prev => [{ id: Date.now(), ...payload, createdAt: new Date() }, ...prev]);
        };
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

    // ================= Export PDF =================
    const exportPDF = () => {
        if (!bookings || bookings.length === 0) return alert("No bookings to export.");
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Night Audit Report", 14, 20);
        doc.setFontSize(12);
        doc.text(`Property: ${properties.find(p => p.id === selectedProperty)?.name || "-"}`, 14, 28);
        doc.text(`Date: ${auditDate}`, 14, 34);

        bookings.forEach((b, idx) => {
            const yStart = 40 + idx * 60;
            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            const subtotal = b.folio?.subtotal ?? 0;
            const taxTotal = b.folio?.taxTotal ?? 0;
            const totalCharges = b.folio?.totalCharges ?? 0;
            const totalPayments = b.folio?.totalPayments ?? 0;
            const balance = b.folio?.balance ?? 0;

            doc.text(`Room: ${b.room?.number || "-"}`, 14, yStart);
            doc.text(`Guest: ${guestName} • Status: ${b.status} • RoomType: ${b.room?.roomType?.name || "-"}`, 14, yStart + 6);
            doc.text(`Subtotal: ${subtotal.toFixed(2)} | Tax: ${taxTotal.toFixed(2)} | Total: ${totalCharges.toFixed(2)} | Payments: ${totalPayments.toFixed(2)} | Balance: ${balance.toFixed(2)}`, 14, yStart + 12);

            if (b.folio?.charges?.length > 0) {
                const tableData = b.folio.charges.map(c => [
                    c.description,
                    c.code,
                    Number(c.amount || 0).toFixed(2),
                    Number(c.tax || 0),
                    (Number(c.amount || 0) + (Number(c.amount || 0) * Number(c.tax || 0) / 100)).toFixed(2),
                    new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()
                ]);
                autoTable(doc, {
                    startY: yStart + 18,
                    head: [["Charge", "Code", "Amount", "Tax %", "Total", "Time"]],
                    body: tableData,
                    theme: "grid",
                    headStyles: { fillColor: [41, 128, 185] }
                });
            }
        });

        doc.save(`NightAudit_${auditDate}.pdf`);
    };

    // ================= Export CSV =================
    const exportCSV = () => {
        if (!bookings || bookings.length === 0) return alert("No bookings to export.");
        let csv = `Room,Guest,Status,RoomType,Nights,Company,FolioID,Subtotal,TaxTotal,TotalCharges,TotalPayments,Balance\n`;

        bookings.forEach(b => {
            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            const subtotal = b.folio?.subtotal ?? 0;
            const taxTotal = b.folio?.taxTotal ?? 0;
            const totalCharges = b.folio?.totalCharges ?? 0;
            const totalPayments = b.folio?.totalPayments ?? 0;
            const balance = b.folio?.balance ?? 0;

            csv += [
                b.room?.number || "-",
                `"${guestName}"`,
                b.status,
                b.room?.roomType?.name || "-",
                b.nights || 1,
                b.company?.name || "-",
                b.folio?.id || "-",
                subtotal.toFixed(2),
                taxTotal.toFixed(2),
                totalCharges.toFixed(2),
                totalPayments.toFixed(2),
                balance.toFixed(2)
            ].join(",") + "\n";

            // Charges detail
            if (b.folio?.charges?.length > 0) {
                csv += `Charge Details:\nDescription,Code,Amount,Tax %,Total,Time\n`;
                b.folio.charges.forEach(c => {
                    csv += [
                        `"${c.description}"`,
                        c.code,
                        Number(c.amount || 0).toFixed(2),
                        Number(c.tax || 0),
                        (Number(c.amount || 0) + (Number(c.amount || 0) * Number(c.tax || 0) / 100)).toFixed(2),
                        new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()
                    ].join(",") + "\n";
                });
            }
        });



        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `NightAudit_${auditDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ================= Print Night Audit =================
    const printAudit = () => {
        if (!bookings || bookings.length === 0) return alert("No bookings to print.");
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const style = `
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .folio { margin-bottom: 30px; padding: 10px; border: 1px solid #999; page-break-after: always; }
            .header { text-align: center; margin-bottom: 10px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 4px; text-align: left; font-size: 12px; }
            th { background-color: #ddd; }
        </style>
    `;

        let html = `<html><head><title>Night Audit ${auditDate}</title>${style}</head><body>`;
        html += `<h1>Night Audit Report</h1>`;
        html += `<p class="header">Property: ${properties.find(p => p.id === selectedProperty)?.name || "-"} | Date: ${auditDate}</p>`;

        bookings.forEach(b => {
            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            const subtotal = b.folio?.subtotal ?? 0;
            const taxTotal = b.folio?.taxTotal ?? 0;
            const totalCharges = b.folio?.totalCharges ?? 0;
            const totalPayments = b.folio?.totalPayments ?? 0;
            const balance = b.folio?.balance ?? 0;

            html += `<div class="folio">
            <strong>Room:</strong> ${b.room?.number || "-"} <br/>
            <strong>Guest:</strong> ${guestName} • Status: ${b.status} • RoomType: ${b.room?.roomType?.name || "-"} • Nights: ${b.nights || 1} • Company: ${b.company?.name || "-"} <br/>
            <strong>Folio ID:</strong> ${b.folio?.id || "-"} <br/>
            <strong>Subtotal:</strong> ${subtotal.toFixed(2)} | 
            <strong>Tax Total:</strong> ${taxTotal.toFixed(2)} | 
            <strong>Total Charges:</strong> ${totalCharges.toFixed(2)} | 
            <strong>Total Payments:</strong> ${totalPayments.toFixed(2)} | 
            <strong>Balance:</strong> ${balance.toFixed(2)}
        `;

            if (b.folio?.charges?.length > 0) {
                html += `<table><thead><tr><th>Charge</th><th>Code</th><th>Amount</th><th>Tax %</th><th>Total</th><th>Time</th></tr></thead><tbody>`;
                b.folio.charges.forEach(c => {
                    const amount = Number(c.amount || 0);
                    const taxPercent = Number(c.tax || 0);
                    const total = amount + (amount * taxPercent / 100);
                    html += `<tr>
                    <td>${c.description}</td>
                    <td>${c.code}</td>
                    <td>${amount.toFixed(2)}</td>
                    <td>${taxPercent.toFixed(2)}</td>
                    <td>${total.toFixed(2)}</td>
                    <td>${new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()}</td>
                </tr>`;
                });
                html += `</tbody></table>`;
            }

            html += `</div>`;
        });

        html += `</body></html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    // ================= Render =================
    return (
        <div className={`${darkMode ? "bg-gray-900 text-white min-h-screen" : "bg-white text-black"} p-6`}>
            <h1 className="text-2xl font-bold mb-4">Night Audit</h1>
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="border p-2 rounded text-black">
                    <option value="">-- Select Property --</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} className="border p-2 rounded text-black" />
                <button onClick={() => fetchAuditData(selectedProperty, auditDate)} className="bg-gray-600 text-white px-4 py-2 rounded">Fetch Data</button>
                <button onClick={runAudit} disabled={running || !canRunAudit} className={`px-4 py-2 rounded ${running ? "bg-blue-400" : "bg-blue-600 text-white"}`}>{running ? "Running..." : "Run Night Audit"}</button>
                {canExport && (
                    <>
                        <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
                        <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded">Export CSV</button>
                        <button onClick={printAudit} className="bg-blue-500 text-white px-4 py-2 rounded">Print</button>
                    </>
                )}
            </div>

            {error && <div className="text-red-400 mb-4">{error}</div>}

            <div className="space-y-4">
                {bookings.length === 0 ? <div>No bookings found for the selected date.</div> : bookings.map(b => {
                    const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");

                    const subtotal = b.folio?.subtotal ?? 0;
                    const taxTotal = b.folio?.taxTotal ?? 0;
                    const totalCharges = b.folio?.totalCharges ?? 0;
                    const totalPayments = b.folio?.totalPayments ?? 0;
                    const balance = b.folio?.balance ?? 0;

                    return (
                        <div key={b.id} className={`${darkMode ? "bg-gray-800 text-white" : "bg-gray-100"} p-4 rounded shadow`}>
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="font-semibold">Room: {b.room?.number || "-"}</div>
                                    <div className="text-sm">
                                        Guest: {guestName} • Status: {b.status} • RoomType: {b.room?.roomType?.name || "-"} • Nights: {b.nights || 1} • Company: {b.company?.name || "-"}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">Balance: {balance.toFixed(2)}</div>
                                    <div className="text-sm">Folio ID: {b.folio?.id || "-"}</div>
                                </div>
                            </div>

                            <div className="text-sm mt-2">
                                <p>Subtotal: {subtotal.toFixed(2)}</p>
                                <p>Tax Total: {taxTotal.toFixed(2)}</p>
                                <p>Total Charges: {totalCharges.toFixed(2)}</p>
                                <p>Total Payments: {totalPayments.toFixed(2)}</p>
                                <p>Balance: {balance.toFixed(2)}</p>
                            </div>

                            {b.folio?.charges?.length > 0 && (
                                <div className="overflow-x-auto mt-2">
                                    <table className="min-w-full text-sm">
                                        <thead className={`${darkMode ? "bg-gray-700" : "bg-white"}`}>
                                            <tr>
                                                <th className="px-2 py-1 text-left">Charge</th>
                                                <th className="px-2 py-1 text-left">Code</th>
                                                <th className="px-2 py-1 text-left">Amount</th>
                                                <th className="px-2 py-1 text-left">Tax</th>
                                                <th className="px-2 py-1 text-left">Total</th>
                                                <th className="px-2 py-1 text-left">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {b.folio.charges.map(c => (
                                                <tr key={c.id} className="border-t">
                                                    <td className="px-2 py-1">{c.description}</td>
                                                    <td className="px-2 py-1">{c.code}</td>
                                                    <td className="px-2 py-1">{Number(c.amount || 0).toFixed(2)}</td>
                                                    <td className="px-2 py-1">{Number(c.tax || 0)}</td>
                                                    <td className="px-2 py-1">{(Number(c.amount || 0) + (Number(c.amount || 0) * Number(c.tax || 0) / 100)).toFixed(2)}</td>
                                                    <td className="px-2 py-1">{new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}






