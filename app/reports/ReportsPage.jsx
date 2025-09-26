// 'use client';
// import { useEffect, useMemo, useState } from "react";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// export default function ReportsPage({ userProperties, session }) {
//     const userRole = session.user.role;
//     const [reportType, setReportType] = useState("Booking");
//     const [propertyId, setPropertyId] = useState(userRole === "FrontDesk" && userProperties.length === 1 ? userProperties[0].id : "");
//     const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
//     const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [page, setPage] = useState(1);
//     const [limit, setLimit] = useState(20);

//     const [properties, setProperties] = useState(userProperties || []);
//     const [reports, setReports] = useState([]);
//     const [totalPages, setTotalPages] = useState(1);
//     const [loading, setLoading] = useState(false);

//     const [sortField, setSortField] = useState("");
//     const [sortDir, setSortDir] = useState("asc");

//     const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

//     // 🟢 تحديد أنواع التقارير حسب الصلاحية
//     const allowedReportTypes = useMemo(() => {
//         if (userRole === "Admin") return ["Booking", "Folio", "Payment", "Housekeeping", "Extra", "Group", "RoomBlock", "Company"];
//         if (userRole === "Manager") return ["Booking", "Folio", "Payment", "Housekeeping", "Group", "RoomBlock"];
//         if (userRole === "FrontDesk") return ["Booking", "Folio", "Payment", "Group"];
//         return [];
//     }, [userRole]);

//     // إذا المستخدم ما عنده صلاحيات
//     if (allowedReportTypes.length === 0) {
//         return (
//             <div className="p-6 text-center">
//                 🚫 لا تملك صلاحية للوصول إلى التقارير
//             </div>
//         );
//     }

//     // جلب التقارير
//     useEffect(() => {
//         const fetchReports = async () => {
//             setLoading(true);
//             try {
//                 const params = new URLSearchParams({
//                     type: reportType,
//                     propertyId,
//                     from: fromDate,
//                     to: toDate,
//                     search: searchTerm,
//                     page,
//                     limit,
//                 });

//                 const res = await fetch(`/api/reports?${params.toString()}`);
//                 const text = await res.text();
//                 let data;
//                 try {
//                     data = JSON.parse(text);
//                 } catch {
//                     data = { reports: [], totalPages: 1 };
//                 }

//                 setReports(Array.isArray(data.reports) ? data.reports : []);
//                 setTotalPages(Number(data.totalPages) || 1);
//             } catch (err) {
//                 console.error("Failed to fetch reports:", err);
//                 setReports([]);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchReports();
//     }, [reportType, propertyId, fromDate, toDate, searchTerm, page, limit]);

// const getFolioTotals = (r) => {
//     const totalCharges = (r.charges || []).reduce((s, c) => s + num(c.amount) + num(c.tax || 0), 0);
//     const totalPayments = (r.payments || []).reduce((s, p) => s + num(p.amount), 0);
//     return { totalCharges, totalPayments, balance: totalCharges - totalPayments };
// };

