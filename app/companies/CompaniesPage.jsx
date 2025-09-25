// 'use client';
// import { useState, useEffect, useMemo, useRef } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import ProtectedPage from "@/app/components/ProtectedPage";
// import AddCompanyModal from "@/app/components/AddCompanyModal";
// import EditCompanyModal from "@/app/components/EditCompanyModal";
// import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

// // --- Card Components داخل الصفحة ---
// const Card = ({ children, className }) => (
//     <div className={`border rounded shadow p-4 bg-white ${className}`}>{children}</div>
// );

// const CardContent = ({ children }) => (
//     <div className="space-y-1">{children}</div>
// );

// export default function CompaniesPage({ session }) {
//     const socket = useSocket();

//     const role = session?.user?.role || "Guest";
//     const canAdd = ["Admin", "FrontDesk"].includes(role);
//     const canEdit = ["Admin", "FrontDesk"].includes(role);
//     const canDelete = ["Admin"].includes(role);

//     const [companies, setCompanies] = useState([]);
//     const [properties, setProperties] = useState([]);
//     const [searchTerm, setSearchTerm] = useState("");
//         const [filteredCompanies, setFilteredCompanies] = useState([]);
//         const [filterProperty, setFilterProperty] = useState("");
//     const [editCompany, setEditCompany] = useState(null);

//     const [debouncedSearch, setDebouncedSearch] = useState("");
//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [editModalOpen, setEditModalOpen] = useState(false);
//     const [selectedCompany, setSelectedCompany] = useState(null);

//     const refreshTimeoutRef = useRef(null);

//     // --- Fetch Companies ---
//     const fetchCompanies = async () => {
//         try {
//             const res = await fetch("/api/companies");
//             const data = await res.json();
//             if (Array.isArray(data)) setCompanies(data);
//         } catch (err) { console.error("Failed to fetch companies:", err); }
//     };

//     const fetchProperties = async () => {
//         try {
//             const res = await fetch("/api/properties");
//             const data = await res.json();
//             if (Array.isArray(data)) setProperties(data);
//         } catch (err) { console.error(err); }
//     };

//     useEffect(() => {
//         // initial load
//         fetchCompanies();
//         fetchProperties();

//         if (!socket) return;

//         // ---- handlers for company CRUD (existing) ----
//         const onCompanyAdded = (company) => setCompanies(prev => Array.isArray(prev) ? [company, ...prev] : [company]);
//         const onCompanyUpdated = (updatedCompany) => setCompanies(prev => Array.isArray(prev) ? prev.map(c => c.id === updatedCompany.id ? updatedCompany : c) : [updatedCompany]);
//         const onCompanyDeleted = ({ id }) => setCompanies(prev => Array.isArray(prev) ? prev.filter(c => c.id !== id) : []);

//         // ---- handler for folio/booking changes: just refresh companies (debounced) ----
//         const onFolioChange = () => {
//             // debounce to avoid many immediate fetches when server emits several events
//             if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
//             refreshTimeoutRef.current = setTimeout(() => {
//                 fetchCompanies();
//                 refreshTimeoutRef.current = null;
//             }, 250); // 250ms debounce (tweakable)
//         };

//         // subscribe
//         socket.on("COMPANY_ADDED", onCompanyAdded);
//         socket.on("COMPANY_UPDATED", onCompanyUpdated);
//         socket.on("COMPANY_DELETED", onCompanyDeleted);

//         // folio/booking events that should update company totals
//         const folioEvents = [
//             "CHARGE_ADDED",
//             "CHARGE_DELETED",
//             "PAYMENT_ADDED",
//             "PAYMENT_DELETED",
//             "FOLIO_CREATED",
//             "FOLIO_CLOSED",
//             "BOOKING_CREATED",
//             "BOOKING_UPDATED",
//             "BOOKING_DELETED"
//         ];
//         folioEvents.forEach(ev => socket.on(ev, onFolioChange));

//         // cleanup
//         return () => {
//             socket.off("COMPANY_ADDED", onCompanyAdded);
//             socket.off("COMPANY_UPDATED", onCompanyUpdated);
//             socket.off("COMPANY_DELETED", onCompanyDeleted);
//             folioEvents.forEach(ev => socket.off(ev, onFolioChange));
//             if (refreshTimeoutRef.current) {
//                 clearTimeout(refreshTimeoutRef.current);
//                 refreshTimeoutRef.current = null;
//             }
//         };
//     }, [socket]);

//     // --- Debounce search ---
//     useEffect(() => {
//         const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
//         return () => clearTimeout(handler);
//     }, [searchTerm]);

