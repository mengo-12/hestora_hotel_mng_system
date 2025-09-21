
// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import ProtectedPage from "@/app/components/ProtectedPage";
// import AddGroupModal from "@/app/components/AddGroupModal";
// import EditGroupModal from "@/app/components/EditGroupModal";

// export default function GroupsPage({ session, userProperties }) {
//     const socket = useSocket();
//     const role = session?.user?.role || "Guest";

//     const canAdd = ["Admin", "FrontDesk", "Manager"].includes(role);
//     const canEdit = ["Admin", "FrontDesk", "Manager"].includes(role);
//     const canDelete = ["Admin"].includes(role);

//     const [groups, setGroups] = useState([]);
//     const [companies, setCompanies] = useState([]);
//     const [guests, setGuests] = useState([]);
//     const [roomBlocks, setRoomBlocks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [searchTerm, setSearchTerm] = useState("");
//     const [selectedGroup, setSelectedGroup] = useState(null);
//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [editModalOpen, setEditModalOpen] = useState(false);

//     useEffect(() => {
//         const fetchAll = async () => {
//             setLoading(true);
//             try {
//                 const [grpRes, cmpRes, gstRes, rbRes] = await Promise.all([
//                     fetch("/api/groups"), 
//                     fetch("/api/companies"), 
//                     fetch("/api/guests"),
//                     fetch("/api/roomBlocks")
//                 ]);
//                 setGroups(await grpRes.json() || []);
//                 setCompanies(await cmpRes.json() || []);
//                 setGuests(await gstRes.json() || []);
//                 setRoomBlocks(await rbRes.json() || []);
//             } catch (err) { console.error(err); }
//             finally { setLoading(false); }
//         };
//         fetchAll();
//     }, []);

//     useEffect(() => {
//         if (!socket) return;
//         socket.on("GROUP_CREATED", g => setGroups(prev => [g, ...prev]));
//         socket.on("GROUP_UPDATED", g => setGroups(prev => prev.map(x => x.id === g.id ? g : x)));
//         socket.on("GROUP_DELETED", ({ id }) => setGroups(prev => prev.filter(x => x.id !== id)));
//         return () => { socket.off("GROUP_CREATED"); socket.off("GROUP_UPDATED"); socket.off("GROUP_DELETED"); };
//     }, [socket]);

//     const handleDeleteGroup = async id => {
//         if (!confirm("Are you sure you want to delete this group?")) return;
//         try { 
//             const res = await fetch(`/api/groups/${id}`, { method: "DELETE" }); 
//             if(!res.ok) throw new Error(); 
//             setGroups(prev => prev.filter(g => g.id!==id)); 
//             if(selectedGroup?.id===id)setSelectedGroup(null); 
//             if(socket) socket.emit("GROUP_DELETED",{id}); 
//         }
//         catch(err){ alert("Failed to delete group"); }
//     };

//     const handleGroupAdded = g => { setGroups(prev=>[g,...prev]); setAddModalOpen(false); if(socket)socket.emit("GROUP_CREATED",g); };
//     const handleGroupUpdated = g => { setGroups(prev=>prev.map(x=>x.id===g.id?g:x)); setEditModalOpen(false); if(socket)socket.emit("GROUP_UPDATED",g); };

//     const filteredGroups = groups.filter(g => {
//         const searchLower = searchTerm.toLowerCase();
//         return g.name.toLowerCase().includes(searchLower) || g.code.toLowerCase().includes(searchLower);
//     });