// const getComparableValue = (row, field) => {
//     switch (reportType) {
//         case "Booking":
//             if (field === "id") return row.id || "";
//             if (field === "guestName") return `${row.guest?.firstName || ""} ${row.guest?.lastName || ""}`.trim();
//             if (field === "property") return row.property?.name || "";
//             if (field === "room") return row.room?.number || "";
//             if (field === "checkIn") return row.checkIn || "";
//             if (field === "checkOut") return row.checkOut || "";
//             if (field === "status") return row.status || "";
//             if (field === "adults") return row.adults ?? 0;
//             if (field === "children") return row.children ?? 0;
//             if (field === "ratePlan") return row.ratePlan?.name || "";
//             if (field === "company") return row.company?.name || "";
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         case "Folio": {
//             if (field === "id") return row.id || "";
//             if (field === "bookingId") return row.bookingId || "";
//             if (field === "guestName") return `${row.guest?.firstName || ""} ${row.guest?.lastName || ""}`.trim();
//             if (field === "status") return row.status || "";
//             if (field === "totalCharges") return (row.charges || []).reduce((s, c) => s + num(c.amount), 0);
//             if (field === "totalPayments") return (row.payments || []).reduce((s, p) => s + num(p.amount), 0);
//             if (field === "balance") {
//                 const ch = (row.charges || []).reduce((s, c) => s + num(c.amount), 0);
//                 const pm = (row.payments || []).reduce((s, p) => s + num(p.amount), 0);
//                 return ch - pm;
//             }
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         }
//         case "Payment":
//             if (field === "id") return row.id || "";
//             if (field === "folioId") return row.folio?.id || row.folioId || "";
//             if (field === "guestName") return `${row.folio?.guest?.firstName || ""} ${row.folio?.guest?.lastName || ""}`.trim();
//             if (field === "amount") return num(row.amount);
//             if (field === "method") return row.method || "";
//             if (field === "ref") return row.ref || "";
//             if (field === "postedAt") return row.postedAt || "";
//             return "";
//         case "Housekeeping":
//             if (field === "id") return row.id || "";
//             if (field === "room") return row.room?.number || "";
//             if (field === "type") return row.type || "";
//             if (field === "priority") return row.priority || "";
//             if (field === "status") return row.status || "";
//             if (field === "assignedTo") return row.assignedTo?.name || "";
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         case "Extra":
//             if (field === "id") return row.id || "";
//             if (field === "bookingId") return row.bookingId || "";
//             if (field === "guestName") return `${row.guest?.firstName || ""} ${row.guest?.lastName || ""}`.trim();
//             if (field === "name") return row.name || "";
//             if (field === "unitPrice") return num(row.unitPrice);
//             if (field === "quantity") return row.quantity ?? 0;
//             if (field === "tax") return num(row.tax);
//             if (field === "status") return row.status || "";
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         case "Group":
//             if (field === "id") return row.id || "";
//             if (field === "name") return row.name || "";
//             if (field === "company") return row.company?.name || "";
//             if (field === "leader") return `${row.leader?.firstName || ""} ${row.leader?.lastName || ""}`;
//             if (field === "status") return row.status || "";
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         case "RoomBlock":
//             if (field === "id") return row.id || "";
//             if (field === "name") return row.name || "";
//             if (field === "property") return row.property?.name || "";
//             if (field === "group") return row.group?.name || "";
//             if (field === "company") return row.company?.name || "";
//             if (field === "status") return row.status || "";
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         case "Company":
//             if (field === "id") return row.id || "";
//             if (field === "name") return row.name || "";
//             if (field === "contact") return row.contactName || "";
//             if (field === "phone") return row.phone || "";
//             if (field === "email") return row.email || "";
//             if (field === "createdAt") return row.createdAt || "";
//             return "";
//         default:
//             return "";
//     }
// };

// const sortedReports = useMemo(() => {

//     if (!sortField) return reports;
//     return [...reports].sort((a, b) => {
//         const va = getComparableValue(a, sortField);
//         const vb = getComparableValue(b, sortField);
//         if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
//         const sa = String(va).toLowerCase();
//         const sb = String(vb).toLowerCase();
//         return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
//     });
// }, [reports, sortField, sortDir]);

// const handleSort = (field) => {
//     if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
//     else { setSortField(field); setSortDir("asc"); }
// };

// const chartData = useMemo(() => {
//     const map = new Map();
//     if (reportType === "Booking" || reportType === "Housekeeping") {
//         for (const r of reports) map.set(r.status || "Unknown", (map.get(r.status || "Unknown") || 0) + 1);
//     } else if (reportType === "Payment") {
//         for (const r of reports) map.set(r.method || "Unknown", (map.get(r.method || "Unknown") || 0) + num(r.amount));
//     } else if (reportType === "Folio") {
//         let totalC = 0, totalP = 0;
//         for (const r of reports) {
//             totalC += (r.charges || []).reduce((s, c) => s + num(c.amount), 0);
//             totalP += (r.payments || []).reduce((s, p) => s + num(p.amount), 0);
//         }
//         return [
//             { name: "Charges", value: totalC },
//             { name: "Payments", value: totalP },
//             { name: "Balance", value: totalC - totalP },
//         ];
//     } else if (reportType === "Extra") {
//         for (const r of reports) {
//             const total = num(r.unitPrice) * (r.quantity ?? 1) + num(r.tax);
//             map.set(r.name || "Extra", (map.get(r.name || "Extra") || 0) + total);
//         }
//     }
//     return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
// }, [reports, reportType]);

