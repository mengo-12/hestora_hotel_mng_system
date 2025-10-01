// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import AddLoyaltyMemberModal from "@/app/components/AddLoyaltyMember";
// import EditLoyaltyMemberModal from "@/app/components/EditLoyaltyMember";

// export default function LoyaltyMembersPage({ session, userProperties }) {
//     const [members, setMembers] = useState([]);
//     const [selectedMember, setSelectedMember] = useState(null);
//     const [pointsInput, setPointsInput] = useState(0);
//     const [typeInput, setTypeInput] = useState("Earned");
//     const [descriptionInput, setDescriptionInput] = useState("");
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [editMember, setEditMember] = useState(null);
//     const [kpis, setKpis] = useState({});
//     const [loading, setLoading] = useState(false);


//     const [searchTerm, setSearchTerm] = useState("");
//     const [levelFilter, setLevelFilter] = useState("");
//     const [dateFrom, setDateFrom] = useState("");
//     const [dateTo, setDateTo] = useState("");

// const socket = useSocket();
// const userRole = session?.user?.role || "FrontDesk";
// const canAdd = ["Admin", "FrontDesk"].includes(userRole);
// const canView = ["Admin", "FrontDesk", "Manager"].includes(userRole);

//     const levels = ["Bronze", "Silver", "Gold", "Platinum"];

//     // جلب الأعضاء
//     const fetchMembers = async () => {
//         setLoading(true);
//         try {
//             const res = await fetch("/api/loyalty/members");
//             const data = await res.json();
//             setMembers(data);
//             setKpis(recalcKpis(data));
//         } catch (err) {
//             console.error(err);
//         }
//         setLoading(false);
//     };

//     useEffect(() => {
//         if (!canView) return;
//         fetchMembers();

//         if (socket) {
//             socket.on("LOYALTY_MEMBER_UPDATED", updatedMember => {
//                 setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
//             });
//             socket.on("LOYALTY_MEMBER_CREATED", newMember => {
//                 setMembers(prev => [...prev, newMember]);
//             });
//             socket.on("LOYALTY_TRANSACTION_CREATED", fetchMembers);
//         }

//         return () => {
//             if (socket) {
//                 socket.off("LOYALTY_MEMBER_UPDATED");
//                 socket.off("LOYALTY_MEMBER_CREATED");
//                 socket.off("LOYALTY_TRANSACTION_CREATED", fetchMembers);
//             }
//         };
//     }, [socket, canView]);

//     // KPI
//     const recalcKpis = (list) => ({
//         totalMembers: list.length,
//         totalPointsEarned: list.reduce(
//             (acc, m) =>
//                 acc +
//                 (m.transactions ?? [])
//                     .filter((tx) => tx.type === "Earned")
//                     .reduce((a, t) => a + (t.points || 0), 0),
//             0
//         ),
//         totalPointsRedeemed: list.reduce(
//             (acc, m) =>
//                 acc +
//                 (m.transactions ?? [])
//                     .filter((tx) => tx.type === "Redeemed")
//                     .reduce((a, t) => a + (t.points || 0), 0),
//             0
//         ),
//     });


//     if (loading) return <p className="p-4">جاري التحميل...</p>;

//     // فلترة الأعضاء
//     const filteredMembers = members.filter(m => {
//         const nameMatch =
//             m.guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             m.guest.lastName.toLowerCase().includes(searchTerm.toLowerCase());
//         const levelMatch = levelFilter ? m.membershipLevel === levelFilter : true;
//         const dateMatch = (() => {
//             if (!dateFrom && !dateTo) return true;
//             const lastActivity = new Date(m.lastActivity);
//             const from = dateFrom ? new Date(dateFrom) : null;
//             const to = dateTo ? new Date(dateTo) : null;
//             if (from && lastActivity < from) return false;
//             if (to && lastActivity > to) return false;
//             return true;
//         })();
//         return nameMatch && levelMatch && dateMatch;
//     });

