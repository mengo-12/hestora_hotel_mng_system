'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import 'jspdf-autotable';

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

    // ===== Advanced Filters =====
    const [filterType, setFilterType] = useState("");
    const [filterByEmployee, setFilterByEmployee] = useState("");
    const [filterByRole, setFilterByRole] = useState("");
    const [filterExtraType, setFilterExtraType] = useState("");

    // ===== Comparison State =====
    const [comparison, setComparison] = useState({
        previousPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
        currentPeriod: { totalCharges: 0, totalPayments: 0, profitLoss: 0 },
        difference: 0,
        percentage: 0
    });

    // ===== Columns Setup =====
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

    // ===== Filtered data =====
    const filteredTransactions = useMemo(() => {
        return (report.transactions || []).filter(t => {
            return (!filterType || t.type === filterType) &&
                (!filterByEmployee || t.by === filterByEmployee) &&
                (!filterByRole || t.role === filterByRole) &&
                (!filterExtraType || t.extraType === filterExtraType);
        });
    }, [report.transactions, filterType, filterByEmployee, filterByRole, filterExtraType]);

    // ===== Table instance =====
    const tableInstance = useTable(
        { columns, data: filteredTransactions, initialState: { pageIndex: 0, pageSize: 10 } },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state, setGlobalFilter: setTableGlobalFilter } = tableInstance;
    useEffect(() => setTableGlobalFilter(globalFilter), [globalFilter]);

    // ===== Fetch Report =====
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

    // ===== Socket listeners =====
    useEffect(() => {
        if (!socket) return;
        const refreshReport = () => fetchReport();
        ["CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => socket.on(event, refreshReport));
        return () => ["CHARGE_ADDED", "CHARGE_DELETED", "PAYMENT_ADDED", "PAYMENT_DELETED", "FOLIO_CLOSED"].forEach(event => socket.off(event, refreshReport));
    }, [socket, selectedProperty, startDate, endDate, filterType, filterByEmployee, filterByRole, filterExtraType]);

    // ===== Calculate Comparison =====
    const calculateComparison = (transactions, startDate, endDate) => {
        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);

        const dayDiff = (end - start) / (1000 * 60 * 60 * 24); // طول الفترة بالأيام

        // الفترة الحالية
        const currentTransactions = transactions.filter(t => {
            const date = new Date(t.postedAt);
            return date >= start && date <= end;
        });

        // الفترة السابقة = نفس طول الفترة قبل تاريخ البداية
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

    // ===== Export Functions =====
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">📊 التقرير المالي</h2>

            {/* اختيار الفندق والفترة */}
            <div className="flex flex-wrap gap-4 mb-4 items-end">
                <div>
                    <label className="block mb-1 font-semibold">اختر الفندق:</label>
                    <select className="border rounded p-2" value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
                        {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-1 font-semibold">من تاريخ:</label>
                    <input type="date" className="border rounded p-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                    <label className="block mb-1 font-semibold">إلى تاريخ:</label>
                    <input type="date" className="border rounded p-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={fetchReport}>تحديث التقرير</button>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={exportExcel}>تصدير Excel</button>
                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={exportPDF}>تصدير PDF</button>
            </div>

            {/* ===== Advanced Filters Dropdowns خارج الجدول ===== */}
            <div className="flex flex-wrap gap-4 mb-4 items-end">
                <div>
                    <label className="block mb-1 font-semibold">نوع العملية:</label>
                    <select className="border rounded p-2" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">الكل</option>
                        <option value="Charge">Charge</option>
                        <option value="Payment">Payment</option>
                        <option value="Extra">Extra</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-semibold">الموظف:</label>
                    <select className="border rounded p-2" value={filterByEmployee} onChange={e => setFilterByEmployee(e.target.value)}>
                        <option value="">الكل</option>
                        {report.transactions.map(t => t.by).filter((v, i, a) => v && a.indexOf(v) === i).map(emp => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-semibold">الدور:</label>
                    <select className="border rounded p-2" value={filterByRole} onChange={e => setFilterByRole(e.target.value)}>
                        <option value="">الكل</option>
                        {report.transactions.map(t => t.role).filter((v, i, a) => v && a.indexOf(v) === i).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-semibold">Extra Type:</label>
                    <select className="border rounded p-2" value={filterExtraType} onChange={e => setFilterExtraType(e.target.value)}>
                        <option value="">الكل</option>
                        {report.transactions.map(t => t.extraType).filter((v, i, a) => v && a.indexOf(v) === i).map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                </div>

                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={fetchReport}>تحديث التقرير</button>
            </div>

            {/* Global Search */}
            <div className="mb-2">
                <input type="text" placeholder="بحث عام..." className="border p-2 rounded w-full sm:w-64" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} />
            </div>

            {/* ===== Comparison Section (always visible) ===== */}
            <div className="border rounded p-4 mb-4">
                <h3 className="font-semibold text-lg mb-2">📊 مقارنة الأرباح / الخسائر</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-medium">الفترة السابقة:</p>
                        <p>إجمالي المبالغ: {comparison.previousPeriod.totalCharges.toFixed(2)}</p>
                        <p>المدفوعات: {comparison.previousPeriod.totalPayments.toFixed(2)}</p>
                        <p>صافي الربح/الخسارة: {comparison.previousPeriod.profitLoss.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-medium">الفترة الحالية:</p>
                        <p>إجمالي المبالغ: {comparison.currentPeriod.totalCharges.toFixed(2)}</p>
                        <p>المدفوعات: {comparison.currentPeriod.totalPayments.toFixed(2)}</p>
                        <p>صافي الربح/الخسارة: {comparison.currentPeriod.profitLoss.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-2">
                    <p>الفرق: {comparison.difference.toFixed(2)} ({comparison.percentage.toFixed(2)}%)</p>
                    {comparison.difference < 0 && <p className="text-red-600">خسارة مقارنة بالفترة السابقة</p>}
                    {comparison.difference > 0 && <p className="text-green-600">ربح إضافي مقارنة بالفترة السابقة</p>}
                    {comparison.difference === 0 && <p>لا يوجد فرق مقارنة بالفترة السابقة</p>}
                </div>
            </div>

            {/* الجدول */}
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded">
                <table {...getTableProps()} className="w-full border text-sm">
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps(column.getSortByToggleProps())} className="border p-2">
                                        {column.render('Header')}
                                        <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => <td {...cell.getCellProps()} className="border p-2">{cell.render('Cell')}</td>)}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-2">
                    <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">السابق</button>
                    <span>صفحة {state.pageIndex + 1} من {pageOptions.length}</span>
                    <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">التالي</button>
                </div>
            </div>
        </div>
    );
}