// // جدول للتصدير والطباعة
// const getTableForExport = () => {
//     if (reportType === "Booking") {
//         const headers = ["ID", "Guest", "Property", "Room", "CheckIn", "CheckOut", "Status", "Adults", "Children", "RatePlan", "Company", "CreatedAt"];
//         const rows = reports.map((r) => [
//             r.id,
//             `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.trim(),
//             r.property?.name || "",
//             r.room?.number || "-",
//             r.checkIn ? new Date(r.checkIn).toLocaleString() : "",
//             r.checkOut ? new Date(r.checkOut).toLocaleString() : "",
//             r.status || "",
//             r.adults ?? 0,
//             r.children ?? 0,
//             r.ratePlan?.name || "",
//             r.company?.name || "",
//             r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
//         ]);
//         return { headers, rows };
//     }
//     if (reportType === "Folio") {
//         const headers = ["ID", "BookingId", "Guest", "Status", "Total Charges", "Total Payments", "Balance", "CreatedAt"];
//         const rows = reports.map(r => {
//             const { totalCharges, totalPayments, balance } = getFolioTotals(r);
//             return [
//                 r.id,
//                 r.bookingId || "",
//                 `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.trim(),
//                 r.status || "",
//                 totalCharges.toFixed(2),
//                 totalPayments.toFixed(2),
//                 balance.toFixed(2),
//                 r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
//             ];
//         });
//         return { headers, rows };
//     }
//     if (reportType === "Payment") {
//         const headers = ["ID", "FolioId", "Guest", "Amount", "Method", "Ref", "PostedAt"];
//         const rows = reports.map((r) => [
//             r.id,
//             r.folio?.id || r.folioId || "",
//             `${r.folio?.guest?.firstName || ""} ${r.folio?.guest?.lastName || ""}`.trim(),
//             num(r.amount).toFixed(2),
//             r.method || "",
//             r.ref || "",
//             r.postedAt ? new Date(r.postedAt).toLocaleString() : "",
//         ]);
//         return { headers, rows };
//     }
//     if (reportType === "Housekeeping") {
//         const headers = ["ID", "Room", "Type", "Priority", "Status", "AssignedTo", "CreatedAt"];
//         const rows = reports.map((r) => [
//             r.id,
//             r.room?.number || "",
//             r.type || "",
//             r.priority || "-",
//             r.status || "",
//             r.assignedTo?.name || "-",
//             r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
//         ]);
//         return { headers, rows };
//     }
//     // Extra
//     const headers = ["ID", "BookingId", "Guest", "Name", "UnitPrice", "Quantity", "Tax", "Status", "CreatedAt"];
//     const rows = reports.map((r) => [
//         r.id,
//         r.bookingId || "",
//         `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.trim(),
//         r.name || "",
//         num(r.unitPrice).toFixed(2),
//         r.quantity ?? 1,
//         num(r.tax).toFixed(2),
//         r.status || "",
//         r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
//     ]);
//     return { headers, rows };
// };

// const downloadCSV = () => {
//     const { headers, rows } = getTableForExport();
//     const escape = (val) => {
//         if (val == null) return "";
//         const s = String(val);
//         if (s.includes('"') || s.includes(",") || s.includes("\n")) {
//             return `"${s.replace(/"/g, '""')}"`;
//         }
//         return s;
//     };
//     const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `reports_${reportType.toLowerCase()}.csv`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
// };

// const printTable = () => {
//     const { headers, rows } = getTableForExport();
//     const htmlRows = rows
//         .map((row) => `<tr>${row.map((c) => `<td style="border:1px solid #ddd;padding:6px;">${c ?? ""}</td>`).join("")}</tr>`)
//         .join("");
//     const html = `
//     <html>
//         <head>
//             <meta charset="utf-8" />
//             <title>Print - ${reportType}</title>
//             <style>
//                 body {font - family: sans-serif; padding: 16px; }
//                 table {border - collapse: collapse; width: 100%; }
//                 th, td {border: 1px solid #ddd; padding: 8px; font-size: 12px; }
//                 th {background: #f3f4f6; text-align:left; }
//             </style>
//         </head>
//         <body>
//             <h3>Reports - ${reportType}</h3>
//             <table>
//                 <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
//                 <tbody>${htmlRows}</tbody>
//             </table>
//             <script>window.print();</script>
//         </body>
//     </html>`;
//     const w = window.open("", "_blank");
//     if (!w) return;
//     w.document.open();
//     w.document.write(html);
//     w.document.close();
// };

// function SortHeader({ field, children }) {
//     const isActive = sortField === field;
//     const arrow = isActive ? (sortDir === "asc" ? " ↑" : " ↓") : "";
//     return (
//         <th className="p-2 border cursor-pointer select-none text-left" onClick={() => handleSort(field)}>
//             {children}{arrow}
//         </th>
//     );
// }

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">📊 لوحة التقارير</h1>

