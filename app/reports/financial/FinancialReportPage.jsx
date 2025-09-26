// 'use client';
// import { useEffect, useState, useMemo } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";
// import { saveAs } from 'file-saver';
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import 'jspdf-autotable';

// export default function FinancialReportPage({ session, userProperties }) {
//     const socket = useSocket();
//     const role = session?.user?.role || "Guest";

//     const allowedProperties = userProperties.map(p => p.id);
//     const [selectedProperty, setSelectedProperty] = useState(allowedProperties[0] || "");
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [report, setReport] = useState({ transactions: [], totalCharges: 0, totalPayments: 0, profitLoss: 0 });
//     const [loading, setLoading] = useState(false);
//     const [globalFilter, setGlobalFilter] = useState("");

//     // ===== Advanced Filters =====
//     const [filterType, setFilterType] = useState("");
//     const [filterByEmployee, setFilterByEmployee] = useState("");
//     const [filterByRole, setFilterByRole] = useState("");
//     const [filterExtraType, setFilterExtraType] = useState("");

//     // ===== Comparison State =====
//     const [comparison, setComparison] = useState({
//         previousPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
//         currentPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
//         difference: 0,
//         percentage: 0
//     });

//     // ===== Columns Setup =====
//     const columns = useMemo(() => [
//         { Header: "التاريخ", accessor: "postedAt", Cell: ({ value }) => new Date(value).toLocaleString() },
//         { Header: "نوع العملية", accessor: "type" },
//         { Header: "الوصف", accessor: "description" },
//         { Header: "النزيل", accessor: "guest" },
//         { Header: "المبلغ", accessor: "amount", Cell: ({ value }) => value.toFixed(2) },
//         { Header: "الموظف", accessor: "by" },
//         { Header: "الدور", accessor: "role" },
//         { Header: "رقم الحجز", accessor: "bookingId" },
//         { Header: "Extra Type", accessor: "extraType" }
//     ], []);

//     // ===== Filtered data =====
//     const filteredTransactions = useMemo(() => {
//         return (report.transactions || []).filter(t => {
//             return (!filterType || t.type === filterType) &&
//                 (!filterByEmployee || t.by === filterByEmployee) &&
//                 (!filterByRole || t.role === filterByRole) &&
//                 (!filterExtraType || t.extraType === filterExtraType);
//         });
//     }, [report.transactions, filterType, filterByEmployee, filterByRole, filterExtraType]);

//     // ===== Table instance =====
//     const tableInstance = useTable(
//         { columns, data: filteredTransactions, initialState: { pageIndex: 0, pageSize: 10 } },
//         useGlobalFilter,
//         useSortBy,
//         usePagination
//     );

//     const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state, setGlobalFilter: setTableGlobalFilter } = tableInstance;
//     useEffect(() => setTableGlobalFilter(globalFilter), [globalFilter]);

//     // ===== Fetch Report =====
//     const fetchReport = async () => {
//         if (!selectedProperty) return;
//         setLoading(true);
//         try {
//             const params = new URLSearchParams({ propertyId: selectedProperty });
//             if (startDate) params.append("startDate", startDate);
//             if (endDate) params.append("endDate", endDate);
//             if (filterType) params.append("type", filterType);
//             if (filterByEmployee) params.append("by", filterByEmployee);
//             if (filterByRole) params.append("role", filterByRole);
//             if (filterExtraType) params.append("extraType", filterExtraType);

//             const res = await fetch(`/api/reports/financial?${params.toString()}`);
//             const data = await res.json();
//             setReport(data);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchReport(); }, [selectedProperty, startDate, endDate, filterType, filterByEmployee, filterByRole, filterExtraType]);

//     // ===== Socket listeners =====
//     useEffect(() => {
//         if (!socket) return;
//         const refreshReport = () => fetchReport();
//         ["CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => socket.on(event, refreshReport));
//         return () => ["CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => socket.off(event, refreshReport));
//     }, [socket, selectedProperty, startDate, endDate, filterType, filterByEmployee, filterByRole, filterExtraType]);

// // ===== Calculate Comparison =====
// const calculateComparison = (transactions, startDate, endDate) => {
//     if (!startDate || !endDate) return;

//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     const dayDiff = (end - start) / (1000 * 60 * 60 * 24); // طول الفترة بالأيام

//     // الفترة الحالية
//     const currentTransactions = transactions.filter(t => {
//         const date = new Date(t.postedAt);
//         return date >= start && date <= end;
//     });

