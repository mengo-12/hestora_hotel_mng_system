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
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import ProtectedPage from "@/app/components/ProtectedPage";
import AddGroupModal from "@/app/components/AddGroupModal";
import EditGroupModal from "@/app/components/EditGroupModal";

export default function GroupsPage({ session, userProperties }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    // --- Permissions ---
    const canAdd = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canEdit = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canDelete = ["Admin"].includes(role);

    // --- State ---
    const [groups, setGroups] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [grpRes, cmpRes, gstRes] = await Promise.all([
                    fetch("/api/groups"), fetch("/api/companies"), fetch("/api/guests")
                ]);
                setGroups(await grpRes.json() || []);
                setCompanies(await cmpRes.json() || []);
                setGuests(await gstRes.json() || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    // --- Socket Updates ---
    useEffect(() => {
        if (!socket) return;
        socket.on("GROUP_CREATED", g => setGroups(prev => [g, ...prev]));
        socket.on("GROUP_UPDATED", g => setGroups(prev => prev.map(x => x.id === g.id ? g : x)));
        socket.on("GROUP_DELETED", ({ id }) => setGroups(prev => prev.filter(x => x.id !== id)));
        return () => { socket.off("GROUP_CREATED"); socket.off("GROUP_UPDATED"); socket.off("GROUP_DELETED"); };
    }, [socket]);

    const handleDeleteGroup = async id => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        try { 
            const res = await fetch(`/api/groups/${id}`, { method: "DELETE" }); 
            if(!res.ok) throw new Error(); 
            setGroups(prev => prev.filter(g => g.id!==id)); 
            if(selectedGroup?.id===id)setSelectedGroup(null); 
            if(socket) socket.emit("GROUP_DELETED",{id}); 
        }
        catch(err){ alert("Failed to delete group"); }
    };

    const handleGroupAdded = g => { setGroups(prev=>[g,...prev]); setAddModalOpen(false); if(socket)socket.emit("GROUP_CREATED",g); };
    const handleGroupUpdated = g => { setGroups(prev=>prev.map(x=>x.id===g.id?g:x)); setEditModalOpen(false); if(socket)socket.emit("GROUP_UPDATED",g); };

    // --- Filtered Groups ---
    const filteredGroups = groups.filter(g => {
        const searchLower = searchTerm.toLowerCase();
        return g.name.toLowerCase().includes(searchLower) || g.code.toLowerCase().includes(searchLower);
    });

    return (
        <ProtectedPage session={session} allowedRoles={["Admin","FrontDesk","Manager"]}>
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
                    <h1 className="text-2xl font-bold dark:text-white">Groups</h1>
                    <div className="flex gap-2 flex-wrap">
                        <input type="text" placeholder="🔍 Search groups..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {canAdd && <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Group</button>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map(g => (
                            <div key={g.id} className="p-4 rounded-lg shadow cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105" onClick={() => setSelectedGroup(g)}>
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-semibold">{g.name}</h2>
                                    <div className="flex gap-1 flex-wrap">
                                        {canEdit && <button onClick={e => { e.stopPropagation(); setSelectedGroup(g); setEditModalOpen(true); }} className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200">✏️ Edit</button>}
                                        {canDelete && <button onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id); }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">🗑 Delete</button>}
                                        {canAdd && <button onClick={e => { e.stopPropagation(); console.log("Clone group", g.id); }} className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Clone</button>}
                                    </div>
                                </div>
                                <p><b>Code:</b> {g.code}</p>
                                <p><b>Property:</b> {userProperties.find(p => p.id === g.propertyId)?.name || "-"}</p>
                                <p><b>Company:</b> {g.company?.name || "-"}</p>
                                <p><b>Leader:</b> {g.leader ? `${g.leader.firstName} ${g.leader.lastName}` : "-"}</p>
                                <p><b>Status:</b> {g.status}</p>
                                <p><b>Start:</b> {g.startDate ? new Date(g.startDate).toLocaleDateString() : "-"}</p>
                                <p><b>End:</b> {g.endDate ? new Date(g.endDate).toLocaleDateString() : "-"}</p>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
                    )}
                </div>

                {addModalOpen && canAdd && <AddGroupModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} properties={userProperties} companies={companies} guests={guests} onGroupAdded={handleGroupAdded}/>}
                {editModalOpen && selectedGroup && <EditGroupModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} group={selectedGroup} properties={userProperties} companies={companies} guests={guests} groups={groups} onGroupUpdated={handleGroupUpdated}/>}
            </div>
        </ProtectedPage>
    );
}




