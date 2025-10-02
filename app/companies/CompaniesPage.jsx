// 'use client';
// import { useState, useEffect, useMemo, useRef } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import ProtectedPage from "@/app/components/ProtectedPage";
// import AddCompanyModal from "@/app/components/AddCompanyModal";
// import EditCompanyModal from "@/app/components/EditCompanyModal";

// export default function CompaniesPage({ session, userProperties }) {
//     const socket = useSocket();
//     const userRole = session?.user?.role || "FrontDesk";
//     const canAdd = ["Admin", "FrontDesk"].includes(userRole);
//     const canEdit = ["Admin", "FrontDesk"].includes(userRole);
//     const canDelete = ["Admin"].includes(userRole);
//     const canView = ["Admin", "FrontDesk", "Manager"].includes(userRole);

//     const [companies, setCompanies] = useState([]);
//     const [filteredCompanies, setFilteredCompanies] = useState([]);
//     const [properties, setProperties] = useState(userProperties || []);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterProperty, setFilterProperty] = useState("");
//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [editCompany, setEditCompany] = useState(null);
//     const [selectedCompany, setSelectedCompany] = useState(null);

//         const refreshTimeoutRef = useRef(null);

//     useEffect(() => {
//         if (!canView) return;
//         fetchCompanies();
//         if (!properties.length) fetchProperties();

//         if (socket) {
//             socket.on("COMPANY_ADDED", c => setCompanies(prev => [c, ...prev]));
//             socket.on("COMPANY_UPDATED", c => setCompanies(prev => prev.map(comp => comp.id === c.id ? c : comp)));
//             socket.on("COMPANY_DELETED", ({ id }) => setCompanies(prev => prev.filter(c => c.id !== id)));
//         }
//         return () => {
//             if (socket) {
//                 socket.off("COMPANY_ADDED");
//                 socket.off("COMPANY_UPDATED");
//                 socket.off("COMPANY_DELETED");
//             }
//         };
//     }, [socket, canView]);

//         useEffect(() => {
//         // initial load
//         fetchCompanies();
//         fetchProperties();
//         if (!canView) return;


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
//     }, [socket, canView]);

//         // --- Debounce search ---
//     useEffect(() => {
//         const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
//         return () => clearTimeout(handler);
//     }, [searchTerm]);


//     useEffect(() => {
//         let filtered = companies;
//         if (searchTerm.trim()) {
//             const term = searchTerm.toLowerCase();
//             filtered = filtered.filter(c =>
//                 c.name.toLowerCase().includes(term) ||
//                 c.code.toLowerCase().includes(term) ||
//                 (properties.find(p => p.id === c.propertyId)?.name || "").toLowerCase().includes(term)
//             );
//         }
//         if (filterProperty) filtered = filtered.filter(c => c.propertyId === filterProperty);
//         setFilteredCompanies(filtered);
//     }, [searchTerm, filterProperty, companies, properties]);

//     const fetchCompanies = async () => {
//         try {
//             const res = await fetch("/api/companies");
//             const data = await res.json();
//             setCompanies(data);
//             setFilteredCompanies(data);
//         } catch (err) { console.error(err); }
//     };

//     const fetchProperties = async () => {
//         try {
//             const res = await fetch("/api/properties");
//             const data = await res.json();
//             setProperties(data || []);
//         } catch (err) { console.error(err); }
//     };


//         const handleCompanyAdded = (newCompany) => {
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

//     if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

//     return (
//         <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
//                 <div className="flex flex-col w-full md:w-1/4">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
//                     <input type="text" placeholder="Search companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
//                 </div>
//                 <div className="flex flex-col w-full md:w-1/5">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
//                     <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white">
//                         <option value="">All Properties</option>
//                         {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>
//                 {canAdd && <div className="flex w-full md:w-auto">
//                     <button onClick={() => setAddModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Company</button>
//                 </div>}
//             </div>

//             {/* Companies Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {filteredCompanies.map(company => (
//                     <div
//                         key={company.id}
//                         className="p-5 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-4 hover:shadow-2xl transition-transform transform hover:scale-105"
//                     >
//                         {/* Header */}
//                         <div className="flex justify-between items-start mb-3">
//                             <div>
//                                 <h2 className="text-lg font-semibold text-gray-700 dark:text-white">{company.name}</h2>
//                                 <p className="text-sm text-gray-500 dark:text-gray-300">Code: {company.code}</p>
//                             </div>
//                             <div className="flex gap-2">
//                                 {canEdit && (
//                                     <button
//                                         onClick={e => { e.stopPropagation(); setEditCompany(company); }}
//                                         className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded"
//                                     >
//                                         Edit
//                                     </button>
//                                 )}
//                                 {canDelete && (
//                                     <button
//                                         onClick={e => { e.stopPropagation(); handleDelete(company.id); }}
//                                         className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
//                                     >
//                                         Delete
//                                     </button>
//                                 )}
//                             </div>
//                         </div>

//                         {/* KPI / Summary */}
//                         <div className="grid grid-cols-2 gap-2 text-sm mb-3">
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Property</span>
//                                 <span className="font-medium">{properties.find(p => p.id === company.propertyId)?.name || "-"}</span>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Credit Limit</span>
//                                 <span className="font-medium">{company.creditLimit ?? "-"}</span>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Rate Agreement</span>
//                                 <span className="font-medium">{company.rateAgreement ?? "-"}</span>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 dark:text-gray-300">Total Balance</span>
//                                 <span className="font-bold text-red-600">{company.companyTotals?.balance ?? 0}</span>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//                 {filteredCompanies.length === 0 && <p className="col-span-full text-center text-gray-500">No companies found.</p>}
//             </div>

