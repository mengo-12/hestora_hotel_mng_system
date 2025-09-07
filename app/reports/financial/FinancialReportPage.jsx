'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function FinancialReportPage({ session, userProperties }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const [selectedProperty, setSelectedProperty] = useState(userProperties[0]?.id || "");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [report, setReport] = useState({ transactions: [], totalCharges: 0, totalPayments: 0, profitLoss: 0 });
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">📊 التقرير المالي</h2>

            {/* اختيار الفندق والفترة */}
            <div className="flex flex-wrap gap-4 mb-6 items-end">
                <div>
                    <label className="block mb-1 font-semibold">اختر الفندق:</label>
                    <select
                        className="border rounded p-2"
                        value={selectedProperty}
                        onChange={e => setSelectedProperty(e.target.value)}
                    >
                        {userProperties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
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
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={fetchReport}
                >
                    تحديث التقرير
                </button>
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

                    {/* العمليات */}
                    <h3 className="text-xl font-semibold mb-3">📌 جميع العمليات المحاسبية</h3>
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                        <table className="w-full border text-sm">
                            <thead className="">
                                <tr>
                                    <th className="border p-2">التاريخ</th>
                                    <th className="border p-2">نوع العملية</th>
                                    <th className="border p-2">الوصف</th>
                                    <th className="border p-2">النزيل</th>
                                    <th className="border p-2">المبلغ</th>
                                    <th className="border p-2">الموظف</th>
                                    <th className="border p-2">الدور</th>
                                    <th className="border p-2">رقم الحجز</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.transactions?.map(t => (
                                    <tr key={t.id}>
                                        <td className="border p-2">{new Date(t.postedAt).toLocaleString()}</td>
                                        <td className={`border p-2 font-semibold ${t.type === "Charge" ? "text-red-600" : t.type === "Payment" ? "text-green-600" : "text-blue-600"}`}>{t.type}</td>
                                        <td className="border p-2">{t.description}</td>
                                        <td className="border p-2">{t.guest}</td>
                                        <td className="border p-2">{t.amount.toFixed(2)}</td>
                                        <td className="border p-2">{t.by}</td>
                                        <td className="border p-2">{t.role}</td>
                                        <td className="border p-2">{t.bookingId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