//     // الفترة السابقة = نفس طول الفترة قبل تاريخ البداية
//     const previousStart = new Date(start);
//     previousStart.setDate(previousStart.getDate() - dayDiff - 1);
//     const previousEnd = new Date(start);
//     previousEnd.setDate(previousEnd.getDate() - 1);

//     const previousTransactions = transactions.filter(t => {
//         const date = new Date(t.postedAt);
//         return date >= previousStart && date <= previousEnd;
//     });

//     const sum = (arr) => {
//         const totalCharges = arr.filter(t => t.type === "Charge" || t.type === "Extra").reduce((a, b) => a + b.amount, 0);
//         const totalPayments = arr.filter(t => t.type === "Payment").reduce((a, b) => a + b.amount, 0);
//         const profitLoss = totalPayments - totalCharges;
//         return { totalCharges, totalPayments, profitLoss };
//     };

//     const current = sum(currentTransactions);
//     const previous = sum(previousTransactions);

//     const difference = current.profitLoss - previous.profitLoss;
//     const percentage = previous.profitLoss !== 0 ? (difference / Math.abs(previous.profitLoss)) * 100 : 0;

//     setComparison({ previousPeriod: previous, currentPeriod: current, difference, percentage });
// };


// useEffect(() => {
//     if (report.transactions.length) {
//         calculateComparison(report.transactions, startDate, endDate);
//     } else {
//         setComparison({
//             previousPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
//             currentPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
//             difference: 0,
//             percentage: 0
//         });
//     }
// }, [report.transactions, startDate, endDate]);

// // ===== Export Functions =====
// const exportExcel = () => {
//     const ws = XLSX.utils.json_to_sheet(report.transactions || []);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
//     XLSX.writeFile(wb, `Financial_Report_${selectedProperty}.xlsx`);
// };

// const exportPDF = () => {
//     const doc = new jsPDF();
//     doc.text("Financial Report", 14, 16);
//     const tableColumn = columns.map(c => c.Header);
//     const tableRows = report.transactions.map(t => [
//         new Date(t.postedAt).toLocaleString(), t.type, t.description, t.guest,
//         t.amount.toFixed(2), t.by, t.role, t.bookingId, t.extraType || "-"
//     ]);
//     doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
//     doc.save(`Financial_Report_${selectedProperty}.pdf`);
// };



//     return (
//         <div className="p-6 max-w-7xl mx-auto">
//             <h2 className="text-2xl font-bold mb-4">📊 التقرير المالي</h2>

//             {/* اختيار الفندق والفترة */}
//             <div className="flex flex-wrap gap-4 mb-4 items-end">
//                 <div>
//                     <label className="block mb-1 font-semibold">اختر الفندق:</label>
//                     <select className="border rounded p-2" value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
//                         {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>
//                 <div>
//                     <label className="block mb-1 font-semibold">من تاريخ:</label>
//                     <input type="date" className="border rounded p-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
//                 </div>
//                 <div>
//                     <label className="block mb-1 font-semibold">إلى تاريخ:</label>
//                     <input type="date" className="border rounded p-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
//                 </div>
//                 <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={fetchReport}>تحديث التقرير</button>
//                 <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={exportExcel}>تصدير Excel</button>
//                 <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={exportPDF}>تصدير PDF</button>
//             </div>

//             {/* ===== Advanced Filters Dropdowns خارج الجدول ===== */}
//             <div className="flex flex-wrap gap-4 mb-4 items-end">
//                 <div>
//                     <label className="block mb-1 font-semibold">نوع العملية:</label>
//                     <select className="border rounded p-2" value={filterType} onChange={e => setFilterType(e.target.value)}>
//                         <option value="">الكل</option>
//                         <option value="Charge">Charge</option>
//                         <option value="Payment">Payment</option>
//                         <option value="Extra">Extra</option>
//                     </select>
//                 </div>

//                 <div>
//                     <label className="block mb-1 font-semibold">الموظف:</label>
//                     <select className="border rounded p-2" value={filterByEmployee} onChange={e => setFilterByEmployee(e.target.value)}>
//                         <option value="">الكل</option>
//                         {report.transactions.map(t => t.by).filter((v, i, a) => v && a.indexOf(v) === i).map(emp => <option key={emp} value={emp}>{emp}</option>)}
//                     </select>
//                 </div>

