// ======== دالة Grand Total داخل FolioPage ========
const calculateGrandTotal = (folioData) => {
    if (!folioData) return { subtotal: 0, taxTotal: 0, totalPayments: 0, grandTotal: 0 };

    const charges = folioData.charges || [];
    const payments = folioData.payments || [];

    const subtotal = charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const taxTotal = charges.reduce((sum, c) => sum + ((Number(c.amount || 0) * Number(c.tax || 0)) / 100), 0);
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const grandTotal = subtotal + taxTotal - totalPayments;

    return { subtotal, taxTotal, totalPayments, grandTotal };
};