//     // إضافة / استرداد نقاط
//     const addTransaction = async () => {
//         if (!selectedMember) return alert("اختر عضو أولاً");
//         const res = await fetch("/api/loyalty/transactions", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 loyaltyMemberId: selectedMember.id,
//                 points: Number(pointsInput),
//                 type: typeInput,
//                 description: descriptionInput,
//             }),
//         });
//         const data = await res.json();
//         if (res.ok) {
//             setPointsInput(0);
//             setDescriptionInput("");
//             // تحديث العضو مباشرة مع الترانزاكشن الجديدة
//             setMembers(prev => prev.map(m =>
//                 m.id === data.loyaltyMemberId
//                     ? { ...m, pointsBalance: data.newBalance, transactions: [data.transaction, ...m.transactions] }
//                     : m
//             ));
//         } else alert(data.error);
//     };

//     // تصدير CSV
//     const exportCSV = () => {
//         const headers = ["First Name", "Last Name", "Membership Level", "Program", "Points Balance"];
//         const rows = filteredMembers.map(m => [
//             m.guest.firstName,
//             m.guest.lastName,
//             m.membershipLevel,
//             m.loyaltyProgram?.name || "",
//             m.pointsBalance
//         ]);

//         const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
//         const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.setAttribute("download", "loyalty_members.csv");
//         link.click();
//     };

//     if (!canView) return <p className="p-6 text-red-500">لا تمتلك صلاحية عرض هذه الصفحة.</p>;

//     return (
//         <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
//             {/* KPI Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Total Members</span>
//                     <span className="text-2xl font-bold">{kpis.totalMembers}</span>
//                 </div>
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Points Earned</span>
//                     <span className="text-2xl font-bold">{kpis.totalPointsEarned}</span>
//                 </div>
//                 <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                     <span className="text-gray-500 dark:text-gray-300">Points Redeemed</span>
//                     <span className="text-2xl font-bold">{kpis.totalPointsRedeemed}</span>
//                 </div>
//             </div>

//             {/* Filters + Actions */}
// <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
//     <div className="flex flex-col w-full md:w-1/4">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
//         <input
//             type="text"
//             placeholder="Search members..."
//             value={searchTerm}
//             onChange={e => setSearchTerm(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//         />
//     </div>
//     <div className="flex flex-col w-full md:w-1/6">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Membership Level</label>
//         <select
//             value={levelFilter}
//             onChange={e => setLevelFilter(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//         >
//             <option value="">All</option>
//             {levels.map(level => <option key={level} value={level}>{level}</option>)}
//         </select>
//     </div>
//     <div className="flex flex-col w-full md:w-1/5">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From Date</label>
//         <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
//     </div>
//     <div className="flex flex-col w-full md:w-1/5">
//         <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To Date</label>
//         <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
//             className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
//     </div>
//     <div className="flex w-full md:w-auto gap-2">
//         {canAdd && (
//             <>
//                 <button onClick={() => setShowAddModal(true)}
//                     className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Member</button>
//                 <button onClick={exportCSV}
//                     className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full md:w-auto">Export CSV</button>
//             </>
//         )}
//     </div>
// </div>

//             {/* Members Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {filteredMembers.map(member => (
//                     <div
//                         key={member.id}
//                         className={`p-4 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xl transition transform hover:scale-105
//                             ${selectedMember?.id === member.id ? "border-2 border-blue-500" : ""}`}
//                         onClick={() => setSelectedMember(member)}
//                     >
//                         <div className="flex justify-between items-start mb-2">
//                             <div className="flex items-center gap-3">
//                                 <img src={member.guest.avatar || "/default-avatar.png"} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
//                                 <div className="flex flex-col">
//                                     <h2 className="text-lg font-semibold text-gray-700 dark:text-white">{member.guest.firstName} {member.guest.lastName}</h2>
//                                     <span className="text-sm text-gray-400 dark:text-gray-300">{member.loyaltyProgram?.name || member.membershipLevel}</span>
//                                 </div>
//                             </div>
//                             <span className="text-blue-500 font-semibold">{member.pointsBalance} نقاط</span>
//                         </div>