//                 <div>
//                     <label className="block mb-1 font-semibold">الدور:</label>
//                     <select className="border rounded p-2" value={filterByRole} onChange={e => setFilterByRole(e.target.value)}>
//                         <option value="">الكل</option>
//                         {report.transactions.map(t => t.role).filter((v, i, a) => v && a.indexOf(v) === i).map(role => <option key={role} value={role}>{role}</option>)}
//                     </select>
//                 </div>

//                 <div>
//                     <label className="block mb-1 font-semibold">Extra Type:</label>
//                     <select className="border rounded p-2" value={filterExtraType} onChange={e => setFilterExtraType(e.target.value)}>
//                         <option value="">الكل</option>
//                         {report.transactions.map(t => t.extraType).filter((v, i, a) => v && a.indexOf(v) === i).map(et => <option key={et} value={et}>{et}</option>)}
//                     </select>
//                 </div>

//                 <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={fetchReport}>تحديث التقرير</button>
//             </div>

//             {/* Global Search */}
//             <div className="mb-2">
//                 <input type="text" placeholder="بحث عام..." className="border p-2 rounded w-full sm:w-64" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} />
//             </div>

//             {/* ===== Comparison Section (always visible) ===== */}
//             <div className="border rounded p-4 mb-4">
//                 <h3 className="font-semibold text-lg mb-2">📊 مقارنة الأرباح / الخسائر</h3>
//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                         <p className="font-medium">الفترة السابقة:</p>
//                         <p>إجمالي المبالغ: {comparison.previousPeriod.totalCharges.toFixed(2)}</p>
//                         <p>المدفوعات: {comparison.previousPeriod.totalPayments.toFixed(2)}</p>
//                         <p>صافي الربح/الخسارة: {comparison.previousPeriod.profitLoss.toFixed(2)}</p>
//                     </div>
//                     <div>
//                         <p className="font-medium">الفترة الحالية:</p>
//                         <p>إجمالي المبالغ: {comparison.currentPeriod.totalCharges.toFixed(2)}</p>
//                         <p>المدفوعات: {comparison.currentPeriod.totalPayments.toFixed(2)}</p>
//                         <p>صافي الربح/الخسارة: {comparison.currentPeriod.profitLoss.toFixed(2)}</p>
//                     </div>
//                 </div>
//                 <div className="mt-2">
//                     <p>الفرق: {comparison.difference.toFixed(2)} ({comparison.percentage.toFixed(2)}%)</p>
//                     {comparison.difference < 0 && <p className="text-red-600">خسارة مقارنة بالفترة السابقة</p>}
//                     {comparison.difference > 0 && <p className="text-green-600">ربح إضافي مقارنة بالفترة السابقة</p>}
//                     {comparison.difference === 0 && <p>لا يوجد فرق مقارنة بالفترة السابقة</p>}
//                 </div>
//             </div>

//             {/* الجدول */}
//             <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded">
//                 <table {...getTableProps()} className="w-full border text-sm">
//                     <thead>
//                         {headerGroups.map(headerGroup => (
//                             <tr {...headerGroup.getHeaderGroupProps()}>
//                                 {headerGroup.headers.map(column => (
//                                     <th {...column.getHeaderProps(column.getSortByToggleProps())} className="border p-2">
//                                         {column.render('Header')}
//                                         <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
//                                     </th>
//                                 ))}
//                             </tr>
//                         ))}
//                     </thead>
//                     <tbody {...getTableBodyProps()}>
//                         {page.map(row => {
//                             prepareRow(row);
//                             return (
//                                 <tr {...row.getRowProps()}>
//                                     {row.cells.map(cell => <td {...cell.getCellProps()} className="border p-2">{cell.render('Cell')}</td>)}
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                 </table>

//                 {/* Pagination */}
//                 <div className="flex justify-between items-center mt-2">
//                     <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">السابق</button>
//                     <span>صفحة {state.pageIndex + 1} من {pageOptions.length}</span>
//                     <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">التالي</button>
//                 </div>
//             </div>
//         </div>
//     );
// }



