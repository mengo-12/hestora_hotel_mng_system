// 'use client';
// import { useState, useEffect, useMemo } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import ProtectedPage from "@/app/components/ProtectedPage";
// import AddGroupModal from "@/app/components/AddGroupModal";
// import EditGroupModal from "@/app/components/EditGroupModal";
// import { useRouter } from "next/navigation";
// import { useTable, useSortBy, useGlobalFilter, usePagination } from "react-table";
// import { Building2, User, Briefcase, Calendar } from "lucide-react";

// export default function GroupsPage({ session, userProperties }) {
//     const socket = useSocket();
//     const router = useRouter();
//     const role = session?.user?.role || "Guest";

//     const canAdd = ["Admin", "FrontDesk", "Manager"].includes(role);
//     const canEdit = ["Admin", "FrontDesk", "Manager"].includes(role);
//     const canDelete = ["Admin"].includes(role);

//     const [groups, setGroups] = useState([]);
//     const [companies, setCompanies] = useState([]);
//     const [guests, setGuests] = useState([]);
//     const [roomBlocks, setRoomBlocks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [selectedGroup, setSelectedGroup] = useState(null);
//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [editModalOpen, setEditModalOpen] = useState(false);
//     const [billingInstructions, setBillingInstructions] = useState({});

//     // --- Filters ---
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterProperty, setFilterProperty] = useState("");
//     const [filterCompany, setFilterCompany] = useState("");
//     const [filterStartDate, setFilterStartDate] = useState("");
//     const [filterEndDate, setFilterEndDate] = useState("");

//     // --- Fetch Data ---
//     useEffect(() => {
//         const fetchAll = async () => {
//             setLoading(true);
//             try {
//                 const [grpRes, cmpRes, gstRes, rbRes] = await Promise.all([
//                     fetch("/api/groups"),
//                     fetch("/api/companies"),
//                     fetch("/api/guests"),
//                     fetch("/api/roomBlocks"),
//                 ]);

//                 const groupsData = (await grpRes.json()) || [];
//                 setGroups(groupsData);
//                 setCompanies((await cmpRes.json()) || []);
//                 setGuests((await gstRes.json()) || []);
//                 setRoomBlocks((await rbRes.json()) || []);

//                 const billingMap = {};
//                 groupsData.forEach((g) => {
//                     billingMap[g.id] = g.billingInstruction || "";
//                 });
//                 setBillingInstructions(billingMap);
//             } catch (err) {
//                 console.error(err);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAll();
//     }, []);

//     // --- Socket Updates ---
//     // --- Socket Updates ---
//     useEffect(() => {
//         if (!socket) return;
//         const refreshTimeoutRef = { current: null };

//         // CRUD events
//         const onGroupCreated = g => setGroups(prev => [g, ...prev]);
//         const onGroupUpdated = g => {
//             setGroups(prev => prev.map(x => x.id === g.id ? g : x));
//             setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
//         };
//         const onGroupDeleted = ({ id }) => {
//             setGroups(prev => prev.filter(x => x.id !== id));
//             setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
//         };

//         // folio/booking changes → إعادة تحميل المجموعات (للتوتال)
//         const onFolioChange = () => {
//             if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
//             refreshTimeoutRef.current = setTimeout(async () => {
//                 try {
//                     const res = await fetch("/api/groups");
//                     const groupsData = await res.json();
//                     setGroups(groupsData);
//                     const billingMap = {};
//                     groupsData.forEach(g => { billingMap[g.id] = g.billingInstruction || ""; });
//                     setBillingInstructions(billingMap);
//                 } catch (err) {
//                     console.error("Failed to refresh groups after folio change:", err);
//                 }
//                 refreshTimeoutRef.current = null;
//             }, 300); // 300ms debounce
//         };

//         socket.on("GROUP_CREATED", onGroupCreated);
//         socket.on("GROUP_UPDATED", onGroupUpdated);
//         socket.on("GROUP_DELETED", onGroupDeleted);

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

//         return () => {
//             socket.off("GROUP_CREATED", onGroupCreated);
//             socket.off("GROUP_UPDATED", onGroupUpdated);
//             socket.off("GROUP_DELETED", onGroupDeleted);
//             folioEvents.forEach(ev => socket.off(ev, onFolioChange));
//             if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
//         };
//     }, [socket]);