//             {/* الفلاتر + أزرار التصدير */}
//             <div className="flex flex-wrap items-center gap-2 mb-6">
//                 <select
//                     value={reportType}
//                     onChange={e => { setReportType(e.target.value); setPage(1); }}
//                     className="px-3 py-2 border rounded"
//                 >
//                     {allowedReportTypes.includes("Booking") && <option value="Booking">الحجوزات</option>}
//                     {allowedReportTypes.includes("Folio") && <option value="Folio">الحسابات (Folios)</option>}
//                     {allowedReportTypes.includes("Payment") && <option value="Payment">المدفوعات</option>}
//                     {allowedReportTypes.includes("Housekeeping") && <option value="Housekeeping">التدبير الفندقي</option>}
//                     {allowedReportTypes.includes("Extra") && <option value="Extra">الخدمات الإضافية</option>}
//                     {allowedReportTypes.includes("Group") && <option value="Group">المجموعات</option>}
//                     {allowedReportTypes.includes("RoomBlock") && <option value="RoomBlock">بلوك الغرف</option>}
//                     {allowedReportTypes.includes("Company") && <option value="Company">الشركات</option>}
//                 </select>

//                 <select
//                     value={propertyId}
//                     onChange={e => { setPropertyId(e.target.value); setPage(1); }}
//                     className="px-3 py-2 border rounded"
//                     disabled={userRole === "FrontDesk" || (userRole === "Manager" && userProperties.length === 1)}
//                 >
//                     <option value="">كل الفنادق</option>
//                     {userProperties.map(p => (
//                         <option key={p.id} value={p.id}>{p.name}</option>
//                     ))}
//                 </select>

//                 <div className="flex items-center gap-2">
//                     <label>من</label>
//                     <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="px-3 py-2 border rounded" />
//                     <label>إلى</label>
//                     <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="px-3 py-2 border rounded" />
//                 </div>

//                 {/* باقي الفلاتر + أزرار التصدير */}
//                 <div className="ml-auto flex gap-2">
//                     <button onClick={downloadCSV} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">تصدير CSV</button>
//                     <button onClick={printTable} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">طباعة / PDF</button>
//                 </div>
//             </div>

//             {/* ملخص الرسوم البيانية */}
//             {chartData.length > 0 && (
//                 <div className="w-full h-72 mb-6 border rounded-lg shadow p-2 bg-white">
//                     <ResponsiveContainer>
//                         <BarChart data={chartData}>
//                             <XAxis dataKey="name" />
//                             <YAxis />
//                             <Tooltip />
//                             <Bar dataKey="value" />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>
//             )}
//             {/* جدول البيانات */}
//             <div className="overflow-x-auto border rounded-lg">
//                 <table className="min-w-full text-sm">
//                     <thead>
//                         <tr>
// {reportType === "Booking" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
//         <SortHeader field="property" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Property</SortHeader>
//         <SortHeader field="room" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Room</SortHeader>
//         <SortHeader field="checkIn" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CheckIn</SortHeader>
//         <SortHeader field="checkOut" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CheckOut</SortHeader>
//         <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
//         <SortHeader field="adults" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Adults</SortHeader>
//         <SortHeader field="children" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Children</SortHeader>
//         <SortHeader field="ratePlan" sortField={sortField} sortDir={sortDir} onSort={handleSort}>RatePlan</SortHeader>
//         <SortHeader field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Company</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
//     </>
// )}

// {reportType === "Folio" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="bookingId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Booking</SortHeader>
//         <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
//         <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
//         <SortHeader field="totalCharges" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Total Charges</SortHeader>
//         <SortHeader field="totalPayments" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Total Payments</SortHeader>
//         <SortHeader field="balance" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Balance</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
//     </>
// )}

// {reportType === "Payment" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="folioId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Folio</SortHeader>
//         <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
//         <SortHeader field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Amount</SortHeader>
//         <SortHeader field="method" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Method</SortHeader>
//         <SortHeader field="ref" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Ref</SortHeader>
//         <SortHeader field="postedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>PostedAt</SortHeader>
//     </>
// )}

// {reportType === "Housekeeping" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="room" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Room</SortHeader>
//         <SortHeader field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Type</SortHeader>
//         <SortHeader field="priority" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Priority</SortHeader>
//         <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
//         <SortHeader field="assignedTo" sortField={sortField} sortDir={sortDir} onSort={handleSort}>AssignedTo</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
//     </>
// )}

// {reportType === "Extra" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="bookingId" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Booking</SortHeader>
//         <SortHeader field="guestName" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Guest</SortHeader>
//         <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Name</SortHeader>
//         <SortHeader field="unitPrice" sortField={sortField} sortDir={sortDir} onSort={handleSort}>UnitPrice</SortHeader>
//         <SortHeader field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Quantity</SortHeader>
//         <SortHeader field="tax" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Tax</SortHeader>
//         <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>CreatedAt</SortHeader>
//     </>
// )}
// {reportType === "Group" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>اسم المجموعة</SortHeader>
//         <SortHeader field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الشركة</SortHeader>
//         <SortHeader field="leader" sortField={sortField} sortDir={sortDir} onSort={handleSort}>القائد</SortHeader>
//         <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الحالة</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>تاريخ الإنشاء</SortHeader>
//     </>
// )}