'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { FaReceipt, FaArrowUp, FaArrowDown, FaEquals } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FinancialReportPage({ session, userProperties }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const allowedProperties = userProperties.map(p => p.id);
    const [selectedProperty, setSelectedProperty] = useState(allowedProperties[0] || "");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [report, setReport] = useState({ transactions: [], totalCharges: 0, totalPayments: 0, profitLoss: 0 });
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState("");

    const [filterType, setFilterType] = useState("");
    const [filterByEmployee, setFilterByEmployee] = useState("");
    const [filterByRole, setFilterByRole] = useState("");
    const [filterExtraType, setFilterExtraType] = useState("");

    const [comparison, setComparison] = useState({
        previousPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
        currentPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
        difference: 0,
        percentage: 0
    });

    // رسم بيانات صغيرة لكل بطاقة
    const getMiniChartData = (period) => {
        if (!report.transactions.length) return [];
        return report.transactions
            .filter(t => {
                const date = new Date(t.postedAt);
                if (period === 'current') return startDate && endDate && date >= new Date(startDate) && date <= new Date(endDate);
                if (period === 'previous') {
                    if (!startDate || !endDate) return false;
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const dayDiff = (end - start) / (1000 * 60 * 60 * 24);
                    const previousStart = new Date(start);
                    previousStart.setDate(previousStart.getDate() - dayDiff - 1);
                    const previousEnd = new Date(start);
                    previousEnd.setDate(previousEnd.getDate() - 1);
                    return date >= previousStart && date <= previousEnd;
                }
                return false;
            })
            .map(t => ({ date: new Date(t.postedAt).toLocaleDateString(), value: t.amount }));
    };

    const columns = useMemo(() => [
        { Header: "التاريخ", accessor: "postedAt", Cell: ({ value }) => new Date(value).toLocaleString() },
        { Header: "نوع العملية", accessor: "type" },
        { Header: "الوصف", accessor: "description" },
        { Header: "النزيل", accessor: "guest" },
        { Header: "المبلغ", accessor: "amount", Cell: ({ value }) => value.toFixed(2) },
        { Header: "الموظف", accessor: "by" },
        { Header: "الدور", accessor: "role" },
        { Header: "رقم الحجز", accessor: "bookingId" },
        { Header: "Extra Type", accessor: "extraType" }
    ], []);

    const filteredTransactions = useMemo(() => {
        return (report.transactions || []).filter(t => {
            return (!filterType || t.type === filterType) &&
                (!filterByEmployee || t.by === filterByEmployee) &&
                (!filterByRole || t.role === filterByRole) &&
                (!filterExtraType || t.extraType === filterExtraType);
        });
    }, [report.transactions, filterType, filterByEmployee, filterByRole, filterExtraType]);

    const tableInstance = useTable(
        { columns, data: filteredTransactions, initialState: { pageIndex: 0, pageSize: 10 } },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state, setGlobalFilter: setTableGlobalFilter } = tableInstance;
    useEffect(() => setTableGlobalFilter(globalFilter), [globalFilter]);

    const fetchReport = async () => {
        if (!selectedProperty) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ propertyId: selectedProperty });
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (filterType) params.append("type", filterType);
            if (filterByEmployee) params.append("by", filterByEmployee);
            if (filterByRole) params.append("role", filterByRole);
            if (filterExtraType) params.append("extraType", filterExtraType);

            const res = await fetch(`/api/reports/financial?${params.toString()}`);
            const data = await res.json();
            setReport(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [selectedProperty, startDate, endDate, filterType, filterByEmployee, filterByRole, filterExtraType]);

    useEffect(() => {
        if (!socket) return;
        const refreshReport = () => fetchReport();
        ["CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => socket.on(event, refreshReport));
        return () => ["CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => socket.off(event, refreshReport));
    }, [socket, selectedProperty, startDate, endDate, filterType, filterByEmployee, filterByRole, filterExtraType]);

    const calculateComparison = (transactions, startDate, endDate) => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayDiff = (end - start) / (1000 * 60 * 60 * 24);

        const currentTransactions = transactions.filter(t => {
            const date = new Date(t.postedAt);
            return date >= start && date <= end;
        });

        const previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - dayDiff - 1);
        const previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);

        const previousTransactions = transactions.filter(t => {
            const date = new Date(t.postedAt);
            return date >= previousStart && date <= previousEnd;
        });

        const sum = (arr) => {
            const totalCharges = arr.filter(t => t.type === "Charge" || t.type === "Extra").reduce((a, b) => a + b.amount, 0);
            const totalPayments = arr.filter(t => t.type === "Payment").reduce((a, b) => a + b.amount, 0);
            const profitLoss = totalPayments - totalCharges;
            return { totalCharges, totalPayments, profitLoss };
        };

        const current = sum(currentTransactions);
        const previous = sum(previousTransactions);

        const difference = current.profitLoss - previous.profitLoss;
        const percentage = previous.profitLoss !== 0 ? (difference / Math.abs(previous.profitLoss)) * 100 : 0;

        setComparison({ previousPeriod: previous, currentPeriod: current, difference, percentage });
    };

    useEffect(() => {
        if (report.transactions.length) {
            calculateComparison(report.transactions, startDate, endDate);
        } else {
            setComparison({
                previousPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
                currentPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
                difference: 0,
                percentage: 0
            });
        }
    }, [report.transactions, startDate, endDate]);

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(report.transactions || []);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
        XLSX.writeFile(wb, `Financial_Report_${selectedProperty}.xlsx`);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Financial Report", 14, 16);
        const tableColumn = columns.map(c => c.Header);
        const tableRows = report.transactions.map(t => [
            new Date(t.postedAt).toLocaleString(), t.type, t.description, t.guest,
            t.amount.toFixed(2), t.by, t.role, t.bookingId, t.extraType || "-"
        ]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save(`Financial_Report_${selectedProperty}.pdf`);
    };

    const getTrendIcon = (value) => {
        if (value > 0) return <FaArrowUp className="text-green-600 inline ml-1" />;
        if (value < 0) return <FaArrowDown className="text-red-600 inline ml-1" />;
        return <FaEquals className="text-gray-500 inline ml-1" />;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-gray-100 flex items-center gap-2">
                <FaReceipt className="text-orange-500" /> التقرير المالي
            </h2>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">اختر الفندق</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                        {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">من تاريخ</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">إلى تاريخ</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <button onClick={fetchReport} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">تحديث</button>
                    <button onClick={exportExcel} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full md:w-auto">Excel</button>
                    <button onClick={exportPDF} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full md:w-auto">PDF</button>
                </div>
            </div>

            {/* Comparison Cards with Mini Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">الفترة السابقة {getTrendIcon(comparison.previousPeriod.profitLoss)}</h3>
                    <p>إجمالي المبالغ: {comparison.previousPeriod.totalCharges.toFixed(2)}</p>
                    <p>المدفوعات: {comparison.previousPeriod.totalPayments.toFixed(2)}</p>
                    <p>صافي الربح/الخسارة: {comparison.previousPeriod.profitLoss.toFixed(2)}</p>
                    <div className="mt-3 h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getMiniChartData('previous')}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#FFA500" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">الفترة الحالية {getTrendIcon(comparison.currentPeriod.profitLoss)}</h3>
                    <p>إجمالي المبالغ: {comparison.currentPeriod.totalCharges.toFixed(2)}</p>
                    <p>المدفوعات: {comparison.currentPeriod.totalPayments.toFixed(2)}</p>
                    <p>صافي الربح/الخسارة: {comparison.currentPeriod.profitLoss.toFixed(2)}</p>
                    <div className="mt-3 h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getMiniChartData('current')}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">الفرق {getTrendIcon(comparison.difference)}</h3>
                    <p className={`text-lg font-semibold ${comparison.difference > 0 ? 'text-green-600' : comparison.difference < 0 ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}`}>
                        {comparison.difference.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ({comparison.percentage.toFixed(2)}%)
                    </p>
                </div>
            </div>

            {/* Global Search */}
            <div className="mb-4">
                <input type="text" placeholder="بحث عام..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="w-full sm:w-64 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <FaReceipt className="text-orange-500" /> المعاملات
                    </h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300">
                        {filteredTransactions.length} Items
                    </span>
                </div>

                <table {...getTableProps()} className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps(column.getSortByToggleProps())} className="px-4 py-3 text-left">
                                        {column.render('Header')}
                                        <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map((row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()} className={`${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800"} hover:bg-orange-50 dark:hover:bg-gray-700 transition`}>
                                    {row.cells.map(cell => (
                                        <td {...cell.getCellProps()} className="px-4 py-3 text-gray-700 dark:text-gray-200">{cell.render('Cell')}</td>
                                    ))}
                                </tr>
                            );
                        })}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    لا توجد معاملات
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-4">
                    <button onClick={() => tableInstance.gotoPage(0)} disabled={!canPreviousPage} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">⏮ الأول</button>
                    <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">◀ السابق</button>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">{state.pageIndex + 1} / {pageOptions.length}</span>
                    <button onClick={() => nextPage()} disabled={!canNextPage} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">التالي ▶</button>
                    <button onClick={() => tableInstance.gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">الأخير ⏭</button>
                </div>
            </div>
        </div>
    );
}