//     // --- Actions ---
//     const handleDeleteGroup = async id => {
//         if (!confirm("Are you sure you want to delete this group?")) return;
//         try {
//             const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
//             if (!res.ok) throw new Error();
//             setGroups(prev => prev.filter(g => g.id !== id));
//             setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
//         } catch {
//             alert("Failed to delete group");
//         }
//     };

//     const handleBillingChange = async (groupId, value) => {
//         setBillingInstructions(prev => ({ ...prev, [groupId]: value }));
//         try {
//             const res = await fetch(`/api/groups/${groupId}`, {
//                 method: "PATCH",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ billingInstruction: value }),
//             });
//             if (!res.ok) throw new Error();
//             const updated = await res.json();
//             setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
//         } catch {
//             alert("Failed to update billing instruction");
//         }
//     };

//     const handleGroupAdded = g => {
//         setGroups(prev => [g, ...prev]);
//         setAddModalOpen(false);
//         setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
//     };

//     const handleGroupUpdated = g => {
//         setGroups(prev => prev.map(x => x.id === g.id ? g : x));
//         setEditModalOpen(false);
//         setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
//     };

//     // --- Table Columns ---
//     const columns = useMemo(() => [
//         { Header: "Code", accessor: "code" },
//         { Header: "Name", accessor: "name" },
//         { Header: "Property", accessor: d => userProperties.find(p => p.id === d.propertyId)?.name || "-" },
//         { Header: "Company", accessor: d => d.company?.name || "-" },
//         { Header: "Leader", accessor: d => d.leader ? `${d.leader.firstName} ${d.leader.lastName}` : "-" },
//         { Header: "Status", accessor: "status" },
//         { Header: "Start", accessor: d => d.startDate ? new Date(d.startDate).toLocaleDateString() : "-" },
//         { Header: "End", accessor: d => d.endDate ? new Date(d.endDate).toLocaleDateString() : "-" },
//         {
//             Header: "Totals",
//             accessor: "groupTotals",
//             Cell: ({ row }) => {
//                 const totals = row.original.groupTotals || {};
//                 return (
//                     <div className="text-right">
//                         <div>Sub: ${totals.subtotal?.toFixed(2) || 0}</div>
//                         <div>Tax: ${totals.taxTotal?.toFixed(2) || 0}</div>
//                         <div>Total: ${totals.totalCharges?.toFixed(2) || 0}</div>
//                         <div>Payments: ${totals.totalPayments?.toFixed(2) || 0}</div>
//                         <div className="font-bold text-green-600">Bal: ${totals.balance?.toFixed(2) || 0}</div>
//                     </div>
//                 );
//             }
//         },
//         {
//             Header: "Billing",
//             accessor: "billingInstruction",
//             Cell: ({ row }) => (
//                 <select value={billingInstructions[row.original.id] || ""} onChange={e => handleBillingChange(row.original.id, e.target.value)} className="border rounded p-1">
//                     <option value="">-- Select --</option>
//                     <option value="Guest">Guest</option>
//                     <option value="Group">Group</option>
//                     <option value="Company">Company</option>
//                 </select>
//             )
//         },
//         {
//             Header: "Actions",
//             Cell: ({ row }) => (
//                 <div className="flex gap-1 flex-wrap">
//                     {canEdit && <button onClick={() => { setSelectedGroup(row.original); setEditModalOpen(true); }} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Edit</button>}
//                     {canDelete && <button onClick={() => handleDeleteGroup(row.original.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Delete</button>}
//                     <button onClick={() => router.push(`/groupBookings?groupId=${row.original.id}`)} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Rooming List</button>
//                 </div>
//             )
//         }
//     ], [billingInstructions, userProperties]);

//     const data = useMemo(() => groups.filter(g =>
//         g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.code.toLowerCase().includes(searchTerm.toLowerCase())
//     ), [groups, searchTerm]);

//     const tableInstance = useTable({ columns, data }, useGlobalFilter, useSortBy, usePagination);

//     const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

//     // --- Filters Logic ---
//     const filteredGroups = groups.filter((g) => {
//         const matchSearch =
//             g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             g.code.toLowerCase().includes(searchTerm.toLowerCase());

//         const matchProperty = filterProperty ? g.propertyId === filterProperty : true;
//         const matchCompany = filterCompany ? g.companyId === filterCompany : true;

