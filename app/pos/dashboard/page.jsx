'use client';
import { useEffect, useState } from "react";
import { Loader2, ShoppingCart, Package, DollarSign, BarChart3, Percent, FileSpreadsheet, FileText } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

export default function POSDashboard() {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);


    // filters
    const [selectedOutlet, setSelectedOutlet] = useState("All");
    const [selectedItem, setSelectedItem] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [outlets, setOutlets] = useState([]);
    const [itemsList, setItemsList] = useState([]);

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch("/api/pos/reports");
                const data = await res.json();
                setReport(data);

                setOutlets(["All", ...data.map(r => r.outletName)]);
                const allItems = data.flatMap(r => r.items.map(i => i.name));
                setItemsList(["All", ...Array.from(new Set(allItems))]);
            } catch (err) {
                console.error("Failed to fetch report:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
            </div>
        );
    }

    // apply filters
    const filteredReport = report.map(r => {
        if (selectedOutlet && selectedOutlet !== "All" && r.outletName !== selectedOutlet) return null;

        const filteredItems = r.items.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesItem = selectedItem === "All" || i.name === selectedItem;

            const createdAt = new Date(i.createdAt);
            const afterFrom = dateFrom ? createdAt >= new Date(dateFrom) : true;
            const beforeTo = dateTo ? createdAt <= new Date(dateTo) : true;

            return matchesSearch && matchesItem && afterFrom && beforeTo;
        });

        return { ...r, items: filteredItems };
    }).filter(r => r !== null);

    // export to Excel
    const exportExcel = () => {
        const rows = [];
        filteredReport.forEach(r => {
            r.items.forEach(i => {
                rows.push({
                    Outlet: r.outletName,
                    Item: i.name,
                    Price: i.price,
                    Sold: i.quantitySold,
                    Revenue: i.revenue,
                    Cost: (i.cost ?? 0) * i.quantitySold,
                    Stock: i.stock,
                    Tax: i.tax,
                });
            });
        });

        let csv = "Outlet,Item,Price,Sold,Revenue,Cost,Stock,Tax\n";
        rows.forEach(row => {
            csv += `${row.Outlet},${row.Item},${row.Price},${row.Sold},${row.Revenue},${row.Cost},${row.Stock},${row.Tax}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "POS_Report.csv";
        a.click();
    };

    // export to PDF (بشكل مبسط)
    const exportPDF = () => {
        window.print(); // ممكن لاحقًا نستبدلها بمكتبة زي jsPDF
    };

    return (
        <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-3xl font-bold mb-6">POS Dashboard</h1>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Outlet</label>
                    <select
                        value={selectedOutlet}
                        onChange={e => setSelectedOutlet(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        {outlets.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Item</label>
                    <select
                        value={selectedItem}
                        onChange={e => setSelectedItem(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        {itemsList.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>

                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setSelectedOutlet("All");
                            setSelectedItem("All");
                            setDateFrom("");
                            setDateTo("");
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full md:w-auto"
                    >
                        Reset
                    </button>

                    <button
                        onClick={exportExcel}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <FileSpreadsheet size={18} /> Export Excel
                    </button>

                    <button
                        onClick={exportPDF}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <FileText size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {filteredReport.map(r => {
                const totalSold = r.items.reduce((sum, i) => sum + i.quantitySold, 0);
                const totalRevenue = r.items.reduce((sum, i) => sum + i.revenue, 0);
                const totalTax = r.items.reduce((sum, i) => sum + i.tax, 0);
                const totalStock = r.items.reduce((sum, i) => sum + (i.stock ?? 0), 0);

                // نسبة استهلاك المخزون %
                const consumptionRate = totalStock + totalSold > 0
                    ? ((totalSold / (totalStock + totalSold)) * 100).toFixed(1)
                    : 0;

                // تجهيز بيانات المقارنة بين المخزون والمباع
                const stockVsSoldData = r.items.map(i => ({
                    name: i.name,
                    sold: i.quantitySold,
                    remaining: i.stock ?? 0
                }));

                return (
                    <div key={r.outletId} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold mb-6">{r.outletName}</h2>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                            <Card icon={<ShoppingCart />} color="blue" label="Total Sales" value={`${totalRevenue.toFixed(2)} SAR`} />
                            <Card icon={<Package />} color="green" label="Quantity Sold" value={totalSold} />
                            <Card icon={<BarChart3 />} color="yellow" label="Remaining Stock" value={totalStock} />
                            <Card icon={<DollarSign />} color="red" label="Total Tax" value={`${totalTax.toFixed(2)} SAR`} />
                            <Card icon={<Percent />} color="purple" label="Consumption Rate" value={`${consumptionRate}%`} />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Sales by Item */}
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow">
                                <h3 className="font-semibold mb-2">Sales by Item</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={r.items}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Revenue Trend */}
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow">
                                <h3 className="font-semibold mb-2">Revenue Trend</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={r.items}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Sales Distribution */}
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow">
                                <h3 className="font-semibold mb-2">Sales Distribution</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={r.items}
                                            dataKey="revenue"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            label
                                        >
                                            {r.items.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stock vs Sold */}
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow">
                                <h3 className="font-semibold mb-2">Stock vs Sold</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={stockVsSoldData}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="sold" stackId="a" fill="#10b981" name="Sold" />
                                        <Bar dataKey="remaining" stackId="a" fill="#f59e0b" name="Remaining" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Profit & Loss Table */}
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow mt-6">
                            <h3 className="font-semibold mb-4">Profit & Loss</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 dark:bg-gray-600">
                                        <th className="p-2 text-left">Item</th>
                                        <th className="p-2 text-right">Price</th>
                                        <th className="p-2 text-right">Sold</th>
                                        <th className="p-2 text-right">Revenue</th>
                                        <th className="p-2 text-right">Cost</th>
                                        <th className="p-2 text-right">Profit/Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.items.map(i => {
                                        const revenue = i.revenue ?? 0;
                                        const cost = (i.cost ?? 0) * i.quantitySold;
                                        const profit = revenue - cost;
                                        return (
                                            <tr key={i.id} className="border-b">
                                                <td className="p-2">{i.name}</td>
                                                <td className="p-2 text-right">{i.price?.toFixed(2)} SAR</td>
                                                <td className="p-2 text-right">{i.quantitySold}</td>
                                                <td className="p-2 text-right">{revenue.toFixed(2)} SAR</td>
                                                <td className="p-2 text-right">{cost.toFixed(2)} SAR</td>
                                                <td className={`p-2 text-right font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {profit.toFixed(2)} SAR
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Card Component
function Card({ icon, color, label, value }) {
    const bgColors = {
        blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300",
        green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
        yellow: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300",
        red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
        purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300",
    };
    return (
        <div className={`p-4 rounded-xl shadow flex items-center gap-3 ${bgColors[color]}`}>
            {icon}
            <div>
                <p className="text-sm">{label}</p>
                <p className="text-lg font-bold">{value}</p>
            </div>
        </div>
    );
}
