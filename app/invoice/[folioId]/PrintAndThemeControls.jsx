// app/invoice/[folioId]/PrintAndThemeControls.jsx
"use client";
import { useState, useRef } from "react";

export default function PrintAndThemeControls({ folio, totalCharges, totalPayments, balance }) {
    const [darkMode, setDarkMode] = useState(false);
    const invoiceRef = useRef();

    const handlePrint = () => {
        const printContent = invoiceRef.current.innerHTML;
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
            <head>
                <title>فاتورة الضيف</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc; padding: 5px; text-align: left; }
                    h2, h3 { margin: 10px 0; }
                </style>
            </head>
            <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // printWindow.close();
    };

    return (
        <div className={`invoice-container ${darkMode ? "dark" : ""}`}>
            <div className="invoice-header">
                <h2>فاتورة الضيف</h2>
                <div className="invoice-buttons">
                    <button onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? "وضع نهاري" : "وضع ليلي"}
                    </button>
                    <button onClick={handlePrint}>طباعة الفاتورة</button>
                </div>
            </div>

            <div ref={invoiceRef}>
                <section className="guest-info">
                    <h3>بيانات النزيل</h3>
                    <p>الاسم: {folio.guest.firstName} {folio.guest.lastName}</p>
                    <p>الهاتف: {folio.guest.phone || "-"}</p>
                    <p>البريد الإلكتروني: {folio.guest.email || "-"}</p>
                    <p>الغرفة: {folio.booking.room?.number || "-"}</p>
                    <p>الفترة: {folio.booking.checkIn.toLocaleDateString()} - {folio.booking.checkOut.toLocaleDateString()}</p>
                </section>

                <section className="charges">
                    <h3>الرسوم</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Tax</th>
                                <th>Posted By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folio.charges.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.code}</td>
                                    <td>{c.description}</td>
                                    <td>{c.amount}</td>
                                    <td>{c.tax || 0}</td>
                                    <td>{c.postedBy.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p>إجمالي الرسوم: {totalCharges.toFixed(2)}</p>
                </section>

                <section className="payments">
                    <h3>المدفوعات</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Reference</th>
                                <th>Posted By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folio.payments.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.method}</td>
                                    <td>{p.amount}</td>
                                    <td>{p.ref || "-"}</td>
                                    <td>{p.postedBy.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p>الرصيد: {balance.toFixed(2)}</p>
                </section>

                <p>شكراً لاستخدام نظام إدارة الفنادق</p>
            </div>
        </div>
    );
}