//         const matchStart = filterStartDate ? new Date(g.startDate) >= new Date(filterStartDate) : true;
//         const matchEnd = filterEndDate ? new Date(g.endDate) <= new Date(filterEndDate) : true;

//         return matchSearch && matchProperty && matchCompany && matchStart && matchEnd;
//     });

//     return (
//         <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
//             <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
//                 {/* Header */}
//                 <div className="flex justify-between items-center mb-4">
//                     <h1 className="text-3xl font-bold dark:text-white">👥 Groups</h1>
//                 </div>

//                 {/* Filters */}
// <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow items-end">
//     {/* Search */}
//     <div className="flex flex-col">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
//         <input
//             type="text"
//             placeholder="Search groups..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//         />
//     </div>

//     {/* Property */}
//     <div className="flex flex-col">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
//         <select
//             value={filterProperty}
//             onChange={(e) => setFilterProperty(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
//         >
//             <option value="">All Properties</option>
//             {userProperties.map((p) => (
//                 <option key={p.id} value={p.id}>
//                     {p.name}
//                 </option>
//             ))}
//         </select>
//     </div>

//     {/* Company */}
//     <div className="flex flex-col">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Company</label>
//         <select
//             value={filterCompany}
//             onChange={(e) => setFilterCompany(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
//         >
//             <option value="">All Companies</option>
//             {companies.map((c) => (
//                 <option key={c.id} value={c.id}>
//                     {c.name}
//                 </option>
//             ))}
//         </select>
//     </div>

//     {/* Start Date */}
//     <div className="flex flex-col">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Start Date</label>
//         <input
//             type="date"
//             value={filterStartDate}
//             onChange={(e) => setFilterStartDate(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
//         />
//     </div>

//     {/* End Date */}
//     <div className="flex flex-col">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">End Date</label>
//         <input
//             type="date"
//             value={filterEndDate}
//             onChange={(e) => setFilterEndDate(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
//         />
//     </div>

//     {/* Add Group */}
//     {canAdd && (
//         <div className="flex">
//             <button
//                 onClick={() => setAddModalOpen(true)}
//                 className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
//             >
//                 + Add Group
//             </button>
//         </div>
//     )}
// </div>


