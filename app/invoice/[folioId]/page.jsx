// // 'use client';
// import { useState, useEffect } from "react";
// import { use } from "react";
// import "./invoice.css";

// export default function InvoicePage({ params }) {
//     const folioParams = use(params); // تفك Promise params
//     const folioId = folioParams.folioId;

//     const [folio, setFolio] = useState(null);

//     useEffect(() => {
//         const fetchFolio = async () => {
//             try {
//                 const res = await fetch(`/api/folios/${folioId}`);
//                 if (!res.ok) throw new Error("Failed to fetch folio");
//                 const data = await res.json();
//                 setFolio(data);
//             } catch (err) {
//                 console.error(err);
//             }
//         };
//         fetchFolio();
//     }, [folioId]);

//     if (!folio) return <div>جاري تحميل الفاتورة...</div>;

//     const guest = folio.guest || folio.booking?.guest;
//     const room = folio.booking?.room;
//     const property = folio.booking?.property;

//     const totalCharges = (folio.charges || []).reduce((a, c) => a + Number(c.amount) + Number(c.tax || 0), 0);
//     const totalPayments = (folio.payments || []).reduce((a, p) => a + Number(p.amount), 0);
//     const balance = totalCharges - totalPayments;

//     return (
//         <div className="invoice-page">
//             <div className="invoice-header">
//                 <h1>{property?.name || "اسم الفندق"}</h1>
//                 <p>فاتورة رقم: {folio.id}</p>
//                 <p>تاريخ: {new Date().toLocaleDateString()}</p>
//             </div>

//             <hr />

//             <div className="guest-info">
//                 <h2>بيانات النزيل</h2>
//                 <p>الاسم: {guest ? `${guest.firstName} ${guest.lastName}` : "-"}</p>
//                 <p>الهاتف: {guest?.phone || "-"}</p>
//                 <p>البريد الإلكتروني: {guest?.email || "-"}</p>
//                 <p>الغرفة: {room?.number || "-"}</p>
//                 <p>الفترة: {folio.booking ? `${new Date(folio.booking.checkIn).toLocaleDateString()} - ${new Date(folio.booking.checkOut).toLocaleDateString()}` : "-"}</p>
//             </div>

//             <hr />

//             <div className="charges-section">
//                 <h2>الرسوم</h2>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>Code</th>
//                             <th>Description</th>
//                             <th>Amount</th>
//                             <th>Tax</th>
//                             <th>Posted By</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {(folio.charges || []).map(c => (
//                             <tr key={c.id}>
//                                 <td>{c.code}</td>
//                                 <td>{c.description}</td>
//                                 <td>{c.amount}</td>
//                                 <td>{c.tax || 0}</td>
//                                 <td>{c.postedBy?.name || "System"}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 <p>إجمالي الرسوم: {totalCharges.toFixed(2)}</p>
//             </div>

//             <hr />

//             <div className="payments-section">
//                 <h2>المدفوعات</h2>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>Method</th>
//                             <th>Amount</th>
//                             <th>Reference</th>
//                             <th>Posted By</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {(folio.payments || []).map(p => (
//                             <tr key={p.id}>
//                                 <td>{p.method}</td>
//                                 <td>{p.amount}</td>
//                                 <td>{p.ref || "-"}</td>
//                                 <td>{p.postedBy?.name || "System"}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//                 <p>الرصيد: {balance.toFixed(2)}</p>
//             </div>

//             <hr />
//             <p>شكراً لاستخدام نظام إدارة الفنادق</p>
//         </div>
//     );
// }


// app/invoice/[folioId]/page.jsx
import prisma from "@/lib/prisma";
import PrintAndThemeControls from "./PrintAndThemeControls";
import "./invoice.css";

export default async function InvoicePage({ params }) {
    const { folioId } = await params; // server component

    const folio = await prisma.folio.findUnique({
        where: { id: folioId },
        include: {
            charges: { include: { postedBy: true } },
            payments: { include: { postedBy: true } },
            guest: true,
            booking: { include: { room: true, property: true } },
        },
    });

    if (!folio) return <div>الفاتورة غير موجودة</div>;

    const totalCharges = folio.charges.reduce(
        (a, c) => a + Number(c.amount) + Number(c.tax || 0),
        0
    );
    const totalPayments = folio.payments.reduce(
        (a, p) => a + Number(p.amount),
        0
    );
    const balance = totalCharges - totalPayments;

    return (
        <PrintAndThemeControls
            folio={folio}
            totalCharges={totalCharges}
            totalPayments={totalPayments}
            balance={balance}
        />
    );
}