//     return (
//         <ProtectedPage session={session} allowedRoles={["Admin","FrontDesk","Manager"]}>
//             <div className="p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
//                     <h1 className="text-2xl font-bold dark:text-white">Groups</h1>
//                     <div className="flex gap-2 flex-wrap">
//                         <input type="text" placeholder="🔍 Search groups..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//                             className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
//                         />
//                         {canAdd && <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Group</button>}
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {filteredGroups.length > 0 ? (
//                         filteredGroups.map(g => (
//                             <div key={g.id} className="p-4 rounded-lg shadow cursor-pointer dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105" onClick={() => setSelectedGroup(g)}>
//                                 <div className="flex justify-between items-center mb-2">
//                                     <h2 className="text-lg font-semibold">{g.name}</h2>
//                                     <div className="flex gap-1 flex-wrap">
//                                         {canEdit && <button onClick={e => { e.stopPropagation(); setSelectedGroup(g); setEditModalOpen(true); }} className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200">✏️ Edit</button>}
//                                         {canDelete && <button onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id); }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">🗑 Delete</button>}
//                                         {canAdd && <button onClick={e => { e.stopPropagation(); console.log("Clone group", g.id); }} className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Clone</button>}
//                                     </div>
//                                 </div>
//                                 <p><b>Code:</b> {g.code}</p>
//                                 <p><b>Property:</b> {userProperties.find(p => p.id === g.propertyId)?.name || "-"}</p>
//                                 <p><b>Company:</b> {g.company?.name || "-"}</p>
//                                 <p><b>Leader:</b> {g.leader ? `${g.leader.firstName} ${g.leader.lastName}` : "-"}</p>
//                                 <p><b>Room Blocks:</b> {g.roomBlocks?.map(rb => rb.name).join(", ") || "-"}</p>
//                                 <p><b>Status:</b> {g.status}</p>
//                                 <p><b>Start:</b> {g.startDate ? new Date(g.startDate).toLocaleDateString() : "-"}</p>
//                                 <p><b>End:</b> {g.endDate ? new Date(g.endDate).toLocaleDateString() : "-"}</p>
//                             </div>
//                         ))
//                     ) : (
//                         <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
//                     )}
//                 </div>

//                 {addModalOpen && canAdd &&
//                     <AddGroupModal
//                         isOpen={addModalOpen}
//                         onClose={() => setAddModalOpen(false)}
//                         properties={userProperties}
//                         companies={companies}
//                         roomBlocks={roomBlocks}
//                         guests={guests}
//                         onGroupAdded={handleGroupAdded}
//                     />
//                 }

//                 {editModalOpen && selectedGroup &&
//                     <EditGroupModal
//                         isOpen={editModalOpen}
//                         onClose={() => setEditModalOpen(false)}
//                         group={selectedGroup}
//                         properties={userProperties}
//                         companies={companies}
//                         roomBlocks={roomBlocks}
//                         guests={guests}
//                         groups={groups}
//                         onGroupUpdated={handleGroupUpdated}
//                     />
//                 }
//             </div>
//         </ProtectedPage>
//     );
// }



// الكود الاعلى نسخة اصلية





// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import ProtectedPage from "@/app/components/ProtectedPage";
// import AddGroupModal from "@/app/components/AddGroupModal";
// import EditGroupModal from "@/app/components/EditGroupModal";
// import { useRouter } from "next/navigation";

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

//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterCompany, setFilterCompany] = useState("");
//     const [filterLeader, setFilterLeader] = useState("");
//     const [filterStatus, setFilterStatus] = useState("");
//     const [filterStartDate, setFilterStartDate] = useState("");
//     const [filterEndDate, setFilterEndDate] = useState("");

//     const [selectedGroup, setSelectedGroup] = useState(null);
//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [editModalOpen, setEditModalOpen] = useState(false);

//     const [expandedGroups, setExpandedGroups] = useState({});
//     const [groupTotals, setGroupTotals] = useState({});
//     const [billingInstructions, setBillingInstructions] = useState({});

//     useEffect(() => {
//         const fetchAll = async () => {
//             setLoading(true);
//             try {
//                 const [grpRes, cmpRes, gstRes, rbRes] = await Promise.all([
//                     fetch("/api/groups"),
//                     fetch("/api/companies"),
//                     fetch("/api/guests"),
//                     fetch("/api/roomBlocks")
//                 ]);
//                 const groupsData = await grpRes.json() || [];
//                 setGroups(groupsData);
//                 setCompanies(await cmpRes.json() || []);
//                 setGuests(await gstRes.json() || []);
//                 setRoomBlocks(await rbRes.json() || []);

//                 // جلب totals لكل مجموعة
//                 const totalsMap = {};
//                 groupsData.forEach(g => {
//                     if (g.groupTotals) totalsMap[g.id] = g.groupTotals;
//                 });
//                 setGroupTotals(totalsMap);

//                 // تهيئة Billing Instructions
//                 const billingMap = {};
//                 groupsData.forEach(g => { billingMap[g.id] = g.billingInstruction || ""; });
//                 setBillingInstructions(billingMap);

//             } catch (err) {
//                 console.error(err);
//             } finally { setLoading(false); }
//         };
//         fetchAll();
//     }, []);

//     // Socket Updates
//     useEffect(() => {
//         if (!socket) return;
//         socket.on("GROUP_CREATED", g => { setGroups(prev => [g, ...prev]); setGroupTotals(prev => ({ ...prev, [g.id]: g.groupTotals || {} })); });
//         socket.on("GROUP_UPDATED", g => { setGroups(prev => prev.map(x => x.id === g.id ? g : x)); setGroupTotals(prev => ({ ...prev, [g.id]: g.groupTotals || {} })); setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" })); });
//         socket.on("GROUP_DELETED", ({ id }) => { setGroups(prev => prev.filter(x => x.id !== id)); setGroupTotals(prev => { const copy = { ...prev }; delete copy[id]; return copy; }); setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; }); });
//         return () => { socket.off("GROUP_CREATED"); socket.off("GROUP_UPDATED"); socket.off("GROUP_DELETED"); };
//     }, [socket]);

//     const handleDeleteGroup = async id => {
//         if (!confirm("Are you sure you want to delete this group?")) return;
//         try {
//             const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
//             if (!res.ok) throw new Error();
//             setGroups(prev => prev.filter(g => g.id !== id));
//             setGroupTotals(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
//             setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
//             setExpandedGroups(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
//             if (selectedGroup?.id === id) setSelectedGroup(null);
//         } catch { alert("Failed to delete group"); }
//     };

//     const handleGroupAdded = g => { setGroups(prev => [g, ...prev]); setAddModalOpen(false); setGroupTotals(prev => ({ ...prev, [g.id]: g.groupTotals || {} })); setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" })); };
//     const handleGroupUpdated = g => { setGroups(prev => prev.map(x => x.id === g.id ? g : x)); setEditModalOpen(false); setGroupTotals(prev => ({ ...prev, [g.id]: g.groupTotals || {} })); setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" })); };

//     const filteredGroups = groups.filter(g => {
//         const searchLower = searchTerm.toLowerCase();
//         if (searchTerm && !g.name.toLowerCase().includes(searchLower) && !g.code.toLowerCase().includes(searchLower)) return false;
//         if (filterCompany && g.company?.id !== filterCompany) return false;
//         if (filterLeader && g.leader?.id !== filterLeader) return false;
//         if (filterStatus && g.status !== filterStatus) return false;
//         if (filterStartDate && new Date(g.startDate) < new Date(filterStartDate)) return false;
//         if (filterEndDate && new Date(g.endDate) > new Date(filterEndDate)) return false;
//         return true;
//     });

//     const toggleExpand = async (group) => {
//         if (expandedGroups[group.id]) {
//             setExpandedGroups(prev => ({ ...prev, [group.id]: null }));
//         } else {
//             try {
//                 const res = await fetch(`/api/folios/group/${group.id}`);
//                 if (!res.ok) throw new Error("Failed to fetch group folios");
//                 const data = await res.json();
//                 setExpandedGroups(prev => ({ ...prev, [group.id]: data.folios || [] }));
//                 if (data?.groupTotals) setGroupTotals(prev => ({ ...prev, [group.id]: data.groupTotals }));
//             } catch (err) { console.error(err); }
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
            
//             if (!res.ok) throw new Error("Failed to update billing instruction");
//             const updated = await res.json();
//             setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
//         } catch (err) { console.error(err); alert("Failed to update billing instruction"); }
//     };

//     return (
//         <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
//             <div className="p-6">
//                 {/* Header */}
//                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
//                     <h1 className="text-2xl font-bold dark:text-white">Groups</h1>
//                     <div className="flex gap-2 flex-wrap">
//                         <input type="text" placeholder="🔍 Search groups..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//                             className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
//                         />
//                         {canAdd && <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Group</button>}
//                     </div>
//                 </div>

//                 {/* Filters */}
//                 <div className="flex flex-wrap gap-2 mb-4">
//                     <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="border rounded p-1">
//                         <option value="">All Companies</option>
//                         {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                     </select>
//                     <select value={filterLeader} onChange={e => setFilterLeader(e.target.value)} className="border rounded p-1">
//                         <option value="">All Leaders</option>
//                         {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
//                     </select>
//                     <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded p-1">
//                         <option value="">All Status</option>
//                         <option value="Open">Open</option>
//                         <option value="Closed">Closed</option>
//                         <option value="Canceled">Canceled</option>
//                     </select>
//                     <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="border rounded p-1" />
//                     <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="border rounded p-1" />
//                     <button onClick={() => { setFilterCompany(""); setFilterLeader(""); setFilterStatus(""); setFilterStartDate(""); setFilterEndDate(""); }} className="px-2 py-1 bg-gray-300 rounded">Clear Filters</button>
//                 </div>

//                 {/* Groups Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {filteredGroups.length > 0 ? (
//                         filteredGroups.map(g => {
//                             const totals = groupTotals[g.id] || { subtotal: 0, taxTotal: 0, totalCharges: 0, totalPayments: 0, balance: 0 };
//                             return (
//                                 <div key={g.id} className="p-4 rounded-lg shadow dark:bg-gray-700 bg-white text-black dark:text-white transition transform hover:scale-105">
//                                     <div className="flex justify-between items-center mb-2">
//                                         <h2 className="text-lg font-semibold">{g.name}</h2>
//                                         <div className="flex gap-1 flex-wrap">
//                                             {canEdit && <button onClick={() => { setSelectedGroup(g); setEditModalOpen(true); }} className="bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200">✏️ Edit</button>}
//                                             {canDelete && <button onClick={() => handleDeleteGroup(g.id)} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">🗑 Delete</button>}
//                                             <button onClick={() => toggleExpand(g)} className="text-xs px-2 py-1 rounded bg-gray-400 text-white hover:bg-gray-500">
//                                                 {expandedGroups[g.id] ? "Collapse" : "Show Folios"}
//                                             </button>
//                                         </div>
//                                     </div>

//                                     <p><b>Code:</b> {g.code}</p>
//                                     <p><b>Property:</b> {userProperties.find(p => p.id === g.propertyId)?.name || "-"}</p>
//                                     <p><b>Company:</b> {g.company?.name || "-"}</p>
//                                     <p><b>Leader:</b> {g.leader ? `${g.leader.firstName} ${g.leader.lastName}` : "-"}</p>
//                                     <p><b>Status:</b> {g.status}</p>
//                                     <p><b>Start:</b> {g.startDate ? new Date(g.startDate).toLocaleDateString() : "-"}</p>
//                                     <p><b>End:</b> {g.endDate ? new Date(g.endDate).toLocaleDateString() : "-"}</p>

//                                     {/* Billing Instructions */}
//                                     <div className="mt-2">
//                                         <label className="font-semibold">Billing Instructions: </label>
//                                         <select
//                                             value={billingInstructions[g.id] || ""}
//                                             onChange={(e) => handleBillingChange(g.id, e.target.value)}
//                                             className="ml-2 border rounded p-1"
//                                         >
//                                             <option value="">-- Select --</option>
//                                             <option value="Guest">Guest</option>
//                                             <option value="Group">Group</option>
//                                             <option value="Company">Company</option>
//                                         </select>
//                                     </div>

//                                     {/* Master Folio Summary */}
//                                     <div className="mt-2 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
//                                         <p><b>Subtotal:</b> ${totals.subtotal.toFixed(2)}</p>
//                                         <p><b>Tax:</b> ${totals.taxTotal.toFixed(2)}</p>
//                                         <p><b>Total Charges:</b> ${totals.totalCharges.toFixed(2)}</p>
//                                         <p><b>Payments:</b> ${totals.totalPayments.toFixed(2)}</p>
//                                         <p className="font-bold text-green-600"><b>Balance:</b> ${totals.balance.toFixed(2)}</p>
//                                     </div>

//                                     {/* Quick Actions */}
//                                     <div className="mt-2 flex gap-2">
//                                         <button
//                                             onClick={() => router.push(`/groupBookings?groupId=${g.id}`)}
//                                             className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                                         >
//                                             📋 Rooming List
//                                         </button>
//                                     </div>

//                                     {/* Expanded Folios */}
//                                     {expandedGroups[g.id]?.folios && (
//                                         <div className="mt-2 border-t pt-2 space-y-2">
//                                             {expandedGroups[g.id].folios.map(folio => (
//                                                 <div key={folio.id} className="p-2 border rounded bg-gray-100 dark:bg-gray-800">
//                                                     <p><b>Folio ID:</b> {folio.id}</p>
//                                                     <p><b>Status:</b> {folio.status}</p>
//                                                     <p><b>Booking Guest:</b> {folio.booking?.guest ? `${folio.booking.guest.firstName} ${folio.booking.guest.lastName}` : "-"}</p>
//                                                     <p><b>Room:</b> {folio.booking?.room ? folio.booking.room.number : "-"}</p>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>
//                             );
//                         })
//                     ) : (
//                         <p className="col-span-full text-center text-gray-500">لا توجد نتائج مطابقة 🔍</p>
//                     )}
//                 </div>

//                 {/* Modals */}
//                 {addModalOpen && canAdd &&
//                     <AddGroupModal
//                         isOpen={addModalOpen}
//                         onClose={() => setAddModalOpen(false)}
//                         properties={userProperties}
//                         companies={companies}
//                         roomBlocks={roomBlocks}
//                         guests={guests}
//                         onGroupAdded={handleGroupAdded}
//                     />
//                 }

//                 {editModalOpen && selectedGroup &&
//                     <EditGroupModal
//                         isOpen={editModalOpen}
//                         onClose={() => setEditModalOpen(false)}
//                         group={selectedGroup}
//                         properties={userProperties}
//                         companies={companies}
//                         roomBlocks={roomBlocks}
//                         guests={guests}
//                         groups={groups}
//                         onGroupUpdated={handleGroupUpdated}
//                     />
//                 }
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
import { useRouter } from "next/navigation";
import { useTable, useSortBy, useGlobalFilter, usePagination } from "react-table";

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
    const [searchTerm, setSearchTerm] = useState("");

    // --- Fetch Data from server ---
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [grpRes, cmpRes, gstRes, rbRes] = await Promise.all([
                    fetch("/api/groups"),
                    fetch("/api/companies"),
                    fetch("/api/guests"),
                    fetch("/api/roomBlocks")
                ]);

                const groupsData = await grpRes.json() || [];
                setGroups(groupsData);
                setCompanies(await cmpRes.json() || []);
                setGuests(await gstRes.json() || []);
                setRoomBlocks(await rbRes.json() || []);

                const billingMap = {};
                groupsData.forEach(g => { billingMap[g.id] = g.billingInstruction || ""; });
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
        socket.on("GROUP_CREATED", g => setGroups(prev => [g, ...prev]));
        socket.on("GROUP_UPDATED", g => {
            setGroups(prev => prev.map(x => x.id === g.id ? g : x));
            setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
        });
        socket.on("GROUP_DELETED", ({ id }) => {
            setGroups(prev => prev.filter(x => x.id !== id));
            setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        });
        return () => { socket.off("GROUP_CREATED"); socket.off("GROUP_UPDATED"); socket.off("GROUP_DELETED"); };
    }, [socket]);

    // --- Actions ---
    const handleDeleteGroup = async id => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        try {
            const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setGroups(prev => prev.filter(g => g.id !== id));
            setBillingInstructions(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        } catch {
            alert("Failed to delete group");
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
            alert("Failed to update billing instruction");
        }
    };

    const handleGroupAdded = g => {
        setGroups(prev => [g, ...prev]);
        setAddModalOpen(false);
        setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
    };

    const handleGroupUpdated = g => {
        setGroups(prev => prev.map(x => x.id === g.id ? g : x));
        setEditModalOpen(false);
        setBillingInstructions(prev => ({ ...prev, [g.id]: g.billingInstruction || "" }));
    };

    // --- Table Columns ---
    const columns = useMemo(() => [
        { Header: "Code", accessor: "code" },
        { Header: "Name", accessor: "name" },
        { Header: "Property", accessor: d => userProperties.find(p => p.id === d.propertyId)?.name || "-" },
        { Header: "Company", accessor: d => d.company?.name || "-" },
        { Header: "Leader", accessor: d => d.leader ? `${d.leader.firstName} ${d.leader.lastName}` : "-" },
        { Header: "Status", accessor: "status" },
        { Header: "Start", accessor: d => d.startDate ? new Date(d.startDate).toLocaleDateString() : "-" },
        { Header: "End", accessor: d => d.endDate ? new Date(d.endDate).toLocaleDateString() : "-" },
        {
            Header: "Totals",
            accessor: "groupTotals",
            Cell: ({ row }) => {
                const totals = row.original.groupTotals || {};
                return (
                    <div className="text-right">
                        <div>Sub: ${totals.subtotal?.toFixed(2) || 0}</div>
                        <div>Tax: ${totals.taxTotal?.toFixed(2) || 0}</div>
                        <div>Total: ${totals.totalCharges?.toFixed(2) || 0}</div>
                        <div>Payments: ${totals.totalPayments?.toFixed(2) || 0}</div>
                        <div className="font-bold text-green-600">Bal: ${totals.balance?.toFixed(2) || 0}</div>
                    </div>
                );
            }
        },
        {
            Header: "Billing",
            accessor: "billingInstruction",
            Cell: ({ row }) => (
                <select value={billingInstructions[row.original.id] || ""} onChange={e => handleBillingChange(row.original.id, e.target.value)} className="border rounded p-1">
                    <option value="">-- Select --</option>
                    <option value="Guest">Guest</option>
                    <option value="Group">Group</option>
                    <option value="Company">Company</option>
                </select>
            )
        },
        {
            Header: "Actions",
            Cell: ({ row }) => (
                <div className="flex gap-1 flex-wrap">
                    {canEdit && <button onClick={() => { setSelectedGroup(row.original); setEditModalOpen(true); }} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Edit</button>}
                    {canDelete && <button onClick={() => handleDeleteGroup(row.original.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Delete</button>}
                    <button onClick={() => router.push(`/groupBookings?groupId=${row.original.id}`)} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Rooming List</button>
                </div>
            )
        }
    ], [billingInstructions, userProperties]);

    const data = useMemo(() => groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.code.toLowerCase().includes(searchTerm.toLowerCase())
    ), [groups, searchTerm]);

    const tableInstance = useTable({ columns, data }, useGlobalFilter, useSortBy, usePagination);

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4 gap-2">
                    <h1 className="text-2xl font-bold dark:text-white">Groups</h1>
                    <div className="flex gap-2">
                        <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        {canAdd && <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Group</button>}
                    </div>
                </div>

                <table {...getTableProps()} className="min-w-full border border-gray-300 dark:border-gray-600">
                    <thead className="bg-gray-200 dark:bg-gray-700">
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps(column.getSortByToggleProps())} className="p-2 text-left text-sm font-medium border-b border-gray-300 dark:border-gray-600">
                                        {column.render("Header")}
                                        <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {rows.length > 0 ? rows.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                    {row.cells.map(cell => (
                                        <td {...cell.getCellProps()} className="p-2 text-sm border-b border-gray-300 dark:border-gray-600">{cell.render("Cell")}</td>
                                    ))}
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={columns.length} className="p-4 text-center text-gray-500">لا توجد نتائج مطابقة 🔍</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Modals */}
                {addModalOpen && canAdd &&
                    <AddGroupModal
                        isOpen={addModalOpen}
                        onClose={() => setAddModalOpen(false)}
                        properties={userProperties}
                        companies={companies}
                        roomBlocks={roomBlocks}
                        guests={guests}
                        onGroupAdded={handleGroupAdded}
                    />
                }

                {editModalOpen && selectedGroup &&
                    <EditGroupModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        group={selectedGroup}
                        properties={userProperties}
                        companies={companies}
                        roomBlocks={roomBlocks}
                        guests={guests}
                        groups={groups}
                        onGroupUpdated={handleGroupUpdated}
                    />
                }
            </div>
        </ProtectedPage>
    );
}