//                         {/* Transaction Summary */}
//                         <div className="text-sm mt-2">
//                             <p className="font-medium mb-1">Recent Transactions:</p>
//                             <ul className="max-h-36 overflow-y-auto border-t pt-1">
//                                 {member.transactions.slice(0, 5).map(tx => (
//                                     <li key={tx.id} className="py-1 border-b last:border-b-0">
//                                         <span className={tx.type === "Earned" ? "text-green-500" : "text-red-500"}>{tx.type}</span> {tx.points} - {tx.description || "-"} <br />
//                                         <span className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</span>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>

//                         {/* Transaction Input + Edit */}
//                         {selectedMember?.id === member.id && canAdd && (
//                             <div className="mt-4">
//                                 <h3 className="font-semibold mb-2">Add / Redeem Points</h3>
//                                 <div className="flex gap-2 mb-2">
//                                     <input
//                                         type="number"
//                                         value={pointsInput}
//                                         onChange={e => setPointsInput(e.target.value)}
//                                         className="border p-1 rounded w-20"
//                                     />
//                                     <select value={typeInput} onChange={e => setTypeInput(e.target.value)} className="border p-1 rounded">
//                                         <option value="Earned">Earned</option>
//                                         <option value="Redeemed">Redeemed</option>
//                                     </select>
//                                 </div>
//                                 <input
//                                     type="text"
//                                     value={descriptionInput}
//                                     onChange={e => setDescriptionInput(e.target.value)}
//                                     placeholder="Description"
//                                     className="border p-1 rounded w-full mb-2"
//                                 />
//                                 <div className="flex gap-2">
//                                     <button onClick={addTransaction} className="bg-blue-500 text-white px-4 py-2 rounded w-full">Add Transaction</button>
//                                     <button onClick={() => setEditMember(member)} className="bg-yellow-500 text-white px-4 py-2 rounded w-full">Edit Member</button>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 ))}
//             </div>

//             {/* Add & Edit Modals */}
//             {showAddModal && (
//                 <AddLoyaltyMemberModal
//                     isOpen={showAddModal}
//                     onClose={() => setShowAddModal(false)}
//                     userProperties={userProperties}
//                     onAdded={newMember => setMembers(prev => [...prev, newMember])}
//                 />
//             )}
//             {editMember && (
//                 <EditLoyaltyMemberModal
//                     member={editMember}
//                     isOpen={!!editMember}
//                     onClose={() => setEditMember(null)}
//                     onUpdated={updatedMember => {
//                         setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
//                     }}
//                 />
//             )}
//         </div>
//     );
// }





'use client';
import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddLoyaltyMemberModal from "@/app/components/AddLoyaltyMember";
import EditLoyaltyMemberModal from "@/app/components/EditLoyaltyMember";

