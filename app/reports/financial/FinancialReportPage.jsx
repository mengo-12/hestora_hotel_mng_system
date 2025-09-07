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

    const [selectedProperty, setSelectedProperty] = useState(userProperties[0]?.id || "");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [report, setReport] = useState({ transactions: [], totalCharges: 0, totalPayments: 0, profitLoss: 0 });
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState("");

    const fetchReport = async () => {
        if (!selectedProperty) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ propertyId: selectedProperty });
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const res = await fetch(`/api/reports/financial?${params.toString()}`);
            const data = await res.json();
            setReport(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [selectedProperty, startDate, endDate]);

    // ===== Socket listeners =====
    useEffect(() => {
        if (!socket) return;
        const refreshReport = () => fetchReport();

        ["CHARGE_ADDED","CHARGE_DELETED","PAYMENT_ADDED","PAYMENT_DELETED","FOLIO_CLOSED"].forEach(event => {
            socket.on(event, refreshReport);
        });

        return () => {
            ["CHARGE_ADDED","CHARGE_DELETED","PAYMENT_ADDED","PAYMENT_DELETED","FOLIO_CLOSED"].forEach(event => {
                socket.off(event, refreshReport);
            });
        };
    }, [socket, selectedProperty, startDate, endDate]);

    // ===== react-table setup =====
    const columns = useMemo(() => [
        { Header: "التاريخ", accessor: "postedAt", Cell: ({ value }) => new Date(value).toLocaleString() },
        { Header: "نوع العملية", accessor: "type" },
        { Header: "الوصف", accessor: "description" },
        { Header: "النزيل", accessor: "guest" },
        { Header: "المبلغ", accessor: "amount", Cell: ({ value }) => value.toFixed(2) },
        { Header: "الموظف", accessor: "by" },
        { Header: "الدور", accessor: "role" },
        { Header: "رقم الحجز", accessor: "bookingId" },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
        state,
        setGlobalFilter: setTableGlobalFilter,
    } = useTable(
        { columns, data: report.transactions || [], initialState: { pageIndex: 0, pageSize: 10 } },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    useEffect(() => {
        setTableGlobalFilter(globalFilter);
    }, [globalFilter, setTableGlobalFilter]);

    // ===== Export functions =====
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
            t.amount.toFixed(2), t.by, t.role, t.bookingId
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
                    <select
                        className="border rounded p-2"
                        value={selectedProperty}
                        onChange={e => setSelectedProperty(e.target.value)}
                    >
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
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={fetchReport}>
                    تحديث التقرير
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={exportExcel}>
                    تصدير Excel
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={exportPDF}>
                    تصدير PDF
                </button>
            </div>

            <div className="mb-2">
                <input
                    type="text"
                    placeholder="بحث..."
                    className="border p-2 rounded w-full sm:w-64"
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                />
            </div>

            {loading ? (
                <p className="text-gray-500">جاري تحميل التقرير...</p>
            ) : (
                <>
                    {/* الملخص */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-red-100 p-4 rounded shadow text-center">
                            <p className="font-semibold">إجمالي الإيرادات (Charges + Unpaid Extras)</p>
                            <p className="text-red-600 text-xl font-bold">{report.totalCharges?.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-100 p-4 rounded shadow text-center">
                            <p className="font-semibold">إجمالي المدفوعات (Payments + Paid Extras)</p>
                            <p className="text-green-600 text-xl font-bold">{report.totalPayments?.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-100 p-4 rounded shadow text-center">
                            <p className="font-semibold">الربح / الخسارة</p>
                            <p className={`text-xl font-bold ${report.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {report.profitLoss?.toFixed(2)}
                            </p>
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
                                                <span>
                                                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                                </span>
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
                </>
            )}
        </div>
    );
}