//     // --- Table Columns ---
//     const columns = useMemo(() => [
//         { Header: "Code", accessor: "code" },
//         { Header: "Name", accessor: "name" },
//         { Header: "Property", accessor: row => properties.find(p => p.id === row.propertyId)?.name || "-" },
//         { Header: "Credit Limit", accessor: "creditLimit" },
//         { Header: "Rate Agreement", accessor: "rateAgreement" },
//         {
//             Header: "Total Balance",
//             accessor: row => row.companyTotals?.balance ?? 0,
//         },
//         {
//             Header: "Actions",
//             accessor: "actions",
//             Cell: ({ row }) => (
//                 <div className="flex gap-2">
//                     {canEdit && <button onClick={() => handleEdit(row.original)} className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit</button>}
//                     {canDelete && <button onClick={() => handleDelete(row.original.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>}
//                 </div>
//             )
//         }
//     ], [properties]);

//     const data = useMemo(() => {
//         if (!debouncedSearch) return companies;
//         return companies.filter(c =>
//             c.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
//             c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
//             (properties.find(p => p.id === c.propertyId)?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())
//         );
//     }, [companies, debouncedSearch, properties]);

//     const {
//         getTableProps,
//         getTableBodyProps,
//         headerGroups,
//         page,
//         prepareRow,
//         canPreviousPage,
//         canNextPage,
//         pageOptions,
//         state: { pageIndex, pageSize },
//         previousPage,
//         nextPage,
//         setPageSize
//     } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize: 10 } }, useGlobalFilter, useSortBy, usePagination);

//     // --- Handlers ---
//     const handleCompanyAdded = (newCompany) => {
//         setCompanies(prev => Array.isArray(prev) ? [newCompany, ...prev] : [newCompany]);
//         if (socket) socket.emit("COMPANY_ADDED", newCompany);
//         setAddModalOpen(false);
//     };

//     const handleEdit = (company) => {
//         setSelectedCompany(company);
//         setEditModalOpen(true);
//     };

//     const handleCompanyUpdated = (updatedCompany) => {
//         setCompanies(prev => Array.isArray(prev) ? prev.map(c => c.id === updatedCompany.id ? updatedCompany : c) : [updatedCompany]);
//         if (socket) socket.emit("COMPANY_UPDATED", updatedCompany);
//         setEditModalOpen(false);
//     };

//     const handleDelete = async (companyId) => {
//         if (!confirm("Are you sure you want to delete this company?")) return;
//         try {
//             const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
//             if (!res.ok) throw new Error("Failed to delete company");
//             setCompanies(prev => Array.isArray(prev) ? prev.filter(c => c.id !== companyId) : []);
//             if (socket) socket.emit("COMPANY_DELETED", { id: companyId });
//         } catch (err) { console.error(err); alert(err.message); }
//     };

//     return (
//         <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
//             <div className="p-4 space-y-4">
//                 <div className="flex justify-between items-center">
//                     <h2 className="text-xl font-bold">Companies</h2>
//                     <div className="flex gap-2 items-center">
//                         <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
//                             className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
//                         {canAdd && <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Company</button>}
//                     </div>
//                 </div>

//                 {/* Companies Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {companies.map(company => (
//                         <Card key={company.id}>
//                             <CardContent>
//                                 <h3 className="font-bold text-lg">{company.name}</h3>
//                                 <p><strong>Code:</strong> {company.code}</p>
//                                 <p><strong>Property:</strong> {properties.find(p => p.id === company.propertyId)?.name || "-"}</p>
//                                 <p><strong>Credit Limit:</strong> {company.creditLimit ?? "-"}</p>
//                                 <p><strong>Rate Agreement:</strong> {company.rateAgreement ?? "-"}</p>
//                                 <p><strong>Total Balance:</strong> {company.companyTotals?.balance ?? 0}</p>

//                                 <div className="mt-2">
//                                     <h4 className="font-semibold">Guests:</h4>
//                                     <ul className="list-disc list-inside text-sm">
//                                         {company.folios?.flatMap(f => f.guests || []).map(g => (
//                                             <li key={g.id}>{g.firstName} {g.lastName}</li>
//                                         ))}
//                                         {company.bookings?.flatMap(b => b.folio?.guests || []).map(g => (
//                                             <li key={g.id}>{g.firstName} {g.lastName}</li>
//                                         ))}
//                                     </ul>
//                                 </div>

//                                 <div className="flex gap-2 mt-2">
//                                     {canEdit && <button onClick={() => handleEdit(company)} className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit</button>}
//                                     {canDelete && <button onClick={() => handleDelete(company.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>}
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     ))}
//                     {companies.length === 0 && <p className="col-span-full text-center text-gray-500">No companies found.</p>}
//                 </div>