export default function LoyaltyMembersPage({ session, userProperties }) {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [pointsInput, setPointsInput] = useState(0);
    const [typeInput, setTypeInput] = useState("Earned");
    const [descriptionInput, setDescriptionInput] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editMember, setEditMember] = useState(null);
    const [kpis, setKpis] = useState({});
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 9;

    const socket = useSocket();
    const userRole = session?.user?.role || "FrontDesk";
    const canAdd = ["Admin", "FrontDesk"].includes(userRole);
    const canView = ["Admin", "FrontDesk", "Manager"].includes(userRole);
    const levels = ["Bronze", "Silver", "Gold", "Platinum"];

    // Fetch members
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/loyalty/members");
            const data = await res.json();
            setMembers(data);
            setKpis(recalcKpis(data));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!canView) return;
        fetchMembers();

        if (socket) {
            socket.on("LOYALTY_MEMBER_UPDATED", updatedMember => {
                setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
            });
            socket.on("LOYALTY_MEMBER_CREATED", newMember => {
                setMembers(prev => [...prev, newMember]);
            });
            socket.on("LOYALTY_TRANSACTION_CREATED", fetchMembers);
        }

        return () => {
            if (socket) {
                socket.off("LOYALTY_MEMBER_UPDATED");
                socket.off("LOYALTY_MEMBER_CREATED");
                socket.off("LOYALTY_TRANSACTION_CREATED", fetchMembers);
            }
        };
    }, [socket, canView]);

    // KPI calculation
    const recalcKpis = (list) => ({
        totalMembers: list.length,
        totalPointsEarned: list.reduce(
            (acc, m) =>
                acc +
                (m.transactions ?? [])
                    .filter(tx => tx.type === "Earned")
                    .reduce((a, t) => a + (t.points || 0), 0),
            0
        ),
        totalPointsRedeemed: list.reduce(
            (acc, m) =>
                acc +
                (m.transactions ?? [])
                    .filter(tx => tx.type === "Redeemed")
                    .reduce((a, t) => a + (t.points || 0), 0),
            0
        ),
    });

    // Filtered members
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const nameMatch =
                m.guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.guest.lastName.toLowerCase().includes(searchTerm.toLowerCase());
            const levelMatch = levelFilter ? m.membershipLevel === levelFilter : true;
            const dateMatch = (() => {
                if (!dateFrom && !dateTo) return true;
                const lastActivity = new Date(m.lastActivity);
                const from = dateFrom ? new Date(dateFrom) : null;
                const to = dateTo ? new Date(dateTo) : null;
                if (from && lastActivity < from) return false;
                if (to && lastActivity > to) return false;
                return true;
            })();
            return nameMatch && levelMatch && dateMatch;
        });
    }, [members, searchTerm, levelFilter, dateFrom, dateTo]);

    // Paginated members
    const paginatedMembers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredMembers.slice(start, start + pageSize);
    }, [filteredMembers, page]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, levelFilter, dateFrom, dateTo]);

    // Add / Redeem points
    const addTransaction = async () => {
        if (!selectedMember) return alert("اختر عضو أولاً");
        const res = await fetch("/api/loyalty/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                loyaltyMemberId: selectedMember.id,
                points: Number(pointsInput),
                type: typeInput,
                description: descriptionInput,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setPointsInput(0);
            setDescriptionInput("");
            setMembers(prev => prev.map(m =>
                m.id === data.loyaltyMemberId
                    ? { ...m, pointsBalance: data.newBalance, transactions: [data.transaction, ...m.transactions] }
                    : m
            ));
        } else alert(data.error);
    };

    // Export CSV
    const exportCSV = () => {
        const headers = ["First Name", "Last Name", "Membership Level", "Program", "Points Balance"];
        const rows = filteredMembers.map(m => [
            m.guest.firstName,
            m.guest.lastName,
            m.membershipLevel,
            m.loyaltyProgram?.name || "",
            m.pointsBalance
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "loyalty_members.csv");
        link.click();
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {!canView ? (
                <p className="p-6 text-red-500">لا تمتلك صلاحية عرض هذه الصفحة.</p>
            ) : loading ? (
                <p className="p-4">جاري التحميل...</p>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                            <span className="text-gray-500 dark:text-gray-300">Total Members</span>
                            <span className="text-2xl font-bold">{kpis.totalMembers}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                            <span className="text-gray-500 dark:text-gray-300">Points Earned</span>
                            <span className="text-2xl font-bold">{kpis.totalPointsEarned}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
                            <span className="text-gray-500 dark:text-gray-300">Points Redeemed</span>
                            <span className="text-2xl font-bold">{kpis.totalPointsRedeemed}</span>
                        </div>
                    </div>

                    {/* Filters + Actions */}
                    <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                        <div className="flex flex-col w-full md:w-1/4">
                            <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col w-full md:w-1/6">
                            <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Membership Level</label>
                            <select
                                value={levelFilter}
                                onChange={e => setLevelFilter(e.target.value)}
                                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All</option>
                                {levels.map(level => <option key={level} value={level}>{level}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col w-full md:w-1/5">
                            <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="flex flex-col w-full md:w-1/5">
                            <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">To Date</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="flex w-full md:w-auto gap-2">
                            {canAdd && (
                                <>
                                    <button onClick={() => setShowAddModal(true)}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto">+ Add Member</button>
                                    <button onClick={exportCSV}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full md:w-auto">Export CSV</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Members Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedMembers.map(member => (
                            <div
                                key={member.id}
                                className={`p-4 rounded-2xl shadow-lg bg-white dark:bg-gray-800 dark:text-white flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xl transition transform hover:scale-105
                            ${selectedMember?.id === member.id ? "border-2 border-blue-500" : ""}`}
                                onClick={() => setSelectedMember(member)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <img src={member.guest.avatar || "/default-avatar.png"} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                                        <div className="flex flex-col">
                                            <h2 className="text-lg font-semibold text-gray-700 dark:text-white">{member.guest.firstName} {member.guest.lastName}</h2>
                                            <span className="text-sm text-gray-400 dark:text-gray-300">{member.loyaltyProgram?.name || member.membershipLevel}</span>
                                        </div>
                                    </div>
                                    <span className="text-blue-500 font-semibold">{member.pointsBalance} نقاط</span>
                                </div>

                                {/* Transaction Summary */}
                                <div className="text-sm mt-2">
                                    <p className="font-medium mb-1">Recent Transactions:</p>
                                    <ul className="max-h-36 overflow-y-auto border-t pt-1">
                                        {member.transactions.slice(0, 5).map(tx => (
                                            <li key={tx.id} className="py-1 border-b last:border-b-0">
                                                <span className={tx.type === "Earned" ? "text-green-500" : "text-red-500"}>{tx.type}</span> {tx.points} - {tx.description || "-"} <br />
                                                <span className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Transaction Input + Edit */}
                                {selectedMember?.id === member.id && canAdd && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold mb-2">Add / Redeem Points</h3>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="number"
                                                value={pointsInput}
                                                onChange={e => setPointsInput(e.target.value)}
                                                className="border p-1 rounded w-20"
                                            />
                                            <select value={typeInput} onChange={e => setTypeInput(e.target.value)} className="border p-1 rounded">
                                                <option value="Earned">Earned</option>
                                                <option value="Redeemed">Redeemed</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            value={descriptionInput}
                                            onChange={e => setDescriptionInput(e.target.value)}
                                            placeholder="Description"
                                            className="border p-1 rounded w-full mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={addTransaction} className="bg-blue-500 text-white px-4 py-2 rounded w-full">Add Transaction</button>
                                            <button onClick={() => setEditMember(member)} className="bg-yellow-500 text-white px-4 py-2 rounded w-full">Edit Member</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-center gap-2 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
                        {Array.from({ length: Math.ceil(filteredMembers.length / pageSize) }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`px-3 py-1 border rounded ${page === i + 1 ? "bg-blue-500 text-white" : ""}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(Math.ceil(filteredMembers.length / pageSize), p + 1))} className="px-3 py-1 border rounded">Next</button>
                    </div>

                    {/* Add & Edit Modals */}
                    {showAddModal && (
                        <AddLoyaltyMemberModal
                            isOpen={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            userProperties={userProperties}
                            onAdded={newMember => setMembers(prev => [...prev, newMember])}
                        />
                    )}
                    {editMember && (
                        <EditLoyaltyMemberModal
                            member={editMember}
                            isOpen={!!editMember}
                            onClose={() => setEditMember(null)}
                            onUpdated={updatedMember => {
                                setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
}
