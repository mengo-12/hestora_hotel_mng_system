'use client';
import { useState, useEffect, useMemo } from "react";
import AddCompanyModal from "@/app/components/AddCompanyModal";
import EditCompanyModal from "@/app/components/EditCompanyModal";
import { useSocket } from "@/app/components/SocketProvider";
import ProtectedPage from "@/app/components/ProtectedPage";
import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

export default function CompaniesPage({ session }) {
    const socket = useSocket();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const role = session?.user?.role || "Guest";
    const canAdd = ["Admin", "FrontDesk"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);

    // --- Fetch Companies ---
    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies");
            const data = await res.json();
            setCompanies(data || []);
        } catch (err) {
            console.error("Failed to fetch companies:", err);
        }
    };

    // --- Fetch Properties ---
    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            setProperties(data || []);
        } catch (err) {
            console.error("Failed to fetch properties:", err);
        }
    };

    useEffect(() => {
        fetchCompanies();
        fetchProperties();

        if (!socket) return;

        // Global socket broadcast
        socket.on("COMPANY_ADDED", (company) => setCompanies(prev => [company, ...prev]));
        socket.on("COMPANY_UPDATED", (updatedCompany) =>
            setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c))
        );
        socket.on("COMPANY_DELETED", ({ id }) =>
            setCompanies(prev => prev.filter(c => c.id !== id))
        );

        return () => {
            socket.off("COMPANY_ADDED");
            socket.off("COMPANY_UPDATED");
            socket.off("COMPANY_DELETED");
        };
    }, [socket]);

    // --- Debounce search ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300); // 300ms debounce
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Table columns
    const columns = useMemo(() => [
        { Header: "Code", accessor: "code" },
        { Header: "Name", accessor: "name" },
        { Header: "Property", accessor: row => properties.find(p => p.id === row.propertyId)?.name || "-" },
        { Header: "Credit Limit", accessor: "creditLimit" },
        { Header: "Rate Agreement", accessor: "rateAgreement" },
        {
            Header: "Actions",
            accessor: "actions",
            Cell: ({ row }) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <button
                            onClick={() => handleEdit(row.original)}
                            className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                        >Edit</button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDelete(row.original.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >Delete</button>
                    )}
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

    const handleCompanyAdded = (newCompany) => {
        setCompanies(prev => [newCompany, ...prev]);
        if (socket) socket.emit("COMPANY_ADDED", newCompany);
    };

    const handleEdit = (company) => {
        setSelectedCompany(company);
        setEditModalOpen(true);
    };

    const handleCompanyUpdated = (updatedCompany) => {
        setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
        setEditModalOpen(false);
        if (socket) socket.emit("COMPANY_UPDATED", updatedCompany);
    };

    const handleDelete = async (companyId) => {
        if (!confirm("Are you sure you want to delete this company?")) return;
        try {
            const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete company");
            setCompanies(prev => prev.filter(c => c.id !== companyId));
            if (socket) socket.emit("COMPANY_DELETED", { id: companyId });
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const exportCSV = () => {
        const headers = ["Code", "Name", "Property", "Credit Limit", "Rate Agreement"];
        const rows = companies.map(c => [
            c.code,
            c.name,
            properties.find(p => p.id === c.propertyId)?.name || "",
            c.creditLimit ?? "",
            c.rateAgreement ?? ""
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...rows].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "companies.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const printContent = document.getElementById("companies-table")?.outerHTML;
        if (!printContent) return;
        const newWindow = window.open("", "_blank");
        newWindow.document.write(`
            <html>
                <head>
                    <title>Companies</title>
                    <style>
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                        th { background-color: #f0f0f0; }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        newWindow.document.close();
        newWindow.print();
    };

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <div className="p-4 space-y-4">

                {/* Header: Search + Actions */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Companies</h2>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Search by code, name, or property..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Print
                        </button>
                        {canAdd && (
                            <button
                                onClick={() => setAddModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >Add Company</button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border rounded" id="companies-table">
                    <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            className="px-3 py-2 text-left text-sm font-medium text-gray-700"
                                        >
                                            {column.render("Header")}
                                            <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                            {page.map(row => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()} className="hover:bg-gray-50">
                                        {row.cells.map(cell => (
                                            <td {...cell.getCellProps()} className="px-3 py-2 text-sm">
                                                {cell.render("Cell")}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-2">
                    <span className="text-sm">
                        Page {pageIndex + 1} of {pageOptions.length}
                    </span>
                    <div className="flex gap-2 items-center">
                        <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">Previous</button>
                        <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">Next</button>
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                </div>

                {/* Modals */}
                {addModalOpen && (
                    <AddCompanyModal
                        isOpen={addModalOpen}
                        onClose={() => setAddModalOpen(false)}
                        properties={properties}
                        onCompanyAdded={handleCompanyAdded}
                    />
                )}
                {selectedCompany && (
                    <EditCompanyModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        company={selectedCompany}
                        properties={properties}
                        onCompanyUpdated={handleCompanyUpdated}
                    />
                )}

            </div>
        </ProtectedPage>
    );
}