//             {/* Modals */}
//             {addModalOpen && <AddCompanyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} properties={properties} onCompanyAdded={c => { setCompanies([c, ...companies]); setAddModalOpen(false); }} />}
//             {editCompany && <EditCompanyModal isOpen={!!editCompany} onClose={() => setEditCompany(null)} company={editCompany} properties={properties} onCompanyUpdated={c => { setCompanies(companies.map(comp => comp.id === c.id ? c : comp)); setEditCompany(null); }} />}

//         </div>
//     );
// }




'use client';
import { useState, useEffect, useMemo, useRef } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddCompanyModal from "@/app/components/AddCompanyModal";
import EditCompanyModal from "@/app/components/EditCompanyModal";
import ConfirmationModal from "@/app/components/ConfirmationModal";

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
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [filterCreditFrom, setFilterCreditFrom] = useState("");
    const [filterCreditTo, setFilterCreditTo] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editCompany, setEditCompany] = useState(null);
    const [deleteCompany, setDeleteCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const refreshTimeoutRef = useRef(null);

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

    // --- Fetch Companies & Properties ---
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
        if (!canView) return;
        fetchCompanies();
        if (!properties.length) fetchProperties();
    }, [canView]);

    // --- Filter + Search + Date + Credit ---
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

        if (filterDateFrom) filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(filterDateFrom));
        if (filterDateTo) filtered = filtered.filter(c => new Date(c.createdAt) <= new Date(filterDateTo));

        if (filterCreditFrom) filtered = filtered.filter(c => (c.creditLimit ?? 0) >= Number(filterCreditFrom));
        if (filterCreditTo) filtered = filtered.filter(c => (c.creditLimit ?? 0) <= Number(filterCreditTo));

        setFilteredCompanies(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterProperty, filterDateFrom, filterDateTo, filterCreditFrom, filterCreditTo, companies, properties]);

    const paginatedCompanies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCompanies.slice(start, start + itemsPerPage);
    }, [filteredCompanies, currentPage]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/companies");
            const data = await res.json();
            setCompanies(data);
            setFilteredCompanies(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            setProperties(data || []);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (companyId) => {
        try {
            const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete company");
            setCompanies(prev => prev.filter(c => c.id !== companyId));
            setDeleteCompany(null);
        } catch (err) { console.error(err); alert(err.message); }
    };

    // عند الضغط على زر الحذف
    const handleDeleteClick = (company) => {
        setDeleteCompany(company);
    };

    // تنفيذ الحذف بعد التأكيد
    const handleDeleteConfirm = async () => {
        if (!deleteCompany) return;

        try {
            setLoadingDelete(true); // شغّل الـ spinner
            const res = await fetch(`/api/companies/${deleteCompany.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete company");

            // تحديث القوائم
            setCompanies(prev => prev.filter(c => c.id !== deleteCompany.id));
            setFilteredCompanies(prev => prev.filter(c => c.id !== deleteCompany.id));

            // إذا كنت تستخدم Socket
            if (socket) socket.emit("COMPANY_DELETED", { id: deleteCompany.id });

        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setDeleteCompany(null); // اغلق المودال
            setLoadingDelete(false); // أوقف الـ spinner
        }
    };

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/5">
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
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From Date</label>
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To Date</label>
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Credit From</label>
                    <input type="number" placeholder="0" value={filterCreditFrom} onChange={e => setFilterCreditFrom(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-col w-full md:w-1/6">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Credit To</label>
                    <input type="number" placeholder="0" value={filterCreditTo} onChange={e => setFilterCreditTo(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white" />
                </div>
                {canAdd && <div className="flex w-full md:w-auto">
                    <button onClick={() => setAddModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Company</button>
                </div>}
            </div>

            {/* Loading Spinner */}
            {loading && (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Companies Grid */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedCompanies.map(company => (
                        <div key={company.id}
                            className="p-5 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-4 hover:shadow-2xl transition-transform transform hover:scale-105">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-700 dark:text-white">{company.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Code: {company.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    {canEdit && <button onClick={() => setEditCompany(company)}
                                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded">Edit</button>}
                                    {canDelete && (
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDeleteClick(company); }}
                                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Property</span>
                                    <span className="font-medium">{properties.find(p => p.id === company.propertyId)?.name || "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Credit Limit</span>
                                    <span className="font-medium">{company.creditLimit ?? "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Rate Agreement</span>
                                    <span className="font-medium">{company.rateAgreement ?? "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 dark:text-gray-300">Total Balance</span>
                                    <span className="font-bold text-red-600">{company.companyTotals?.balance ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {paginatedCompanies.length === 0 && <p className="col-span-full text-center text-gray-500">No companies found.</p>}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
                <div className="flex justify-center mt-6 gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{page}</button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Next</button>
                </div>
            )}

            {/* Modals */}
            {addModalOpen && <AddCompanyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} properties={properties}
                onCompanyAdded={c => { setCompanies([c, ...companies]); setAddModalOpen(false); }} />}
            {editCompany && <EditCompanyModal isOpen={!!editCompany} onClose={() => setEditCompany(null)} company={editCompany} properties={properties}
                onCompanyUpdated={c => { setCompanies(companies.map(comp => comp.id === c.id ? c : comp)); setEditCompany(null); }} />}
            {deleteCompany && (
                <ConfirmationModal
                    open={!!deleteCompany}
                    title="Confirm Delete"
                    message={`Are you sure you want to delete "${deleteCompany.name}"?`}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setDeleteCompany(null)}
                />
            )}
        </div>
    );
}
