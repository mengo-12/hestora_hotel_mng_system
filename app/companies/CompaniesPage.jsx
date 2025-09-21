'use client';
import { useState, useEffect, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import ProtectedPage from "@/app/components/ProtectedPage";
import AddCompanyModal from "@/app/components/AddCompanyModal";
import EditCompanyModal from "@/app/components/EditCompanyModal";
import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

// --- Card Components داخل الصفحة ---
const Card = ({ children, className }) => (
    <div className={`border rounded shadow p-4 bg-white ${className}`}>{children}</div>
);

const CardContent = ({ children }) => (
    <div className="space-y-1">{children}</div>
);

export default function CompaniesPage({ session }) {
    const socket = useSocket();

    const role = session?.user?.role || "Guest";
    const canAdd = ["Admin", "FrontDesk"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);

    const [companies, setCompanies] = useState([]);
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    // --- Fetch Companies ---
    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies");
            const data = await res.json();
            if (Array.isArray(data)) setCompanies(data);
        } catch (err) { console.error("Failed to fetch companies:", err); }
    };

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            if (Array.isArray(data)) setProperties(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchCompanies();
        fetchProperties();

        if (!socket) return;

        socket.on("COMPANY_ADDED", (company) => setCompanies(prev => Array.isArray(prev) ? [company, ...prev] : [company]));
        socket.on("COMPANY_UPDATED", (updatedCompany) => setCompanies(prev => Array.isArray(prev) ? prev.map(c => c.id === updatedCompany.id ? updatedCompany : c) : [updatedCompany]));
        socket.on("COMPANY_DELETED", ({ id }) => setCompanies(prev => Array.isArray(prev) ? prev.filter(c => c.id !== id) : []));

        return () => {
            socket.off("COMPANY_ADDED");
            socket.off("COMPANY_UPDATED");
            socket.off("COMPANY_DELETED");
        };
    }, [socket]);

    // --- Debounce search ---
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- Table Columns ---
    const columns = useMemo(() => [
        { Header: "Code", accessor: "code" },
        { Header: "Name", accessor: "name" },
        { Header: "Property", accessor: row => properties.find(p => p.id === row.propertyId)?.name || "-" },
        { Header: "Credit Limit", accessor: "creditLimit" },
        { Header: "Rate Agreement", accessor: "rateAgreement" },
        {
            Header: "Total Balance",
            accessor: row => row.companyTotals?.balance ?? 0,
        },
        {
            Header: "Actions",
            accessor: "actions",
            Cell: ({ row }) => (
                <div className="flex gap-2">
                    {canEdit && <button onClick={() => handleEdit(row.original)} className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit</button>}
                    {canDelete && <button onClick={() => handleDelete(row.original.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>}
                </div>
            )
        }
    ], [properties]);

    const data = useMemo(() => {
        if (!debouncedSearch) return companies;
        return companies.filter(c =>
            c.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (properties.find(p => p.id === c.propertyId)?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [companies, debouncedSearch, properties]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        state: { pageIndex, pageSize },
        previousPage,
        nextPage,
        setPageSize
    } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize: 10 } }, useGlobalFilter, useSortBy, usePagination);

    // --- Handlers ---
    const handleCompanyAdded = (newCompany) => {
        setCompanies(prev => Array.isArray(prev) ? [newCompany, ...prev] : [newCompany]);
        if (socket) socket.emit("COMPANY_ADDED", newCompany);
        setAddModalOpen(false);
    };

    const handleEdit = (company) => {
        setSelectedCompany(company);
        setEditModalOpen(true);
    };

    const handleCompanyUpdated = (updatedCompany) => {
        setCompanies(prev => Array.isArray(prev) ? prev.map(c => c.id === updatedCompany.id ? updatedCompany : c) : [updatedCompany]);
        if (socket) socket.emit("COMPANY_UPDATED", updatedCompany);
        setEditModalOpen(false);
    };

    const handleDelete = async (companyId) => {
        if (!confirm("Are you sure you want to delete this company?")) return;
        try {
            const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete company");
            setCompanies(prev => Array.isArray(prev) ? prev.filter(c => c.id !== companyId) : []);
            if (socket) socket.emit("COMPANY_DELETED", { id: companyId });
        } catch (err) { console.error(err); alert(err.message); }
    };

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <div className="p-4 space-y-4">

                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Companies</h2>
                    <div className="flex gap-2 items-center">
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        {canAdd && <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Company</button>}
                    </div>
                </div>

                {/* Companies Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map(company => (
                        <Card key={company.id}>
                            <CardContent>
                                <h3 className="font-bold text-lg">{company.name}</h3>
                                <p><strong>Code:</strong> {company.code}</p>
                                <p><strong>Property:</strong> {properties.find(p => p.id === company.propertyId)?.name || "-"}</p>
                                <p><strong>Credit Limit:</strong> {company.creditLimit ?? "-"}</p>
                                <p><strong>Rate Agreement:</strong> {company.rateAgreement ?? "-"}</p>
                                <p><strong>Total Balance:</strong> {company.companyTotals?.balance ?? 0}</p>

                                <div className="mt-2">
                                    <h4 className="font-semibold">Guests:</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        {company.folios?.flatMap(f => f.guests || []).map(g => (
                                            <li key={g.id}>{g.firstName} {g.lastName}</li>
                                        ))}
                                        {company.bookings?.flatMap(b => b.folio?.guests || []).map(g => (
                                            <li key={g.id}>{g.firstName} {g.lastName}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex gap-2 mt-2">
                                    {canEdit && <button onClick={() => handleEdit(company)} className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500">Edit</button>}
                                    {canDelete && <button onClick={() => handleDelete(company.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {companies.length === 0 && <p className="col-span-full text-center text-gray-500">No companies found.</p>}
                </div>

                {/* Modals */}
                {addModalOpen && <AddCompanyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} properties={properties} onCompanyAdded={handleCompanyAdded} />}
                {editModalOpen && selectedCompany && <EditCompanyModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} company={selectedCompany} properties={properties} onCompanyUpdated={handleCompanyUpdated} />}

            </div>
        </ProtectedPage>
    );
}


