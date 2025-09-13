'use client';
import { useState, useEffect } from "react";
import AddCompanyModal from "@/app/components/AddCompanyModal";
import EditCompanyModal from "@/app/components/EditCompanyModal";
import { useSocket } from "@/app/components/SocketProvider";

export default function CompaniesPageClient({ session, userProperties }) {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editCompany, setEditCompany] = useState(null);

    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const canAddEdit = ["Admin", "Manager"].includes(role);
    const canDelete = role === "Admin";
    const canView = ["Admin", "Manager", "FrontDesk"].includes(role);

    // 🔹 Fetch companies
    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies");
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("Invalid companies data");
            setCompanies(data);
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    useEffect(() => {
        if (!canView) return;

        fetchCompanies();

        // 🔹 Socket events
        if (socket) {
            socket.on("COMPANY_CREATED", (company) => setCompanies(prev => [company, ...prev]));
            socket.on("COMPANY_UPDATED", (updated) => setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c)));
            socket.on("COMPANY_DELETED", (deleted) => setCompanies(prev => prev.filter(c => c.id !== deleted.id)));
        }

        return () => {
            if (socket) {
                socket.off("COMPANY_CREATED");
                socket.off("COMPANY_UPDATED");
                socket.off("COMPANY_DELETED");
            }
        };
    }, [socket, canView]);

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
                {canAddEdit && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        + Add Company
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map(company => (
                    <div
                        key={company.id}
                        className="p-4 rounded-lg shadow cursor-pointer hover:scale-105 transition transform bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onClick={() => setSelectedCompany(company)}
                    >
                        <h2 className="text-lg font-semibold">{company.name}</h2>
                        <p className="text-sm text-gray-500">Code: {company.code}</p>
                        <p className="text-sm text-gray-500">Property: {company.property?.name || "N/A"}</p>
                    </div>
                ))}
            </div>

            {/* 🔹 View / Edit Company */}
            {selectedCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{selectedCompany.name}</h2>
                            <div className="flex gap-1">
                                {canAddEdit && (
                                    <button
                                        onClick={() => setEditCompany(selectedCompany)}
                                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                                    >
                                        ✏️ Edit
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm(`Are you sure you want to delete ${selectedCompany.name}?`)) return;
                                            try {
                                                const res = await fetch(`/api/companies?id=${selectedCompany.id}`, { method: "DELETE" });
                                                const data = await res.json();
                                                if (!res.ok) throw new Error(data.error || "Failed to delete company");

                                                setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id));
                                                setSelectedCompany(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert(err.message);
                                            }
                                        }}
                                        className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                                    >
                                        🗑 Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p><b>Code:</b> {selectedCompany.code}</p>
                            <p><b>Property:</b> {selectedCompany.property?.name || "N/A"}</p>
                            <p><b>Credit Limit:</b> {selectedCompany.creditLimit || "N/A"}</p>
                            <p><b>Rate Agreement:</b> {selectedCompany.rateAgreement || "N/A"}</p>
                        </div>

                        <div className="mt-4 text-right">
                            <button onClick={() => setSelectedCompany(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 Add / Edit Modals */}
            {showAddModal && canAddEdit && (
                <AddCompanyModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    properties={userProperties}
                    onSaved={() => setShowAddModal(false)}
                />
            )}

            {editCompany && canAddEdit && (
                <EditCompanyModal
                    company={editCompany}
                    isOpen={!!editCompany}
                    onClose={() => setEditCompany(null)}
                    properties={userProperties}
                    onSaved={() => setEditCompany(null)}
                />
            )}
        </div>
    );
}
