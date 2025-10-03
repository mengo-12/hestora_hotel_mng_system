'use client';
import { useEffect, useState } from "react";
import { ShoppingCart, Printer, Eye, Trash2, Loader2 } from "lucide-react";
import ConfirmationModal from "@/app/components/ConfirmationModal";


export default function SalesHistoryPage({ session }) {
    const [sales, setSales] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // ✅ Permissions
    const role = session?.user?.role || "Guest";
    const canView = ["Admin", "Manager", "Cashier"].includes(role);
    const canPrint = ["Admin", "Manager"].includes(role);
    const canExport = ["Admin"].includes(role);
    const canDelete = ["Admin", "Manager"].includes(role);


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Modal
    const [selectedSale, setSelectedSale] = useState(null);


    useEffect(() => {
        const fetchSales = async () => {
            try {
                const [salesRes, outletsRes, employeesRes] = await Promise.all([
                    fetch("/api/pos/sales"),
                    fetch("/api/pos/outlets"),
                    fetch("/api/pos/employees")
                ]);
                setSales(await salesRes.json());
                setOutlets(await outletsRes.json());
                setEmployees(await employeesRes.json());
            } catch (err) {
                console.error("Failed to fetch sales:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    const handleDelete = (saleId) => {
        setPendingDeleteId(saleId);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        setConfirmLoading(true);
        try {
            const res = await fetch(`/api/pos/sales/${pendingDeleteId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete sale");
            setSales(prev => prev.filter(s => s.id !== pendingDeleteId));
            setConfirmOpen(false);
        } catch (err) {
            console.error("❌ Delete Sale Error:", err);
        } finally {
            setConfirmLoading(false);
            setPendingDeleteId(null);
        }
    };

    // ==============================
    // Filtered Sales
    // ==============================
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        const matchesOutlet = selectedOutlet === "" || sale.outlet?.id === selectedOutlet;
        const matchesEmployee = selectedEmployee === "" || sale.user?.id === selectedEmployee;
        const matchesStartDate = !startDate || saleDate >= new Date(startDate);
        const matchesEndDate = !endDate || saleDate <= new Date(endDate);
        return matchesOutlet && matchesStartDate && matchesEndDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / pageSize);
    const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Print Handler
    const handlePrint = (sale) => {
        const printContent = `
            <h2>Invoice #${sale.id}</h2>
            <p>Outlet: ${sale.outlet?.name || "N/A"}</p>
            <p>Employee: ${sale.user?.name || "N/A"}</p>
            <p>Date: ${new Date(sale.createdAt).toLocaleDateString()}</p>
            <hr/>
            <table border="1" cellspacing="0" cellpadding="4">
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                ${sale.items.map(i => `
                    <tr>
                        <td>${i.name ?? i.item?.name ?? "N/A"}</td>
                        <td>${i.quantity}</td>
                        <td>${Number(i.price).toFixed(2)}</td>
                        <td>${(i.quantity * i.price).toFixed(2)}</td>
                    </tr>
                `).join("")}
            </table>
            <p><b>Total: ${Number(sale.total).toFixed(2)} SAR</b></p>
        `;
        const printWindow = window.open("", "_blank");
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <ShoppingCart size={28} /> Sales History
            </h1>

            {/* ==============================
                Filters
            ============================== */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                {/* Outlet Filter */}
                <div className="w-full md:w-1/4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1 block">Outlet</label>
                    <select
                        value={selectedOutlet}
                        onChange={e => setSelectedOutlet(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Outlets</option>
                        {outlets.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                {/* Employee Filter */}
                <div className="w-full md:w-1/4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1 block">Employee</label>
                    <select
                        value={selectedEmployee}
                        onChange={e => setSelectedEmployee(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                {/* Start Date */}
                <div className="w-full md:w-1/4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1 block">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* End Date */}
                <div className="w-full md:w-1/4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1 block">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            {/* ==============================
                Sales List
            ============================== */}
            {paginatedSales.length === 0 ? (
                <p className="text-center text-gray-500 py-20">No sales found.</p>
            ) : (
                <div className="space-y-6">
                    {paginatedSales.map(sale => (
                        <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 hover:shadow-2xl transition">

                            {/* Sale Header */}
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <p className="font-bold text-lg">Invoice #{sale.id}</p>
                                    <p className="text-sm text-gray-500">
                                        Outlet: {sale.outlet?.name || "N/A"} | Employee: {sale.user?.name || "N/A"} | Date: {new Date(sale.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedSale(sale)}
                                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                                        <Eye size={16} /> View
                                    </button>
                                    {canPrint && (
                                        <button
                                            onClick={() => handlePrint(sale)}
                                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                                            <Printer size={16} /> Print
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(sale.id)}
                                            className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sale Items Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 dark:bg-gray-700">
                                            <th className="p-2 text-sm font-medium border-b">Item</th>
                                            <th className="p-2 text-sm font-medium border-b">Quantity</th>
                                            <th className="p-2 text-sm font-medium border-b">Price</th>
                                            <th className="p-2 text-sm font-medium border-b">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="p-2 text-sm font-medium">{item.name ?? item.item?.name ?? "N/A"}</td>
                                                <td className="p-2 text-sm">{item.quantity}</td>
                                                <td className="p-2 text-sm">{Number(item.price).toFixed(2)} SAR</td>
                                                <td className="p-2 text-sm font-semibold">
                                                    {(Number(item.price) * item.quantity).toFixed(2)} SAR
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Sale Footer */}
                            <div className="mt-3 flex justify-end flex-col gap-1 text-right">
                                <p className="text-sm text-gray-500">Subtotal: {Number(sale.total).toFixed(2)} SAR</p>
                                <p className="text-sm text-gray-500">Tax: {Number(sale.tax).toFixed(2)} SAR</p>
                                <p className="font-bold text-lg">Total: {Number(sale.total).toFixed(2)} SAR</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ==============================
                Pagination
            ============================== */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50">
                        Prev
                    </button>
                    <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50">
                        Next
                    </button>
                </div>
            )}

            {/* ==============================
                View Modal
            ============================== */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">Invoice #{selectedSale.id}</h2>
                        <p className="text-sm mb-2">Outlet: {selectedSale.outlet?.name}</p>
                        <p className="text-sm mb-2">Employee: {selectedSale.user?.name}</p>
                        <p className="text-sm mb-4">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-700">
                                    <th className="p-2 text-sm font-medium border-b">Item</th>
                                    <th className="p-2 text-sm font-medium border-b">Qty</th>
                                    <th className="p-2 text-sm font-medium border-b">Price</th>
                                    <th className="p-2 text-sm font-medium border-b">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSale.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2 text-sm">{item.name ?? item.item?.name}</td>
                                        <td className="p-2 text-sm">{item.quantity}</td>
                                        <td className="p-2 text-sm">{Number(item.price).toFixed(2)}</td>
                                        <td className="p-2 text-sm">{(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="text-right mt-4">
                            <p className="text-sm">Subtotal: {Number(selectedSale.total).toFixed(2)} SAR</p>
                            <p className="text-sm">Tax: {Number(selectedSale.tax).toFixed(2)} SAR</p>
                            <p className="font-bold">Total: {(Number(selectedSale.total) + Number(selectedSale.tax)).toFixed(2)} SAR</p>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ✅ Confirmation Modal */}
            <ConfirmationModal
                open={confirmOpen}
                message="هل أنت متأكد أنك تريد حذف هذه الفاتورة؟"
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={confirmLoading}
            />
        </div>
    );
}



