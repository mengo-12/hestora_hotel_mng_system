'use client';
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage({ userProperties, session }) {
    const userRole = session.user.role;
    const [reportType, setReportType] = useState("Booking");
    const [propertyId, setPropertyId] = useState(userRole === "FrontDesk" && userProperties.length === 1 ? userProperties[0].id : "");
    const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const [properties, setProperties] = useState(userProperties || []);
    const [reports, setReports] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const [sortField, setSortField] = useState("");
    const [sortDir, setSortDir] = useState("asc");

    const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

    // جلب التقارير
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    type: reportType,
                    propertyId,
                    from: fromDate,
                    to: toDate,
                    search: searchTerm,
                    page,
                    limit,
                });

                const res = await fetch(`/api/reports?${params.toString()}`);
                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { reports: [], totalPages: 1 };
                }

                setReports(Array.isArray(data.reports) ? data.reports : []);
                setTotalPages(Number(data.totalPages) || 1);
            } catch (err) {
                console.error("Failed to fetch reports:", err);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [reportType, propertyId, fromDate, toDate, searchTerm, page, limit]);

    const getFolioTotals = (r) => {
        const totalCharges = (r.charges || []).reduce((s, c) => s + num(c.amount) + num(c.tax || 0), 0);
        const totalPayments = (r.payments || []).reduce((s, p) => s + num(p.amount), 0);
        return { totalCharges, totalPayments, balance: totalCharges - totalPayments };
    };

    const getComparableValue = (row, field) => {
        switch (reportType) {
            case "Booking":
                if (field === "id") return row.id || "";
                if (field === "guestName") return `${row.guest?.firstName || ""} ${row.guest?.lastName || ""}`.trim();
                if (field === "property") return row.property?.name || "";
                if (field === "room") return row.room?.number || "";
                if (field === "checkIn") return row.checkIn || "";
                if (field === "checkOut") return row.checkOut || "";
                if (field === "status") return row.status || "";
                if (field === "adults") return row.adults ?? 0;
                if (field === "children") return row.children ?? 0;
                if (field === "ratePlan") return row.ratePlan?.name || "";
                if (field === "company") return row.company?.name || "";
                if (field === "createdAt") return row.createdAt || "";
                return "";
            case "Folio": {
                if (field === "id") return row.id || "";
                if (field === "bookingId") return row.bookingId || "";
                if (field === "guestName") return `${row.guest?.firstName || ""} ${row.guest?.lastName || ""}`.trim();
                if (field === "status") return row.status || "";
                if (field === "totalCharges") return (row.charges || []).reduce((s, c) => s + num(c.amount), 0);
                if (field === "totalPayments") return (row.payments || []).reduce((s, p) => s + num(p.amount), 0);
                if (field === "balance") {
                    const ch = (row.charges || []).reduce((s, c) => s + num(c.amount), 0);
                    const pm = (row.payments || []).reduce((s, p) => s + num(p.amount), 0);
                    return ch - pm;
                }
                if (field === "createdAt") return row.createdAt || "";
                return "";
            }
            case "Payment":
                if (field === "id") return row.id || "";
                if (field === "folioId") return row.folio?.id || row.folioId || "";
                if (field === "guestName") return `${row.folio?.guest?.firstName || ""} ${row.folio?.guest?.lastName || ""}`.trim();
                if (field === "amount") return num(row.amount);
                if (field === "method") return row.method || "";
                if (field === "ref") return row.ref || "";
                if (field === "postedAt") return row.postedAt || "";
                return "";
            case "Housekeeping":
                if (field === "id") return row.id || "";
                if (field === "room") return row.room?.number || "";
                if (field === "type") return row.type || "";
                if (field === "priority") return row.priority || "";
                if (field === "status") return row.status || "";
                if (field === "assignedTo") return row.assignedTo?.name || "";
                if (field === "createdAt") return row.createdAt || "";
                return "";
            case "Extra":
                if (field === "id") return row.id || "";
                if (field === "bookingId") return row.bookingId || "";
                if (field === "guestName") return `${row.guest?.firstName || ""} ${row.guest?.lastName || ""}`.trim();
                if (field === "name") return row.name || "";
                if (field === "unitPrice") return num(row.unitPrice);
                if (field === "quantity") return row.quantity ?? 0;
                if (field === "tax") return num(row.tax);
                if (field === "status") return row.status || "";
                if (field === "createdAt") return row.createdAt || "";
                return "";
            default: return "";
        }
    };

    const sortedReports = useMemo(() => {
        if (!sortField) return reports;
        return [...reports].sort((a, b) => {
            const va = getComparableValue(a, sortField);
            const vb = getComparableValue(b, sortField);
            if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
            const sa = String(va).toLowerCase();
            const sb = String(vb).toLowerCase();
            return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
        });
    }, [reports, sortField, sortDir]);

    const handleSort = (field) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const chartData = useMemo(() => {
        const map = new Map();
        if (reportType === "Booking" || reportType === "Housekeeping") {
            for (const r of reports) map.set(r.status || "Unknown", (map.get(r.status || "Unknown") || 0) + 1);
        } else if (reportType === "Payment") {
            for (const r of reports) map.set(r.method || "Unknown", (map.get(r.method || "Unknown") || 0) + num(r.amount));
        } else if (reportType === "Folio") {
            let totalC = 0, totalP = 0;
            for (const r of reports) {
                totalC += (r.charges || []).reduce((s, c) => s + num(c.amount), 0);
                totalP += (r.payments || []).reduce((s, p) => s + num(p.amount), 0);
            }
            return [
                { name: "Charges", value: totalC },
                { name: "Payments", value: totalP },
                { name: "Balance", value: totalC - totalP },
            ];
        } else if (reportType === "Extra") {
            for (const r of reports) {
                const total = num(r.unitPrice) * (r.quantity ?? 1) + num(r.tax);
                map.set(r.name || "Extra", (map.get(r.name || "Extra") || 0) + total);
            }
        }
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [reports, reportType]);

    // جدول للتصدير والطباعة
    const getTableForExport = () => {
        if (reportType === "Booking") {
            const headers = ["ID", "Guest", "Property", "Room", "CheckIn", "CheckOut", "Status", "Adults", "Children", "RatePlan", "Company", "CreatedAt"];
            const rows = reports.map((r) => [
                r.id,
                `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.trim(),
                r.property?.name || "",
                r.room?.number || "-",
                r.checkIn ? new Date(r.checkIn).toLocaleString() : "",
                r.checkOut ? new Date(r.checkOut).toLocaleString() : "",
                r.status || "",
                r.adults ?? 0,
                r.children ?? 0,
                r.ratePlan?.name || "",
                r.company?.name || "",
                r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
            ]);
            return { headers, rows };
        }
        if (reportType === "Folio") {
            const headers = ["ID", "BookingId", "Guest", "Status", "Total Charges", "Total Payments", "Balance", "CreatedAt"];
            const rows = reports.map(r => {
                const { totalCharges, totalPayments, balance } = getFolioTotals(r);
                return [
                    r.id,
                    r.bookingId || "",
                    `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.trim(),
                    r.status || "",
                    totalCharges.toFixed(2),
                    totalPayments.toFixed(2),
                    balance.toFixed(2),
                    r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
                ];
            });
            return { headers, rows };
        }
        if (reportType === "Payment") {
            const headers = ["ID", "FolioId", "Guest", "Amount", "Method", "Ref", "PostedAt"];
            const rows = reports.map((r) => [
                r.id,
                r.folio?.id || r.folioId || "",
                `${r.folio?.guest?.firstName || ""} ${r.folio?.guest?.lastName || ""}`.trim(),
                num(r.amount).toFixed(2),
                r.method || "",
                r.ref || "",
                r.postedAt ? new Date(r.postedAt).toLocaleString() : "",
            ]);
            return { headers, rows };
        }
        if (reportType === "Housekeeping") {
            const headers = ["ID", "Room", "Type", "Priority", "Status", "AssignedTo", "CreatedAt"];
            const rows = reports.map((r) => [
                r.id,
                r.room?.number || "",
                r.type || "",
                r.priority || "-",
                r.status || "",
                r.assignedTo?.name || "-",
                r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
            ]);
            return { headers, rows };
        }
        // Extra
        const headers = ["ID", "BookingId", "Guest", "Name", "UnitPrice", "Quantity", "Tax", "Status", "CreatedAt"];
        const rows = reports.map((r) => [
            r.id,
            r.bookingId || "",
            `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.trim(),
            r.name || "",
            num(r.unitPrice).toFixed(2),
            r.quantity ?? 1,
            num(r.tax).toFixed(2),
            r.status || "",
            r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
        ]);
        return { headers, rows };
    };

    const downloadCSV = () => {
        const { headers, rows } = getTableForExport();
        const escape = (val) => {
            if (val == null) return "";
            const s = String(val);
            if (s.includes('"') || s.includes(",") || s.includes("\n")) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reports_${reportType.toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const printTable = () => {
        const { headers, rows } = getTableForExport();
        const htmlRows = rows
            .map((row) => `<tr>${row.map((c) => `<td style="border:1px solid #ddd;padding:6px;">${c ?? ""}</td>`).join("")}</tr>`)
            .join("");
        const html = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Print - ${reportType}</title>
                    <style>
                        body {font - family: sans-serif; padding: 16px; }
                        table {border - collapse: collapse; width: 100%; }
                        th, td {border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                        th {background: #f3f4f6; text-align:left; }
                    </style>
                </head>
                <body>
                    <h3>Reports - ${reportType}</h3>
                    <table>
                        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                    <script>window.print();</script>
                </body>
            </html>`;
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.open();
        w.document.write(html);
        w.document.close();
    };

    function SortHeader({ field, children }) {
        const isActive = sortField === field;
        const arrow = isActive ? (sortDir === "asc" ? " ↑" : " ↓") : "";
        return (
            <th className="p-2 border cursor-pointer select-none text-left" onClick={() => handleSort(field)}>
                {children}{arrow}
            </th>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">📊 لوحة التقارير</h1>

            {/* الفلاتر + أزرار التصدير */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <select value={reportType} onChange={e => { setReportType(e.target.value); setPage(1); }} className="px-3 py-2 border rounded">
                    <option value="Booking">الحجوزات</option>
                    <option value="Folio">الحسابات (Folios)</option>
                    <option value="Payment">المدفوعات</option>
                    <option value="Housekeeping">التدبير الفندقي</option>
                    <option value="Extra">الخدمات الإضافية</option>
                </select>

                <select
                    value={propertyId}
                    onChange={e => { setPropertyId(e.target.value); setPage(1); }}
                    className="px-3 py-2 border rounded"
                    disabled={userRole === "FrontDesk" && properties.length === 1}
                >
                    <option value="">كل الفنادق</option>
                    {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    <label>من</label>
                    <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="px-3 py-2 border rounded" />
                    <label>إلى</label>
                    <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="px-3 py-2 border rounded" />
                </div>

                {/* باقي الفلاتر + أزرار التصدير */}
                <div className="ml-auto flex gap-2">
                    <button onClick={downloadCSV} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">تصدير CSV</button>
                    <button onClick={printTable} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">طباعة / PDF</button>
                </div>
            </div>

            {/* ملخص الرسوم البيانية */}
            {chartData.length > 0 && (
                <div className="w-full h-72 mb-6 border rounded-lg shadow p-2 bg-white">
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {/* جدول البيانات */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr>
                            {reportType === "Booking" && (
                                <>
                                    <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                    <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
                                    <SortHeader field="property" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Property</SortHeader>
                                    <SortHeader field="room" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Room</SortHeader>
                                    <SortHeader field="checkIn" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CheckIn</SortHeader>
                                    <SortHeader field="checkOut" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CheckOut</SortHeader>
                                    <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
                                    <SortHeader field="adults" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Adults</SortHeader>
                                    <SortHeader field="children" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Children</SortHeader>
                                    <SortHeader field="ratePlan" sortField={sortField} sortDir={sortDir} onSort={handleSort}>RatePlan</SortHeader>
                                    <SortHeader field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Company</SortHeader>
                                    <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
                                </>
                            )}

                            {reportType === "Folio" && (
                                <>
                                    <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                    <SortHeader field="bookingId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Booking</SortHeader>
                                    <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
                                    <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
                                    <SortHeader field="totalCharges" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Total Charges</SortHeader>
                                    <SortHeader field="totalPayments" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Total Payments</SortHeader>
                                    <SortHeader field="balance" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Balance</SortHeader>
                                    <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
                                </>
                            )}

                            {reportType === "Payment" && (
                                <>
                                    <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                    <SortHeader field="folioId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Folio</SortHeader>
                                    <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
                                    <SortHeader field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Amount</SortHeader>
                                    <SortHeader field="method" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Method</SortHeader>
                                    <SortHeader field="ref" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Ref</SortHeader>
                                    <SortHeader field="postedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>PostedAt</SortHeader>
                                </>
                            )}

                            {reportType === "Housekeeping" && (
                                <>
                                    <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                    <SortHeader field="room" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Room</SortHeader>
                                    <SortHeader field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Type</SortHeader>
                                    <SortHeader field="priority" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Priority</SortHeader>
                                    <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
                                    <SortHeader field="assignedTo" sortField={sortField} sortDir={sortDir} onSort={handleSort}>AssignedTo</SortHeader>
                                    <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
                                </>
                            )}

                            {reportType === "Extra" && (
                                <>
                                    <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                    <SortHeader field="bookingId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Booking</SortHeader>
                                    <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
                                    <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Name</SortHeader>
                                    <SortHeader field="unitPrice" sortField={sortField} sortDir={sortDir} onSort={handleSort}>UnitPrice</SortHeader>
                                    <SortHeader field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Quantity</SortHeader>
                                    <SortHeader field="tax" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Tax</SortHeader>
                                    <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
                                    <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
                                </>
                            )}
                        </tr>
                    </thead>


                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={12} className="text-center p-6">
                                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
                                </td>
                            </tr>
                        ) : sortedReports.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="text-center p-4">لا توجد بيانات</td>
                            </tr>
                        ) : (
                            sortedReports.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    {reportType === "Booking" && (
                                        <>
                                            <td className="p-2 border">{r.id}</td>
                                            <td className="p-2 border">{r.guest?.firstName} {r.guest?.lastName}</td>
                                            <td className="p-2 border">{r.property?.name}</td>
                                            <td className="p-2 border">{r.room?.number || "-"}</td>
                                            <td className="p-2 border">{r.checkIn ? new Date(r.checkIn).toLocaleString() : ""}</td>
                                            <td className="p-2 border">{r.checkOut ? new Date(r.checkOut).toLocaleString() : ""}</td>
                                            <td className="p-2 border">{r.status}</td>
                                            <td className="p-2 border">{r.adults ?? 0}</td>
                                            <td className="p-2 border">{r.children ?? 0}</td>
                                            <td className="p-2 border">{r.ratePlan?.name || ""}</td>
                                            <td className="p-2 border">{r.company?.name || ""}</td>
                                            <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                        </>
                                    )}

                                    {reportType === "Folio" && (
                                        <>
                                            <td className="p-2 border">{r.id}</td>
                                            <td className="p-2 border">{r.bookingId || ""}</td>
                                            <td className="p-2 border">{r.guest?.firstName} {r.guest?.lastName}</td>
                                            <td className="p-2 border">{r.status || ""}</td>
                                            <td className="p-2 border">
                                                {(r.charges || []).reduce((sum, c) => sum + num(c.amount) + num(c.tax || 0), 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 border">
                                                {(r.payments || []).reduce((sum, p) => sum + num(p.amount), 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 border">
                                                {(
                                                    (r.charges || []).reduce((sum, c) => sum + num(c.amount) + num(c.tax || 0), 0) -
                                                    (r.payments || []).reduce((sum, p) => sum + num(p.amount), 0)
                                                ).toFixed(2)}
                                            </td>
                                            <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                        </>
                                    )}

                                    {reportType === "Payment" && (
                                        <>
                                            <td className="p-2 border">{r.id}</td>
                                            <td className="p-2 border">{r.folio?.id || r.folioId || ""}</td>
                                            <td className="p-2 border">{r.folio?.guest?.firstName} {r.folio?.guest?.lastName}</td>
                                            <td className="p-2 border">{num(r.amount).toFixed(2)}</td>
                                            <td className="p-2 border">{r.method}</td>
                                            <td className="p-2 border">{r.ref || ""}</td>
                                            <td className="p-2 border">{r.postedAt ? new Date(r.postedAt).toLocaleString() : ""}</td>
                                        </>
                                    )}

                                    {reportType === "Housekeeping" && (
                                        <>
                                            <td className="p-2 border">{r.id}</td>
                                            <td className="p-2 border">{r.room?.number}</td>
                                            <td className="p-2 border">{r.type}</td>
                                            <td className="p-2 border">{r.priority || "-"}</td>
                                            <td className="p-2 border">{r.status}</td>
                                            <td className="p-2 border">{r.assignedTo?.name || "-"}</td>
                                            <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                        </>
                                    )}

                                    {reportType === "Extra" && (
                                        <>
                                            <td className="p-2 border">{r.id}</td>
                                            <td className="p-2 border">{r.bookingId || ""}</td>
                                            <td className="p-2 border">{r.guest?.firstName} {r.guest?.lastName}</td>
                                            <td className="p-2 border">{r.name}</td>
                                            <td className="p-2 border">{num(r.unitPrice).toFixed(2)}</td>
                                            <td className="p-2 border">{r.quantity ?? 1}</td>
                                            <td className="p-2 border">{num(r.tax).toFixed(2)}</td>
                                            <td className="p-2 border">{r.status}</td>
                                            <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* الباجينيشن */}
            <div className="flex justify-center gap-2 mt-4">
                <button disabled={page <= 1} onClick={() => setPage(1)} className="px-3 py-1 border rounded">⏮ الأول</button>
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">◀ السابق</button>
                <span className="px-3 py-1 border rounded">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded">التالي ▶</button>
                <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1 border rounded">الأخير ⏭</button>
            </div>
        </div>
    );
}

