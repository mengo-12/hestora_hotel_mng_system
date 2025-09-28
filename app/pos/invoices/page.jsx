'use client';
import { useEffect, useState } from "react";
import { ShoppingCart, Printer, Eye } from "lucide-react";

export default function SalesHistoryPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const res = await fetch("/api/pos/sales");
                const data = await res.json();
                setSales(data);
            } catch (err) {
                console.error("Failed to fetch sales:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    if (loading) {
        return <p className="p-6 text-center text-gray-500">Loading sales...</p>;
    }

    return (
        <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <ShoppingCart size={28} /> Sales History
            </h1>

            {sales.length === 0 ? (
                <p className="text-center text-gray-500 py-20">No sales found.</p>
            ) : (
                <div className="space-y-6">
                    {sales.map(sale => (
                        <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 hover:shadow-2xl transition">

                            {/* Sale Header */}
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <p className="font-bold text-lg">Invoice #{sale.id}</p>
                                    <p className="text-sm text-gray-500">
                                        Outlet: {sale.outlet?.name || "N/A"} | Employee: {sale.user?.name || "N/A"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                                        <Eye size={16} /> View
                                    </button>
                                    <button className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                                        <Printer size={16} /> Print
                                    </button>
                                </div>
                            </div>

                            {/* Sale Items Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 dark:bg-gray-700">
                                            <th className="p-2 text-sm font-medium border-b">Item</th>
                                            <th className="p-2 text-sm font-medium border-b">Quantity</th>
                                            <th className="p-2 text-sm font-medium border-b">Stock</th>
                                            <th className="p-2 text-sm font-medium border-b">Price</th>
                                            <th className="p-2 text-sm font-medium border-b">Tax</th>
                                            <th className="p-2 text-sm font-medium border-b">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="p-2 text-sm font-medium">{item.name}</td>
                                                <td className="p-2 text-sm">{item.quantity}</td>
                                                <td className="p-2 text-sm">{item.stock ?? "N/A"}</td>
                                                <td className="p-2 text-sm">{item.price.toFixed(2)} SAR</td>
                                                <td className="p-2 text-sm">{item.tax.toFixed(2)}%</td>
                                                <td className="p-2 text-sm font-semibold">{(item.price * item.quantity + (item.price * item.quantity * (item.tax / 100))).toFixed(2)} SAR</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Sale Footer */}
                            <div className="mt-3 flex justify-end flex-col gap-1 text-right">
                                <p className="text-sm text-gray-500">Subtotal: {sale.total.toFixed(2)} SAR</p>
                                <p className="text-sm text-gray-500">Tax: {sale.tax.toFixed(2)} SAR</p>
                                <p className="font-bold text-lg">Total: {(sale.total + sale.tax).toFixed(2)} SAR</p>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