//                 {/* Modals */}
//                 {addModalOpen && <AddCompanyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} properties={properties} onCompanyAdded={handleCompanyAdded} />}
//                 {editModalOpen && selectedCompany && <EditCompanyModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} company={selectedCompany} properties={properties} onCompanyUpdated={handleCompanyUpdated} />}

//             </div>
//         </ProtectedPage>
//     );
// }


'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import ProtectedPage from "@/app/components/ProtectedPage";
import AddCompanyModal from "@/app/components/AddCompanyModal";
import EditCompanyModal from "@/app/components/EditCompanyModal";

export default function CompaniesPage({ session, userProperties }) {
    const socket = useSocket();
    const userRole = session?.user?.role || "FrontDesk";
    const canAdd = ["Admin", "FrontDesk"].includes(userRole);
    const canEdit = ["Admin", "FrontDesk"].includes(userRole);
    const canDelete = ["Admin"].includes(userRole);
    const canView = ["Admin", "FrontDesk", "Manager"].includes(userRole);

    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [properties, setProperties] = useState(userProperties || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editCompany, setEditCompany] = useState(null);

    useEffect(() => {
        if (!canView) return;
        fetchCompanies();
        if (!properties.length) fetchProperties();

        if (socket) {
            socket.on("COMPANY_ADDED", c => setCompanies(prev => [c, ...prev]));
            socket.on("COMPANY_UPDATED", c => setCompanies(prev => prev.map(comp => comp.id === c.id ? c : comp)));
            socket.on("COMPANY_DELETED", ({ id }) => setCompanies(prev => prev.filter(c => c.id !== id)));
        }
        return () => {
            if (socket) {
                socket.off("COMPANY_ADDED");
                socket.off("COMPANY_UPDATED");
                socket.off("COMPANY_DELETED");
            }
        };
    }, [socket, canView]);

    useEffect(() => {
        let filtered = companies;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.code.toLowerCase().includes(term) ||
                (properties.find(p => p.id === c.propertyId)?.name || "").toLowerCase().includes(term)
            );
        }
        if (filterProperty) filtered = filtered.filter(c => c.propertyId === filterProperty);
        setFilteredCompanies(filtered);
    }, [searchTerm, filterProperty, companies, properties]);

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies");
            const data = await res.json();
            setCompanies(data);
            setFilteredCompanies(data);
        } catch (err) { console.error(err); }
    };

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            setProperties(data || []);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (companyId) => {
        if (!confirm("Delete this company?")) return;
        try {
            const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete company");
            setCompanies(prev => prev.filter(c => c.id !== companyId));
            if (socket) socket.emit("COMPANY_DELETED", { id: companyId });
        } catch (err) { console.error(err); alert(err.message); }
    };

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input type="text" placeholder="Search companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                    <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                {canAdd && <div className="flex w-full md:w-auto">
                    <button onClick={() => setAddModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Company</button>
                </div>}
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map(company => (
                    <div key={company.id} className="p-5 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-4 hover:shadow-2xl transition-transform transform hover:scale-105">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-700 dark:text-white">{company.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Code: {company.code}</p>
                            </div>
                            <div className="flex gap-2">
                                {canEdit && <button onClick={e => { e.stopPropagation(); setEditCompany(company); }} className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded text-xs font-medium">✏️ Edit</button>}
                                {canDelete && <button onClick={e => { e.stopPropagation(); handleDelete(company.id); }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium">🗑 Delete</button>}
                            </div>
                        </div>

                        {/* Company Info */}
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <p><span className="font-semibold">Property:</span> {properties.find(p => p.id === company.propertyId)?.name || "-"}</p>
                            <p><span className="font-semibold">Credit Limit:</span> {company.creditLimit ?? "-"}</p>
                            <p><span className="font-semibold">Rate Agreement:</span> {company.rateAgreement ?? "-"}</p>
                            <p><span className="font-semibold">Total Balance:</span> {company.companyTotals?.balance ?? 0}</p>
                        </div>

                    </div>
                ))}
                {filteredCompanies.length === 0 && <p className="col-span-full text-center text-gray-500">No companies found.</p>}
            </div>

            {/* Modals */}
            {addModalOpen && <AddCompanyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} properties={properties} onCompanyAdded={c => { setCompanies([c, ...companies]); setAddModalOpen(false); }} />}
            {editCompany && <EditCompanyModal isOpen={!!editCompany} onClose={() => setEditCompany(null)} company={editCompany} properties={properties} onCompanyUpdated={c => { setCompanies(companies.map(comp => comp.id === c.id ? c : comp)); setEditCompany(null); }} />}

        </div>
    );
}