//                 {/* Cards */}
//                 {loading ? (
//                     <p className="text-center text-gray-500">⏳ Loading...</p>
//                 ) : filteredGroups.length > 0 ? (
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         {filteredGroups.map((g) => {
//                             const totals = g.groupTotals || {};
//                             return (
//                                 <div
//                                     key={g.id}
//                                     className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:scale-105 p-5 flex flex-col justify-between"
//                                 >
// {/* Header */}
// <div className="flex justify-between items-start mb-3">
//     <div>
//         <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
//             {g.code} - {g.name}
//         </h2>
//         <p className="text-sm text-gray-500 dark:text-gray-300">
//             {userProperties.find((p) => p.id === g.propertyId)?.name || "-"}
//         </p>
//         <p className="text-sm text-gray-500 dark:text-gray-300">
//             {g.company?.name || "No Company"}
//         </p>
//         <p className="text-sm text-gray-500 dark:text-gray-300">
//             Leader: {g.leader ? `${g.leader.firstName} ${g.leader.lastName}` : "-"}
//         </p>
//     </div>
//     <span className="px-2 py-1 text-xs rounded bg-indigo-500 text-white">
//         Group
//     </span>
// </div>

// {/* KPI / Summary */}
// <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
//     <div className="flex flex-col">
//         <span className="text-gray-400 dark:text-gray-300">Start Date</span>
//         <span className="font-medium">
//             {g.startDate ? new Date(g.startDate).toLocaleDateString() : "-"}
//         </span>
//     </div>
//     <div className="flex flex-col">
//         <span className="text-gray-400 dark:text-gray-300">End Date</span>
//         <span className="font-medium">
//             {g.endDate ? new Date(g.endDate).toLocaleDateString() : "-"}
//         </span>
//     </div>
//     <div className="flex flex-col">
//         <span className="text-gray-400 dark:text-gray-300">Subtotal</span>
//         <span className="font-medium">${totals.subtotal?.toFixed(2) || 0}</span>
//     </div>
//     <div className="flex flex-col">
//         <span className="text-gray-400 dark:text-gray-300">Tax</span>
//         <span className="font-medium">${totals.taxTotal?.toFixed(2) || 0}</span>
//     </div>
//     <div className="flex flex-col">
//         <span className="text-gray-400 dark:text-gray-300">Payments</span>
//         <span className="font-medium text-green-600">
//             ${totals.totalPayments?.toFixed(2) || 0}
//         </span>
//     </div>
//     <div className="flex flex-col">
//         <span className="text-gray-400 dark:text-gray-300">Balance</span>
//         <span className="font-bold text-red-600">
//             ${totals.balance?.toFixed(2) || 0}
//         </span>
//     </div>
//     <div className="flex flex-col col-span-2">
//         <span className="text-gray-400 dark:text-gray-300">Total</span>
//         <span className="font-bold text-blue-600">
//             ${totals.totalCharges?.toFixed(2) || 0}
//         </span>
//     </div>
// </div>

// {/* Footer: Actions */}
// <div className="flex gap-2 flex-wrap mt-auto">
//     {canEdit && (
//         <button
//             onClick={() => {
//                 setSelectedGroup(g);
//                 setEditModalOpen(true);
//             }}
//             className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
//         >
//             Edit
//         </button>
//     )}
//     {canDelete && (
//         <button
//             onClick={() => handleDeleteGroup(g.id)}
//             className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
//         >
//             Delete
//         </button>
//     )}
//     <button
//         onClick={() => router.push(`/groupBookings?groupId=${g.id}`)}
//         className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded"
//     >
//         Rooming List
//     </button>
// </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 ) : (
//                     <p className="text-center text-gray-500">⚠️ لا توجد نتائج مطابقة</p>
//                 )}

//                 {/* Modals */}
//                 {addModalOpen && canAdd && (
//                     <AddGroupModal
//                         isOpen={addModalOpen}
//                         onClose={() => setAddModalOpen(false)}
//                         properties={userProperties}
//                         companies={companies}
//                         roomBlocks={roomBlocks}
//                         guests={guests}
//                         onGroupAdded={(g) => {
//                             setGroups((prev) => [g, ...prev]);
//                             setBillingInstructions((prev) => ({ ...prev, [g.id]: g.billingInstruction || "" }));
//                         }}
//                     />
//                 )}

//                 {editModalOpen && selectedGroup && (
//                     <EditGroupModal
//                         isOpen={editModalOpen}
//                         onClose={() => setEditModalOpen(false)}
//                         group={selectedGroup}
//                         properties={userProperties}
//                         companies={companies}
//                         roomBlocks={roomBlocks}
//                         guests={guests}
//                         groups={groups}
//                         onGroupUpdated={(g) => {
//                             setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));
//                             setBillingInstructions((prev) => ({ ...prev, [g.id]: g.billingInstruction || "" }));
//                         }}
//                     />
//                 )}
//             </div>
//         </ProtectedPage>
//     );
// }





'use client';
import { useState, useEffect, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import ProtectedPage from "@/app/components/ProtectedPage";
import AddGroupModal from "@/app/components/AddGroupModal";
import EditGroupModal from "@/app/components/EditGroupModal";
import ConfirmationModal from "@/app/components/ConfirmationModal"; // ✅ جديد
import { useRouter } from "next/navigation";

export default function GroupsPage({ session, userProperties }) {
    const socket = useSocket();
    const router = useRouter();
    const role = session?.user?.role || "Guest";

    const canAdd = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canEdit = ["Admin", "FrontDesk", "Manager"].includes(role);
    const canDelete = ["Admin"].includes(role);

    const [groups, setGroups] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomBlocks, setRoomBlocks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedGroup, setSelectedGroup] = useState(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [billingInstructions, setBillingInstructions] = useState({});

    // --- Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // --- Confirmation Modal ---
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // --- Filters ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const [filterGroup, setFilterGroup] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    // --- Fetch Data ---
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [grpRes, cmpRes, gstRes, rbRes] = await Promise.all([
                    fetch("/api/groups"),
                    fetch("/api/companies"),
                    fetch("/api/guests"),
                    fetch("/api/roomBlocks"),
                ]);

                const groupsData = (await grpRes.json()) || [];
                setGroups(groupsData);
                setCompanies((await cmpRes.json()) || []);
                setGuests((await gstRes.json()) || []);
                setRoomBlocks((await rbRes.json()) || []);

                const billingMap = {};
                groupsData.forEach((g) => {
                    billingMap[g.id] = g.billingInstruction || "";
                });
                setBillingInstructions(billingMap);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // --- Socket Updates ---
    useEffect(() => {
        if (!socket) return;
        const refreshTimeoutRef = { current: null };

        // const onGroupCreated = g => {
        //     setGroups(prev => {
        //         const exists = prev.some(x => x.id === g.id);
        //         if (exists) return prev; // إذا موجودة بالفعل لا تضيف
        //         return [g, ...prev];
        //     });
        // };

        const onGroupUpdated = g => {
            setGroups(prev => prev.map(x => x.id === g.id ? g : x));
            setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
        };
        const onGroupDeleted = ({ id }) => {
            setGroups(prev => prev.filter(x => x.id !== id));
            setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        };

        const onGroupsRefresh = () => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await fetch("/api/groups");
                    const groupsData = await res.json();
                    setGroups(groupsData);
                    const billingMap = {};
                    groupsData.forEach(g => { billingMap[g.id] = g.billingInstruction || ""; });
                    setBillingInstructions(billingMap);
                } catch (err) {
                    console.error("Failed to refresh groups:", err);
                }
                refreshTimeoutRef.current = null;
            }, 300);
        };

        const onFolioChange = () => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await fetch("/api/groups");
                    const groupsData = await res.json();
                    setGroups(groupsData);
                    const billingMap = {};
                    groupsData.forEach(g => { billingMap[g.id] = g.billingInstruction || ""; });
                    setBillingInstructions(billingMap);
                } catch (err) {
                    console.error("Failed to refresh groups after folio change:", err);
                }
                refreshTimeoutRef.current = null;
            }, 300);
        };

        // socket.on("GROUP_CREATED", onGroupCreated);
        socket.on("GROUP_CREATED", onGroupsRefresh);
        socket.on("GROUP_UPDATED", onGroupUpdated);
        socket.on("GROUP_DELETED", onGroupDeleted);

        const folioEvents = [
            "CHARGE_ADDED",
            "CHARGE_DELETED",
            "PAYMENT_ADDED",
            "PAYMENT_DELETED",
            "FOLIO_CREATED",
            "FOLIO_CLOSED",
            "BOOKING_CREATED",
            "BOOKING_UPDATED",
            "BOOKING_DELETED"
        ];
        folioEvents.forEach(ev => socket.on(ev, onFolioChange, onGroupsRefresh));

        return () => {
            socket.off("GROUP_CREATED", onGroupCreated);
            socket.off("GROUP_UPDATED", onGroupUpdated);
            socket.off("GROUP_DELETED", onGroupDeleted);
            folioEvents.forEach(ev => socket.off(ev, onFolioChange, onGroupsRefresh));
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [socket]);

    // --- Actions ---
    const handleDeleteGroup = (id) => {
        setConfirmMessage("هل أنت متأكد من حذف هذه المجموعة؟");
        setPendingAction(() => async () => {
            setConfirmLoading(true);
            setProcessingId(id);
            try {
                const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error();
                setGroups(prev => prev.filter(g => g.id !== id));
                setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            } catch (err) {
                alert("فشل الحذف");
            } finally {
                setConfirmLoading(false);
                setProcessingId(null);
            }
        });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (pendingAction) {
            await pendingAction();
            setConfirmOpen(false);
        }
    };

    const handleBillingChange = async (groupId, value) => {
        setBillingInstructions(prev => ({ ...prev, [groupId]: value }));
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ billingInstruction: value }),
            });
            if (!res.ok) throw new Error();
            const updated = await res.json();
            setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
        } catch {
            setConfirmData({
                title: "Error",
                message: "Failed to update billing instruction",
                onConfirm: null
            });
            setConfirmOpen(true);
        }
    };

    // --- Filtered & Paginated Groups ---
    const filteredGroups = groups.filter((g) => {
        const matchSearch =
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchProperty = filterProperty ? g.propertyId === filterProperty : true;
        const matchGroup = filterGroup ? g.id === filterGroup : true;
        const matchStart = filterStartDate ? new Date(g.startDate) >= new Date(filterStartDate) : true;
        const matchEnd = filterEndDate ? new Date(g.endDate) <= new Date(filterEndDate) : true;
        return matchSearch && matchProperty && matchGroup && matchStart && matchEnd;
    });

    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
    const paginatedGroups = filteredGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold dark:text-white">👥 Groups</h1>
                </div>

                {/* Filters + Add */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow items-end">
                    {/* Search */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Property */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                        <select
                            value={filterProperty}
                            onChange={(e) => setFilterProperty(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Properties</option>
                            {userProperties.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Group */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Group</label>
                        <select
                            value={filterGroup}
                            onChange={(e) => setFilterGroup(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Groups</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Start Date</label>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">End Date</label>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Add Group */}
                    {canAdd && (
                        <div className="flex">
                            <button
                                onClick={() => setAddModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                            >
                                + Add Group
                            </button>
                        </div>
                    )}
                </div>

                {/* Loading Spinner */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                    </div>
                ) : paginatedGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedGroups.map((g) => {
                            const totals = g.groupTotals || {};
                            return (
                                <div
                                    key={g.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:scale-105 p-5 flex flex-col justify-between"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                {g.code} - {g.name}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                                {userProperties.find((p) => p.id === g.propertyId)?.name || "-"}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                                {g.company?.name || "No Company"}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                                Leader: {g.leader ? `${g.leader.firstName} ${g.leader.lastName}` : "-"}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 text-xs rounded bg-indigo-500 text-white">
                                            Group
                                        </span>
                                    </div>

                                    {/* KPI / Summary */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 dark:text-gray-300">Start Date</span>
                                            <span className="font-medium">
                                                {g.startDate ? new Date(g.startDate).toLocaleDateString() : "-"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 dark:text-gray-300">End Date</span>
                                            <span className="font-medium">
                                                {g.endDate ? new Date(g.endDate).toLocaleDateString() : "-"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 dark:text-gray-300">Subtotal</span>
                                            <span className="font-medium">${totals.subtotal?.toFixed(2) || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 dark:text-gray-300">Tax</span>
                                            <span className="font-medium">${totals.taxTotal?.toFixed(2) || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 dark:text-gray-300">Payments</span>
                                            <span className="font-medium text-green-600">
                                                ${totals.totalPayments?.toFixed(2) || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 dark:text-gray-300">Balance</span>
                                            <span className="font-bold text-red-600">
                                                ${totals.balance?.toFixed(2) || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                            <span className="text-gray-400 dark:text-gray-300">Total</span>
                                            <span className="font-bold text-blue-600">
                                                ${totals.totalCharges?.toFixed(2) || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer: Actions */}
                                    <div className="flex gap-2 flex-wrap mt-auto">
                                        {canEdit && (
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(g);
                                                    setEditModalOpen(true);
                                                }}
                                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDeleteGroup(g.id)}
                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                                            >
                                                Delete
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/groupBookings?groupId=${g.id}`)}
                                            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded"
                                        >
                                            Rooming List
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">⚠️ لا توجد نتائج مطابقة</p>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">{currentPage} / {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Modals */}
                {addModalOpen && canAdd && (
                    <AddGroupModal
                        isOpen={addModalOpen}
                        onClose={() => setAddModalOpen(false)}
                        properties={userProperties}
                        companies={companies}
                        roomBlocks={roomBlocks}
                        guests={guests}
                        onGroupAdded={(g) => {
                            setGroups((prev) => [g, ...prev]);
                            setBillingInstructions((prev) => ({ ...prev, [g.id]: g.billingInstruction || "" }));
                        }}
                    />
                )}

                {editModalOpen && selectedGroup && (
                    <EditGroupModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        group={selectedGroup}
                        properties={userProperties}
                        companies={companies}
                        roomBlocks={roomBlocks}
                        guests={guests}
                        groups={groups}
                        onGroupUpdated={(g) => {
                            setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));
                            setBillingInstructions((prev) => ({ ...prev, [g.id]: g.billingInstruction || "" }));
                        }}
                    />
                )}

                {/* Confirmation Modal */}
                {confirmOpen && (
                    <ConfirmationModal
                        open={confirmOpen}
                        message={confirmMessage}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={async () => {
                            if (pendingAction) await pendingAction();
                            setConfirmOpen(false);
                        }}
                        loading={confirmLoading}
                    />
                )}
            </div>
        </ProtectedPage>
    );
}
