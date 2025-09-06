
'use client';

import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function NightAuditPage({ initialPropertyId, initialProperties, session, darkMode = false }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const canRunAudit = ["ADMIN", "Manager"].includes(role);
    const canExport = ["ADMIN", "Manager"].includes(role);
    const canView = ["ADMIN", "Manager"].includes(role);

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

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text(`Night Audit Report - ${auditDate}`, 14, 12);

        if (summary) {
            doc.setFontSize(10);
            doc.text(`Rooms Sold: ${summary.roomsSold}   Occupancy: ${summary.occupancy}%   ADR: ${summary.adr}   RevPAR: ${summary.revpar}`, 14, 20);
            if (summary.revenueBreakdown) {
                doc.text(`Revenue Breakdown: Room: ${summary.revenueBreakdown.roomRevenue} | Extras: ${summary.revenueBreakdown.extrasRevenue} | Taxes: ${summary.revenueBreakdown.taxes} | Adjustments: ${summary.revenueBreakdown.adjustments}`, 14, 26);
            }
        }

        let cursorY = 34;
        for (const b of bookings) {
            if (cursorY > 260) { doc.addPage(); cursorY = 14; }

            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            doc.setFontSize(11);
            doc.text(`Room: ${b.room?.number || "-"}  Guest: ${guestName}  Status: ${b.status}  Type: ${b.room?.roomType?.name || "-"}  Nights: ${b.nights || 1}`, 14, cursorY);
            cursorY += 6;

            if (b.folio?.charges?.length > 0) {
                const rows = b.folio.charges.map(c => [
                    c.description,
                    c.code || "",
                    c.amount,
                    c.tax,
                    Number(c.amount || 0) + Number(c.tax || 0),
                    new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()
                ]);

                autoTable(doc, {
                    startY: cursorY,
                    head: [["Charge", "Code", "Amount", "Tax", "Total", "Time"]],
                    body: rows,
                    styles: { fontSize: 9 },
                    theme: "grid",
                    headStyles: { fillColor: [220, 220, 220] }
                });

                cursorY = (doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : cursorY + 30);
            } else {
                doc.text("No charges for this booking.", 14, cursorY);
                cursorY += 6;
            }
        }

        doc.save(`NightAudit_${auditDate}.pdf`);
    };

    const exportCSV = () => {
        if (!bookings || bookings.length === 0) return;
        const rows = [["Room", "Guest", "Status", "RoomType", "Nights", "Charge", "Code", "Amount", "Tax", "Total", "Time"]];
        bookings.forEach(b => {
            const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
            (b.folio?.charges || []).forEach(c => {
                const total = Number(c.amount || 0) + Number(c.tax || 0);
                rows.push([b.room?.number || "-", guestName, b.status, b.room?.roomType?.name || "-", b.nights || 1, c.description, c.code || "", c.amount, c.tax, total, new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()]);
            });
        });
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `NightAudit_${auditDate}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        if (!canExport) return alert("You do not have permission to print reports.");
        window.print();
    };

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
                <button onClick={exportPDF} className="bg-green-600 text-white px-3 py-2 rounded" disabled={!canExport}>Export PDF</button>
                <button onClick={exportCSV} className="bg-yellow-500 px-3 py-2 rounded" disabled={!canExport}>Export CSV</button>
                <button onClick={handlePrint} className="bg-gray-700 text-white px-3 py-2 rounded" disabled={!canExport}>Print</button>
            </div>

            {error && <div className="text-red-400 mb-4">{error}</div>}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded shadow bg-blue-100 dark:bg-blue-900"><div className="text-sm">Rooms Sold</div><div className="text-xl font-bold">{summary.roomsSold}</div></div>
                    <div className="p-3 rounded shadow bg-green-100 dark:bg-green-900"><div className="text-sm">Occupancy</div><div className="text-xl font-bold">{summary.occupancy}%</div></div>
                    <div className="p-3 rounded shadow bg-yellow-100 dark:bg-yellow-800"><div className="text-sm">ADR</div><div className="text-xl font-bold">{summary.adr}</div></div>
                    <div className="p-3 rounded shadow bg-purple-100 dark:bg-purple-900"><div className="text-sm">RevPAR</div><div className="text-xl font-bold">{summary.revpar}</div></div>
                    {summary.revenueBreakdown && <div className="col-span-2 p-3 rounded shadow bg-gray-100 dark:bg-gray-700"><div className="text-sm font-semibold">Revenue Breakdown</div>
                        <div className="text-xs">Room: {summary.revenueBreakdown.roomRevenue} • Extras: {summary.revenueBreakdown.extrasRevenue} • Taxes: {summary.revenueBreakdown.taxes} • Adjustments: {summary.revenueBreakdown.adjustments}</div>
                    </div>}
                </div>
            )}

            <div className="space-y-4">
                {bookings.length === 0 ? <div>No bookings found for the selected date.</div> : bookings.map(b => {
                    const guestName = b.guest?.firstName ? `${b.guest.firstName} ${b.guest.lastName || ""}` : (b.guest?.name || "-");
                    const total = (b.folio?.charges || []).reduce((s, c) => s + Number(c.amount || 0) + Number(c.tax || 0), 0);
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
                                    <div className="font-semibold">Total: {total}</div>
                                    <div className="text-sm">Folio ID: {b.folio?.id || "-"}</div>
                                </div>
                            </div>
                            {b.folio?.charges?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
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
                                                    <td className="px-2 py-1">{c.amount}</td>
                                                    <td className="px-2 py-1">{c.tax}</td>
                                                    <td className="px-2 py-1">{Number(c.amount || 0) + Number(c.tax || 0)}</td>
                                                    <td className="px-2 py-1">{new Date(c.postedAt || c.createdAt || Date.now()).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <div>No charges for this booking.</div>}
                        </div>
                    );
                })}
            </div>

            <h2 className="text-xl mt-6 mb-2">Timeline (Realtime)</h2>
            <ul className="space-y-2">
                {logs.map((l, i) => (
                    <li key={i} className={`${getStepColor(l.step || l.event)} border p-2 rounded`}>
                        <div className="text-sm font-semibold">{l.step || l.event || l.message}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : new Date(l.createdAt || Date.now()).toLocaleTimeString()}</div>
                        {l.data && <pre className="mt-2 text-xs overflow-x-auto">{JSON.stringify(l.data, null, 2)}</pre>}
                    </li>
                ))}
            </ul>
        </div>
    );
}