// 'use client';
// import { useState, useEffect, useMemo } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import ProtectedPage from "@/app/components/ProtectedPage";
// import AddGroupModal from "@/app/components/AddGroupModal";
// import EditGroupModal from "@/app/components/EditGroupModal";
// import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

// export default function GroupsPage({ session, userProperties }) {
//     const socket = useSocket();

//     // --- States ---
//     const [groups, setGroups] = useState([]);
//     const [companies, setCompanies] = useState([]);
//     const [guests, setGuests] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [editModalOpen, setEditModalOpen] = useState(false);
//     const [selectedGroup, setSelectedGroup] = useState(null);

//     const [searchTerm, setSearchTerm] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState("");

//     // --- Roles & Permissions ---
//     const role = session?.user?.role || "Guest";
//     const canAdd = ["Admin", "FrontDesk", "Manager"].includes(role);
//     const canEdit = ["Admin", "FrontDesk", "Manager"].includes(role);
//     const canDelete = ["Admin"].includes(role);

//     // --- Fetch Data ---
//     const fetchGroups = async () => {
//         try {
//             setLoading(true);
//             const res = await fetch("/api/groups");
//             const data = await res.json();
//             setGroups(data || []);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchCompanies = async () => {
//         try {
//             const res = await fetch("/api/companies");
//             const data = await res.json();
//             setCompanies(data || []);
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     const fetchGuests = async () => {
//         try {
//             const res = await fetch("/api/guests");
//             const data = await res.json();
//             setGuests(data || []);
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     useEffect(() => {
//         fetchGroups();
//         fetchCompanies();
//         fetchGuests();

//         if (!socket) return;

//         // 🔔 Socket broadcast
//         socket.on("GROUP_CREATED", (group) => setGroups(prev => [group, ...prev]));
//         socket.on("GROUP_UPDATED", (updatedGroup) =>
//             setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g))
//         );
//         socket.on("GROUP_DELETED", ({ id }) =>
//             setGroups(prev => prev.filter(g => g.id !== id))
//         );

//         return () => {
//             socket.off("GROUP_CREATED");
//             socket.off("GROUP_UPDATED");
//             socket.off("GROUP_DELETED");
//         };
//     }, [socket]);

//     // --- Debounce search ---
//     useEffect(() => {
//         const handler = setTimeout(() => {
//             setDebouncedSearch(searchTerm);
//         }, 300);
//         return () => clearTimeout(handler);
//     }, [searchTerm]);

//     // --- Table Columns ---
//     const columns = useMemo(() => [
//         { Header: "Code", accessor: "code" },
//         { Header: "Name", accessor: "name" },
//         { Header: "Property", accessor: row => userProperties.find(p => p.id === row.propertyId)?.name || "-" },
//         { Header: "Company", accessor: row => row.company?.name || "-" },
//         { Header: "Leader", accessor: row => row.leader ? `${row.leader.firstName} ${row.leader.lastName}` : "-" },
//         {
//             Header: "Actions",
//             accessor: "actions",
//             Cell: ({ row }) => (
//                 <div className="flex gap-2">
//                     {canEdit && (
//                         <button
//                             onClick={() => { setSelectedGroup(row.original); setEditModalOpen(true); }}
//                             className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
//                         >
//                             Edit
//                         </button>
//                     )}
//                     {canDelete && (
//                         <button
//                             onClick={() => handleDelete(row.original.id)}
//                             className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//                         >
//                             Delete
//                         </button>
//                     )}
//                 </div>
//             )
//         }
//     ], [userProperties]);

//     // --- Filtered Data ---
//     const data = useMemo(() => {
//         if (!debouncedSearch) return groups;
//         return groups.filter(g =>
//             g.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
//             g.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
//             (userProperties.find(p => p.id === g.propertyId)?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())
//         );
//     }, [groups, debouncedSearch, userProperties]);

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
//     const handleGroupAdded = (newGroup) => {
//         setGroups(prev => [newGroup, ...prev]);
//         setAddModalOpen(false);
//         if (socket) socket.emit("GROUP_CREATED", newGroup);
//     };

//     const handleGroupUpdated = (updatedGroup) => {
//         setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
//         setEditModalOpen(false);
//         if (socket) socket.emit("GROUP_UPDATED", updatedGroup);
//     };

//     const handleDelete = async (groupId) => {
//         if (!confirm("Are you sure you want to delete this group?")) return;
//         try {
//             const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
//             if (!res.ok) throw new Error("Failed to delete group");
//             setGroups(prev => prev.filter(g => g.id !== groupId));
//             if (socket) socket.emit("GROUP_DELETED", { id: groupId });
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     return (
//         <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
//             <div className="p-4 space-y-4">

//                 {/* Header */}
//                 <div className="flex justify-between items-center">
//                     <h2 className="text-xl font-bold">Groups</h2>
//                     <div className="flex gap-2 items-center">
//                         <input
//                             type="text"
//                             placeholder="Search by code, name, or property..."
//                             value={searchTerm}
//                             onChange={e => setSearchTerm(e.target.value)}
//                             className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         />
//                         {canAdd && (
//                             <button
//                                 onClick={() => setAddModalOpen(true)}
//                                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                             >
//                                 Add Group
//                             </button>
//                         )}
//                     </div>
//                 </div>

//                 {/* Table */}
//                 <div className="overflow-x-auto border rounded">
//                     <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
//                         <thead className="">
//                             {headerGroups.map(headerGroup => (
//                                 <tr {...headerGroup.getHeaderGroupProps()}>
//                                     {headerGroup.headers.map(column => (
//                                         <th
//                                             {...column.getHeaderProps(column.getSortByToggleProps())}
//                                             className="px-3 py-2 text-left text-sm font-medium text-white"
//                                         >
//                                             {column.render("Header")}
//                                             <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
//                                         </th>
//                                     ))}
//                                 </tr>
//                             ))}
//                         </thead>
//                         <tbody {...getTableBodyProps()} className=" divide-y divide-gray-200">
//                             {page.map(row => {
//                                 prepareRow(row);
//                                 return (
//                                     <tr {...row.getRowProps()} className="">
//                                         {row.cells.map(cell => (
//                                             <td {...cell.getCellProps()} className="px-3 py-2 text-sm">{cell.render("Cell")}</td>
//                                         ))}
//                                     </tr>
//                                 )
//                             })}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 <div className="flex justify-between items-center mt-2">
//                     <span className="text-sm">Page {pageIndex + 1} of {pageOptions.length}</span>
//                     <div className="flex gap-2 items-center">
//                         <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">Previous</button>
//                         <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">Next</button>
//                         <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
//                             {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
//                         </select>
//                     </div>
//                 </div>

//                 {/* Modals */}
//                 {addModalOpen && (
//                     <AddGroupModal
//                         isOpen={addModalOpen}
//                         onClose={() => setAddModalOpen(false)}
//                         properties={userProperties}
//                         companies={companies}
//                         guests={guests}
//                         onGroupAdded={handleGroupAdded}
//                     />
//                 )}
//                 {selectedGroup && (
//                     <EditGroupModal
//                         isOpen={editModalOpen}
//                         onClose={() => setEditModalOpen(false)}
//                         group={selectedGroup}
//                         properties={userProperties}
//                         companies={companies}
//                         guests={guests}
//                         onGroupUpdated={handleGroupUpdated}
//                     />
//                 )}

//             </div>
//         </ProtectedPage>
//     );
// }




// الكود الاعلى نسخة اصلية




'use client';
import { useState, useEffect, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import ProtectedPage from "@/app/components/ProtectedPage";
import AddGroupModal from "@/app/components/AddGroupModal";
import EditGroupModal from "@/app/components/EditGroupModal";
import GroupBookingsTable from "@/app/components/GroupBookingsTable";
import AddGroupBookingModal from "@/app/components/AddGroupBookingModal";

import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

export default function GroupsPage({ session, userProperties }) {
    const socket = useSocket();

    // --- States ---
    const [groups, setGroups] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [guests, setGuests] = useState([]);

    const [loading, setLoading] = useState(true);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    const [addBookingModalOpen, setAddBookingModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // --- Roles & Permissions ---
    const role = session?.user?.role || "Guest";
    const canAdd = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canEdit = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canDelete = ["Admin"].includes(role);

    // --- Fetch Data ---
    const fetchGroups = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/groups");
            const data = await res.json();
            setGroups(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies");
            const data = await res.json();
            setCompanies(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchGuests = async () => {
        try {
            const res = await fetch("/api/guests");
            const data = await res.json();
            setGuests(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchCompanies();
        fetchGuests();

        if (!socket) return;

        // 🔔 Socket broadcast
        socket.on("GROUP_CREATED", (group) => setGroups(prev => [group, ...prev]));
        socket.on("GROUP_UPDATED", (updatedGroup) =>
            setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g))
        );
        socket.on("GROUP_DELETED", ({ id }) =>
            setGroups(prev => prev.filter(g => g.id !== id))
        );

        return () => {
            socket.off("GROUP_CREATED");
            socket.off("GROUP_UPDATED");
            socket.off("GROUP_DELETED");
        };
    }, [socket]);

    // --- Debounce search ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- Table Columns for Groups ---
    const columns = useMemo(() => [
        { Header: "Code", accessor: "code" },
        { Header: "Name", accessor: "name" },
        { Header: "Property", accessor: row => userProperties.find(p => p.id === row.propertyId)?.name || "-" },
        { Header: "Company", accessor: row => row.company?.name || "-" },
        { Header: "Leader", accessor: row => row.leader ? `${row.leader.firstName} ${row.leader.lastName}` : "-" },
        {
            Header: "Actions",
            accessor: "actions",
            Cell: ({ row }) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <button
                            onClick={() => { setSelectedGroup(row.original); setEditModalOpen(true); }}
                            className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                        >
                            Edit
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDeleteGroup(row.original.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )
        }
    ], [userProperties]);

    // --- Filtered Data for Groups ---
    const data = useMemo(() => {
        if (!debouncedSearch) return groups;
        return groups.filter(g =>
            g.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            g.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (userProperties.find(p => p.id === g.propertyId)?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [groups, debouncedSearch, userProperties]);

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

    // --- Handlers for Groups ---
    const handleGroupAdded = (newGroup) => {
        setGroups(prev => [newGroup, ...prev]);
        setAddModalOpen(false);
        if (socket) socket.emit("GROUP_CREATED", newGroup);
    };

    const handleGroupUpdated = (updatedGroup) => {
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        setEditModalOpen(false);
        if (socket) socket.emit("GROUP_UPDATED", updatedGroup);
    };

    const handleDeleteGroup = async (groupId) => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        try {
            const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete group");
            setGroups(prev => prev.filter(g => g.id !== groupId));
            if (socket) socket.emit("GROUP_DELETED", { id: groupId });
            if (selectedGroup?.id === groupId) setSelectedGroup(null);
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <div className="p-4 space-y-6">

                {/* Groups Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">Groups</h2>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Search by code, name, or property..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {canAdd && (
                                <button
                                    onClick={() => setAddModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Add Group
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded">
                        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                            <thead>
                                {headerGroups.map((headerGroup, hgIndex) => {
                                    const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
                                    return (
                                        <tr key={key || hgIndex} {...restHeaderGroupProps}>
                                            {headerGroup.headers.map((column, colIndex) => {
                                                const { key: colKey, ...restColProps } = column.getHeaderProps(column.getSortByToggleProps());
                                                return (
                                                    <th key={colKey || colIndex} {...restColProps} className="px-3 py-2 text-left text-sm font-medium text-white">
                                                        {column.render("Header")}
                                                        <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </thead>
                            <tbody {...getTableBodyProps()}>
                                {page.map((row, rowIndex) => {
                                    prepareRow(row);
                                    const { key: rowKey, ...restRowProps } = row.getRowProps();
                                    return (
                                        <tr
                                            key={rowKey || rowIndex}
                                            {...restRowProps}
                                            className={selectedGroup?.id === row.original.id ? "bg-blue-100" : ""}
                                            onClick={() => setSelectedGroup(row.original)}
                                        >
                                            {row.cells.map((cell, cellIndex) => {
                                                const { key: cellKey, ...restCellProps } = cell.getCellProps();
                                                return (
                                                    <td key={cellKey || cellIndex} {...restCellProps} className="px-3 py-2 text-sm">
                                                        {cell.render("Cell")}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">Page {pageIndex + 1} of {pageOptions.length}</span>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">Previous</button>
                            <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">Next</button>
                            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
                                {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Group Bookings Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">Group Bookings</h2>
                        {canAdd && selectedGroup && (
                            <button
                                onClick={() => setAddBookingModalOpen(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Add Booking
                            </button>
                        )}
                    </div>

                    {selectedGroup ? (
                        <GroupBookingsTable
                            group={selectedGroup}
                            properties={userProperties}
                            roomTypes={[]}  
                            guests={guests}
                            groups={groups}       // ← تمرير كل المجموعات هنا
                            session={session}
                        />
                    ) : (
                        <p className="text-gray-500">Please select a group to see bookings.</p>
                    )}
                </div>

                {/* Modals */}
                {addModalOpen && (
                    <AddGroupModal
                        isOpen={addModalOpen}
                        onClose={() => setAddModalOpen(false)}
                        properties={userProperties}
                        companies={companies}
                        guests={guests}
                        onGroupAdded={handleGroupAdded}
                    />
                )}

                {editModalOpen && selectedGroup && (
                    <EditGroupModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        group={selectedGroup}
                        properties={userProperties}
                        companies={companies}
                        guests={guests}
                        groups={groups}           // ← تمرير المجموعات للمودال
                        onGroupUpdated={handleGroupUpdated}
                    />
                )}

                {addBookingModalOpen && selectedGroup && (
                    <AddGroupBookingModal
                        isOpen={addBookingModalOpen}
                        onClose={() => setAddBookingModalOpen(false)}
                        groups={groups}           // ← تمرير كل المجموعات هنا
                        properties={userProperties}
                        onBookingAdded={() => setAddBookingModalOpen(false)}
                    />
                )}

            </div>
        </ProtectedPage>
    );
}


