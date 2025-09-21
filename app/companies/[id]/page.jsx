'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CompanyProfile() {
    const { id } = useParams();
    const router = useRouter();

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCompany = async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/companies/${id}`);
            if (!res.ok) throw new Error(`Failed to fetch company (${res.status})`);
            const data = await res.json();
            setCompany(data);
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompany(); }, [id]);

    if (loading) return <div className="p-6">Loading company details...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (!company) return <div className="p-6">Company not found.</div>;

    // defensive access: companyTotals may come from API as companyTotals or companyTotals
    const totals = company.companyTotals || company.companyTotals || {};
    // folios may be top-level or via bookings
    const bookings = Array.isArray(company.bookings) ? company.bookings : [];
    const groups = Array.isArray(company.groups) ? company.groups : [];
    const foliosFromBookings = bookings.map(b => b.folio).filter(f => f);
    const foliosTop = Array.isArray(company.folios) ? company.folios : [];
    const folios = [...foliosTop, ...foliosFromBookings];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{company.name} <span className="text-sm text-gray-500">({company.code})</span></h1>
                    <p className="text-gray-600 mt-1">Property: {company.property?.name || "-"}</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => router.back()} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Back</button>
                    <button onClick={fetchCompany} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh</button>
                </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overview card */}
                <div className="border rounded shadow-sm p-4 bg-white">
                    <h3 className="font-semibold mb-2">Overview</h3>
                    <p><strong>Code:</strong> {company.code}</p>
                    <p><strong>Name:</strong> {company.name}</p>
                    <p><strong>Credit Limit:</strong> {company.creditLimit ?? "N/A"}</p>
                    <p><strong>Rate Agreement:</strong> {company.rateAgreement ?? "N/A"}</p>
                    <p><strong>Phone:</strong> {company.phone ?? "-"}</p>
                    <p className="text-sm text-gray-500 mt-2">ID: {company.id}</p>
                </div>

                {/* Totals card */}
                <div className="border rounded shadow-sm p-4 bg-white">
                    <h3 className="font-semibold mb-2">Financial Totals</h3>
                    <p><strong>Subtotal:</strong> ${Number(totals.subtotal || 0).toFixed(2)}</p>
                    <p><strong>Tax:</strong> ${Number(totals.taxTotal || 0).toFixed(2)}</p>
                    <p><strong>Total Charges:</strong> ${Number(totals.totalCharges || 0).toFixed(2)}</p>
                    <p><strong>Payments:</strong> ${Number(totals.totalPayments || 0).toFixed(2)}</p>
                    <p className="mt-2 font-bold text-green-600"><strong>Balance:</strong> ${Number(totals.balance || 0).toFixed(2)}</p>
                </div>

                {/* Quick actions / metadata */}
                <div className="border rounded shadow-sm p-4 bg-white">
                    <h3 className="font-semibold mb-2">Quick Actions</h3>
                    <p className="mb-2"><strong>Bookings:</strong> {bookings.length}</p>
                    <p className="mb-2"><strong>Groups:</strong> {groups.length}</p>
                    <p className="mb-2"><strong>Folios:</strong> {folios.length}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => router.push(`/companies/${company.id}/edit`)} className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit Company</button>
                        <button onClick={() => router.push(`/groupBookings?companyId=${company.id}`)} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">Rooming List</button>
                    </div>
                </div>
            </div>

            {/* Bookings card */}
            <div className="border rounded shadow-sm p-4 bg-white">
                <h3 className="font-semibold mb-3">Bookings ({bookings.length})</h3>
                {bookings.length === 0 ? <p className="text-gray-500">No bookings linked to this company.</p> : (
                    <div className="space-y-2">
                        {bookings.map(b => (
                            <div key={b.id} className="p-2 border rounded">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm"><strong>Booking #{b.id}</strong></div>
                                        <div className="text-sm text-gray-600">Guest: {b.guest?.firstName} {b.guest?.lastName}</div>
                                        <div className="text-sm text-gray-600">Room: {b.room?.number || "-"}</div>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div>Folio: {b.folio?.id || "-"}</div>
                                        <div>Balance: ${Number(b.folio?.balance || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Groups card */}
            <div className="border rounded shadow-sm p-4 bg-white">
                <h3 className="font-semibold mb-3">Groups ({groups.length})</h3>
                {groups.length === 0 ? <p className="text-gray-500">No groups linked to this company.</p> : (
                    <ul className="space-y-2">
                        {groups.map(g => (
                            <li key={g.id} className="p-2 border rounded flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{g.name}</div>
                                    <div className="text-sm text-gray-600">Leader: {g.leader?.firstName} {g.leader?.lastName || ""}</div>
                                </div>
                                <div className="text-sm text-gray-500">Start: {g.startDate ? new Date(g.startDate).toLocaleDateString() : "-"}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Folios card */}
            <div className="border rounded shadow-sm p-4 bg-white">
                <h3 className="font-semibold mb-3">Folios ({folios.length})</h3>
                {folios.length === 0 ? <p className="text-gray-500">No folios found for this company.</p> : (
                    <div className="space-y-2">
                        {folios.map(f => (
                            <div key={f.id} className="p-2 border rounded flex justify-between items-center">
                                <div>
                                    <div className="font-medium">Folio #{f.id}</div>
                                    <div className="text-sm text-gray-600">Status: {f.status || "-"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm">Charges: ${Number(f.totalCharges || f.charges?.reduce((s, c) => s + Number(c.amount || 0), 0) || 0).toFixed(2)}</div>
                                    <div className="text-sm">Payments: ${Number(f.totalPayments || f.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0).toFixed(2)}</div>
                                    <div className="font-bold text-green-600">Bal: ${Number(f.balance || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