// {reportType === "RoomBlock" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>اسم البلوك</SortHeader>
//         <SortHeader field="property" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الفندق</SortHeader>
//         <SortHeader field="group" sortField={sortField} sortDir={sortDir} onSort={handleSort}>المجموعة</SortHeader>
//         <SortHeader field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الشركة</SortHeader>
//         <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الحالة</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>تاريخ الإنشاء</SortHeader>
//     </>
// )}

// {reportType === "Company" && (
//     <>
//         <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
//         <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>اسم الشركة</SortHeader>
//         <SortHeader field="contact" sortField={sortField} sortDir={sortDir} onSort={handleSort}>المسؤول</SortHeader>
//         <SortHeader field="phone" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الهاتف</SortHeader>
//         <SortHeader field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort}>البريد</SortHeader>
//         <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>تاريخ الإنشاء</SortHeader>
//     </>
// )}

//                         </tr>
//                     </thead>


//                     <tbody>
// {loading ? (
//     <tr>
//         <td colSpan={12} className="text-center p-6">
//             <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
//         </td>
//     </tr>
// ) : sortedReports.length === 0 ? (
//     <tr>
//         <td colSpan={12} className="text-center p-4">لا توجد بيانات</td>
//     </tr>
// ) : (
//     sortedReports.map((r) => (
//         <tr key={r.id} className="hover:bg-gray-50">
//             {reportType === "Booking" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.guest?.firstName} {r.guest?.lastName}</td>
//                     <td className="p-2 border">{r.property?.name}</td>
//                     <td className="p-2 border">{r.room?.number || "-"}</td>
//                     <td className="p-2 border">{r.checkIn ? new Date(r.checkIn).toLocaleString() : ""}</td>
//                     <td className="p-2 border">{r.checkOut ? new Date(r.checkOut).toLocaleString() : ""}</td>
//                     <td className="p-2 border">{r.status}</td>
//                     <td className="p-2 border">{r.adults ?? 0}</td>
//                     <td className="p-2 border">{r.children ?? 0}</td>
//                     <td className="p-2 border">{r.ratePlan?.name || ""}</td>
//                     <td className="p-2 border">{r.company?.name || ""}</td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
//                 </>
//             )}

//             {reportType === "Folio" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.bookingId || ""}</td>
//                     <td className="p-2 border">{r.guest?.firstName} {r.guest?.lastName}</td>
//                     <td className="p-2 border">{r.status || ""}</td>
//                     <td className="p-2 border">
//                         {(r.charges || []).reduce((sum, c) => sum + num(c.amount) + num(c.tax || 0), 0).toFixed(2)}
//                     </td>
//                     <td className="p-2 border">
//                         {(r.payments || []).reduce((sum, p) => sum + num(p.amount), 0).toFixed(2)}
//                     </td>
//                     <td className="p-2 border">
//                         {(
//                             (r.charges || []).reduce((sum, c) => sum + num(c.amount) + num(c.tax || 0), 0) -
//                             (r.payments || []).reduce((sum, p) => sum + num(p.amount), 0)
//                         ).toFixed(2)}
//                     </td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
//                 </>
//             )}

//             {reportType === "Payment" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.folio?.id || r.folioId || ""}</td>
//                     <td className="p-2 border">{r.folio?.guest?.firstName} {r.folio?.guest?.lastName}</td>
//                     <td className="p-2 border">{num(r.amount).toFixed(2)}</td>
//                     <td className="p-2 border">{r.method}</td>
//                     <td className="p-2 border">{r.ref || ""}</td>
//                     <td className="p-2 border">{r.postedAt ? new Date(r.postedAt).toLocaleString() : ""}</td>
//                 </>
//             )}

//             {reportType === "Housekeeping" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.room?.number}</td>
//                     <td className="p-2 border">{r.type}</td>
//                     <td className="p-2 border">{r.priority || "-"}</td>
//                     <td className="p-2 border">{r.status}</td>
//                     <td className="p-2 border">{r.assignedTo?.name || "-"}</td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
//                 </>
//             )}

//             {reportType === "Extra" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.bookingId || ""}</td>
//                     <td className="p-2 border">{r.guest?.firstName} {r.guest?.lastName}</td>
//                     <td className="p-2 border">{r.name}</td>
//                     <td className="p-2 border">{num(r.unitPrice).toFixed(2)}</td>
//                     <td className="p-2 border">{r.quantity ?? 1}</td>
//                     <td className="p-2 border">{num(r.tax).toFixed(2)}</td>
//                     <td className="p-2 border">{r.status}</td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
//                 </>
//             )}

//             {reportType === "Group" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.name}</td>
//                     <td className="p-2 border">{r.company?.name}</td>
//                     <td className="p-2 border">{r.leader?.firstName} {r.leader?.lastName}</td>
//                     <td className="p-2 border">{r.status}</td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
//                 </>
//             )}

//             {reportType === "RoomBlock" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.name}</td>
//                     <td className="p-2 border">{r.property?.name}</td>
//                     <td className="p-2 border">{r.group?.name}</td>
//                     <td className="p-2 border">{r.company?.name}</td>
//                     <td className="p-2 border">{r.status}</td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
//                 </>
//             )}

//             {reportType === "Company" && (
//                 <>
//                     <td className="p-2 border">{r.id}</td>
//                     <td className="p-2 border">{r.name}</td>
//                     <td className="p-2 border">{r.contactName}</td>
//                     <td className="p-2 border">{r.phone}</td>
//                     <td className="p-2 border">{r.email}</td>
//                     <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
//                 </>
//             )}
//         </tr>
//     ))
// )}
//                     </tbody>
//                 </table>
//             </div>

//             {/* الباجينيشن */}
//             <div className="flex justify-center gap-2 mt-4">
//                 <button disabled={page <= 1} onClick={() => setPage(1)} className="px-3 py-1 border rounded">⏮ الأول</button>
//                 <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">◀ السابق</button>
//                 <span className="px-3 py-1 border rounded">{page} / {totalPages}</span>
//                 <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded">التالي ▶</button>
//                 <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1 border rounded">الأخير ⏭</button>
//             </div>
//         </div>
//     );
// }





'use client';
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LabelList } from "recharts";
import { Download, Printer, Filter, Calendar, Building2, Table } from "lucide-react";

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

    const allowedReportTypes = useMemo(() => {
        if (userRole === "Admin") return ["Booking", "Folio", "Payment", "Housekeeping", "Extra", "Group", "RoomBlock", "Company"];
        if (userRole === "Manager") return ["Booking", "Folio", "Payment", "Housekeeping", "Group", "RoomBlock"];
        if (userRole === "FrontDesk") return ["Booking", "Folio", "Payment", "Group"];
        return [];
    }, [userRole]);

    if (allowedReportTypes.length === 0) {
        return (
            <div className="p-6 text-center text-red-600 font-semibold">
                🚫 لا تملك صلاحية للوصول إلى التقارير
            </div>
        );
    }

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

    const handleSort = (field) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const getFolioTotals = (r) => {
        const totalCharges = (r.charges || []).reduce((s, c) => s + num(c.amount) + num(c.tax || 0), 0);
        const totalPayments = (r.payments || []).reduce((s, p) => s + num(p.amount), 0);
        return { totalCharges, totalPayments, balance: totalCharges - totalPayments };
    };

    function SortHeader({ field, children }) {
        const isActive = sortField === field;
        const arrow = isActive ? (sortDir === "asc" ? " ↑" : " ↓") : "";
        return (
            <th
                className="px-3 py-2 border-b border-gray-200 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort(field)}
            >
                {children}{arrow}
            </th>
        );
    }


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
            case "Group":
                if (field === "id") return row.id || "";
                if (field === "name") return row.name || "";
                if (field === "company") return row.company?.name || "";
                if (field === "leader") return `${row.leader?.firstName || ""} ${row.leader?.lastName || ""}`;
                if (field === "status") return row.status || "";
                if (field === "createdAt") return row.createdAt || "";
                return "";
            case "RoomBlock":
                if (field === "id") return row.id || "";
                if (field === "name") return row.name || "";
                if (field === "property") return row.property?.name || "";
                if (field === "group") return row.group?.name || "";
                if (field === "company") return row.company?.name || "";
                if (field === "status") return row.status || "";
                if (field === "createdAt") return row.createdAt || "";
                return "";
            case "Company":
                if (field === "id") return row.id || "";
                if (field === "name") return row.name || "";
                if (field === "contact") return row.contactName || "";
                if (field === "phone") return row.phone || "";
                if (field === "email") return row.email || "";
                if (field === "createdAt") return row.createdAt || "";
                return "";
            default:
                return "";
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
        <div className="flex flex-col gap-6 mb-6">

            {/* الفلاتر + أزرار التصدير */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                {/* نوع التقرير */}
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <Table size={16} /> نوع التقرير
                    </label>
                    <select
                        value={reportType}
                        onChange={e => { setReportType(e.target.value); setPage(1); }}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        {allowedReportTypes.includes("Booking") && <option value="Booking">الحجوزات</option>}
                        {allowedReportTypes.includes("Folio") && <option value="Folio">الحسابات (Folios)</option>}
                        {allowedReportTypes.includes("Payment") && <option value="Payment">المدفوعات</option>}
                        {allowedReportTypes.includes("Housekeeping") && <option value="Housekeeping">التدبير الفندقي</option>}
                        {allowedReportTypes.includes("Extra") && <option value="Extra">الخدمات الإضافية</option>}
                        {allowedReportTypes.includes("Group") && <option value="Group">المجموعات</option>}
                        {allowedReportTypes.includes("RoomBlock") && <option value="RoomBlock">بلوك الغرف</option>}
                        {allowedReportTypes.includes("Company") && <option value="Company">الشركات</option>}
                    </select>
                </div>

                {/* الفندق */}
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <Building2 size={16} /> الفندق
                    </label>
                    <select
                        value={propertyId}
                        onChange={e => { setPropertyId(e.target.value); setPage(1); }}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={userRole === "FrontDesk" || (userRole === "Manager" && userProperties.length === 1)}
                    >
                        <option value="">كل الفنادق</option>
                        {userProperties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* التاريخ من */}
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <Calendar size={16} /> من
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={e => { setFromDate(e.target.value); setPage(1); }}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* التاريخ إلى */}
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <Calendar size={16} /> إلى
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={e => { setToDate(e.target.value); setPage(1); }}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* الأزرار */}
                <div className="flex w-full md:w-auto gap-2">
                    <button
                        onClick={downloadCSV}
                        className="flex items-center justify-center gap-2 min-w-[140px] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Download size={16} /> تصدير CSV
                    </button>
                    <button
                        onClick={printTable}
                        className="flex items-center justify-center gap-2 min-w-[140px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <Printer size={16} /> طباعة / PDF
                    </button>
                </div>
            </div>


            {/* الرسوم البيانية التفاعلية */}
            {chartData.length > 0 && (
                <div className="w-full h-80 mb-6 p-4 rounded-2xl shadow-lg bg-white dark:bg-gray-900 transition-colors">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                            {/* المحور X */}
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                                stroke="#9CA3AF"
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                            />
                            {/* المحور Y */}
                            <YAxis
                                tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
                                stroke="#9CA3AF"
                            />
                            {/* Tooltip مخصص */}
                            <Tooltip
                                cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
                                contentStyle={{
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '10px',
                                    border: 'none',
                                    padding: '8px 12px',
                                }}
                                itemStyle={{ color: '#111827', fontWeight: 600 }}
                            />
                            {/* Legend تفاعلي */}
                            <Legend
                                verticalAlign="top"
                                align="right"
                                wrapperStyle={{ color: '#374151', fontWeight: 600 }}
                            />
                            {/* الأعمدة */}
                            <Bar
                                dataKey="value"
                                radius={[8, 8, 0, 0]}
                                barSize={40}
                                isAnimationActive={true}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={reportType === "Folio"
                                            ? (entry.name === "Balance" ? "#ef4444"
                                                : entry.name === "Charges" ? "#16a34a"
                                                    : "#3b82f6")
                                            : `hsl(${index * 60}, 70%, 50%)`}
                                    />
                                ))}
                                {/* قيم الأعمدة مباشرة */}
                                {chartData.map((entry, index) => (
                                    <LabelList
                                        key={`label-${index}`}
                                        dataKey="value"
                                        position="top"
                                        formatter={(val) => val.toFixed(2)}
                                        style={{ fill: '#111827', fontWeight: 600 }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}



            {/* جدول البيانات */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        📊 التقارير
                    </h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        {sortedReports.length} Items
                    </span>
                </div>

                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="w-full text-sm">
                        {/* رأس الجدول */}
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
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
                                {reportType === "Group" && (
                                    <>
                                        <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                        <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>اسم المجموعة</SortHeader>
                                        <SortHeader field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الشركة</SortHeader>
                                        <SortHeader field="leader" sortField={sortField} sortDir={sortDir} onSort={handleSort}>القائد</SortHeader>
                                        <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الحالة</SortHeader>
                                        <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>تاريخ الإنشاء</SortHeader>
                                    </>
                                )}

                                {reportType === "RoomBlock" && (
                                    <>
                                        <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                        <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>اسم البلوك</SortHeader>
                                        <SortHeader field="property" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الفندق</SortHeader>
                                        <SortHeader field="group" sortField={sortField} sortDir={sortDir} onSort={handleSort}>المجموعة</SortHeader>
                                        <SortHeader field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الشركة</SortHeader>
                                        <SortHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الحالة</SortHeader>
                                        <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>تاريخ الإنشاء</SortHeader>
                                    </>
                                )}

                                {reportType === "Company" && (
                                    <>
                                        <SortHeader field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>ID</SortHeader>
                                        <SortHeader field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>اسم الشركة</SortHeader>
                                        <SortHeader field="contact" sortField={sortField} sortDir={sortDir} onSort={handleSort}>المسؤول</SortHeader>
                                        <SortHeader field="phone" sortField={sortField} sortDir={sortDir} onSort={handleSort}>الهاتف</SortHeader>
                                        <SortHeader field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort}>البريد</SortHeader>
                                        <SortHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort}>تاريخ الإنشاء</SortHeader>
                                    </>
                                )}
                            </tr>
                        </thead>

                        {/* جسم الجدول */}
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={12} className="text-center p-6">
                                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
                                    </td>
                                </tr>
                            ) : sortedReports.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="text-center p-4 text-gray-500 dark:text-gray-400">لا توجد بيانات</td>
                                </tr>
                            ) : (
                                sortedReports.map((r, i) => (
                                    <tr key={r.id} className={`${r % 2 === 0
                                        ? "bg-gray-50 dark:bg-gray-900/40"
                                        : "bg-white dark:bg-gray-800"
                                        } hover:bg-blue-50 dark:hover:bg-gray-700 transition`}>
                                        {reportType === "Booking" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.guest?.firstName} {r.guest?.lastName}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.property?.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.room?.number || "-"}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.checkIn ? new Date(r.checkIn).toLocaleString() : ""}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.checkOut ? new Date(r.checkOut).toLocaleString() : ""}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.status}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.adults ?? 0}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.children ?? 0}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.ratePlan?.name || ""}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.company?.name || ""}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "Folio" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.bookingId || ""}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.guest?.firstName} {r.guest?.lastName}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.status || ""}</td>
                                                <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">
                                                    {(r.charges || []).reduce((sum, c) => sum + num(c.amount) + num(c.tax || 0), 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">
                                                    {(r.payments || []).reduce((sum, p) => sum + num(p.amount), 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">
                                                    {(
                                                        (r.charges || []).reduce((sum, c) => sum + num(c.amount) + num(c.tax || 0), 0) -
                                                        (r.payments || []).reduce((sum, p) => sum + num(p.amount), 0)
                                                    ).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "Payment" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.folio?.id || r.folioId || ""}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.folio?.guest?.firstName} {r.folio?.guest?.lastName}</td>
                                                <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">{num(r.amount).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.method}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.ref || ""}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.postedAt ? new Date(r.postedAt).toLocaleString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "Housekeeping" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.room?.number}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.type}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.priority || "-"}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.status}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.assignedTo?.name || "-"}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "Extra" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.bookingId || ""}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.guest?.firstName} {r.guest?.lastName}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.name}</td>
                                                <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">{num(r.unitPrice).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.quantity ?? 1}</td>
                                                <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">{num(r.tax).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.status}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "Group" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.company?.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.leader?.firstName} {r.leader?.lastName}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.status}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "RoomBlock" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.property?.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.group?.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.company?.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.status}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                                            </>
                                        )}

                                        {reportType === "Company" && (
                                            <>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.id}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.contactName}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.phone}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{r.email}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* الباجينيشن المحسن */}
            <div className="flex justify-center items-center gap-2 mt-6">
                {/* زر الأول */}
                <button
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                    className="px-4 py-2 rounded-lg transition-colors duration-200 text-black
               bg-gray-200 dark:bg-gray-700
               hover:bg-gray-300 dark:hover:bg-gray-600
               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ⏮ الأول
                </button>

                {/* زر السابق */}
                <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-lg transition-colors duration-200 text-black
               bg-gray-200 dark:bg-gray-700
               hover:bg-gray-300 dark:hover:bg-gray-600
               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ◀ السابق
                </button>

                {/* رقم الصفحة */}
                <span className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200">
                    {page} / {totalPages}
                </span>

                {/* زر التالي */}
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 rounded-lg transition-colors duration-200 text-black
               bg-gray-200 dark:bg-gray-700
               hover:bg-gray-300 dark:hover:bg-gray-600
               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    التالي ▶
                </button>

                {/* زر الأخير */}
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                    className="px-4 py-2 rounded-lg transition-colors duration-200 text-black
               bg-gray-200 dark:bg-gray-700
               hover:bg-gray-300 dark:hover:bg-gray-600
               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    الأخير ⏭
                </button>
            </div>

        </div>
    );
}
