// 'use client';

// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";
// import { useSession } from "next-auth/react";

// export default function UsersPageClient({ userProperties }) {
//     const { data: session } = useSession();
//     const [users, setUsers] = useState([]);
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [modalOpen, setModalOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState(null);
//     const [form, setForm] = useState({ name: "", email: "", role: "FrontDesk", password: "", propertyId: "" });
//     const socket = useSocket();

//     const userRole = session?.user?.role || "FrontDesk";

//     const canAdd = ["Admin", "Manager"].includes(userRole);
//     const canEdit = ["Admin", "Manager"].includes(userRole);
//     const canDelete = ["Admin"].includes(userRole);
//     const readOnly = ["FrontDesk", "HK"].includes(userRole);

//     // Fetch users
//     const fetchUsers = async () => {
//         setLoading(true);
//         const res = await fetch("/api/settings/users");
//         const data = await res.json();
//         setUsers(data);
//         setLoading(false);
//     };

//     // Fetch properties
//     const fetchProperties = async () => {
//         const res = await fetch("/api/properties");
//         const data = await res.json();
//         setProperties(data);
//     };

//     useEffect(() => {
//         fetchUsers();
//         fetchProperties();

//         if (socket) {
//             const handler = () => fetchUsers();
//             socket.on("USERS_UPDATED", handler);
//             return () => socket.off("USERS_UPDATED", handler);
//         }
//     }, [socket]);

//     const openAddModal = () => {
//         if (!canAdd) return;
//         setForm({ name: "", email: "", role: "FrontDesk", password: "", propertyId: "" });
//         setEditingUser(null);
//         setModalOpen(true);
//     };

//     const openEditModal = (user) => {
//         if (!canEdit) return;
//         setForm({ 
//             name: user.name, 
//             email: user.email, 
//             role: user.role, 
//             password: "", 
//             propertyId: user.propertyId 
//         });
//         setEditingUser(user);
//         setModalOpen(true);
//     };

//     const handleSubmit = async () => {
//         if (readOnly) return;
//         const payload = { ...form };

//         if (!editingUser && !payload.password) {
//             alert("Password is required");
//             return;
//         }

//         if (editingUser && !payload.password) delete payload.password;

//         const url = editingUser ? `/api/settings/users?id=${editingUser.id}` : "/api/settings/users";
//         const method = editingUser ? "PUT" : "POST";

//         await fetch(url, {
//             method,
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload),
//         });

//         setModalOpen(false);
//     };

//     const handleDelete = async (user) => {
//         if (!canDelete) return;
//         if (user.role === "Admin") return alert("Cannot delete Admin user");
//         if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
//         await fetch(`/api/settings/users?id=${user.id}`, { method: "DELETE" });
//     };


//     return (
//         <div className="p-4">
//             <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Users</h2>
//                 {canAdd && (
//                     <button
//                         onClick={openAddModal}
//                         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                     >
//                         Add User
//                     </button>
//                 )}
//             </div>

//             {loading ? (
//                 <p>Loading...</p>
//             ) : (
//                 <table className="min-w-full bg-white dark:bg-gray-800 border">
//                     <thead>
//                         <tr className="bg-gray-100 dark:bg-gray-700 text-left">
//                             <th className="px-4 py-2 border">Name</th>
//                             <th className="px-4 py-2 border">Email</th>
//                             <th className="px-4 py-2 border">Role</th>
//                             <th className="px-4 py-2 border">Property</th>
//                             <th className="px-4 py-2 border">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {users.map((user) => (
//                             <tr key={user.id} className="border-b">
//                                 <td className="px-4 py-2">{user.name}</td>
//                                 <td className="px-4 py-2">{user.email}</td>
//                                 <td className="px-4 py-2">{user.role}</td>
//                                 <td className="px-4 py-2">{user.property?.name || "—"}</td>
//                                 <td className="px-4 py-2 space-x-2">
//                                     {canEdit && (
//                                         <button
//                                             onClick={() => openEditModal(user)}
//                                             className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
//                                         >
//                                             Edit
//                                         </button>
//                                     )}
//                                     {canDelete && (
//                                         <button
//                                             onClick={() => handleDelete(user)}
//                                             className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//                                         >
//                                             Delete
//                                         </button>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             )}

// {/* Modal */}
// {modalOpen && (canAdd || canEdit) && (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//         <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
//             <h3 className="text-lg font-bold mb-4">{editingUser ? "Edit User" : "Add User"}</h3>
//             <div className="space-y-2">
//                 <input
//                     type="text"
//                     placeholder="Name"
//                     value={form.name}
//                     onChange={(e) => setForm({ ...form, name: e.target.value })}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={readOnly}
//                 />
//                 <input
//                     type="email"
//                     placeholder="Email"
//                     value={form.email}
//                     onChange={(e) => setForm({ ...form, email: e.target.value })}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={readOnly}
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={form.password}
//                     onChange={(e) => setForm({ ...form, password: e.target.value })}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={readOnly}
//                 />
//                 <select
//                     value={form.role}
//                     onChange={(e) => setForm({ ...form, role: e.target.value })}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={readOnly}
//                 >
//                     <option value="Admin">Admin</option>
//                     <option value="FrontDesk">FrontDesk</option>
//                     <option value="HK">HK</option>
//                     <option value="Manager">Manager</option>
//                 </select>

//                 <select
//                     value={form.propertyId}
//                     onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={readOnly}
//                 >
//                     <option value="">Select Property</option>
//                     {properties.map((p) => (
//                         <option key={p.id} value={p.id}>{p.name}</option>
//                     ))}
//                 </select>
//             </div>

//             <div className="mt-4 flex justify-end space-x-2">
//                 <button
//                     onClick={() => setModalOpen(false)}
//                     className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
//                 >
//                     Cancel
//                 </button>
//                 <button
//                     onClick={handleSubmit}
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                     disabled={readOnly}
//                 >
//                     {editingUser ? "Update" : "Add"}
//                 </button>
//             </div>
//         </div>
//     </div>
// )}
//         </div>
//     );
// }





'use client';

import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { useSession } from "next-auth/react";
import { FaUser, FaEnvelope, FaPhone, FaGlobe, FaIdCard, FaCalendarAlt, FaBuilding, FaUsers, FaLock } from "react-icons/fa";

export default function UsersPageClient({ userProperties }) {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", role: "FrontDesk", password: "", propertyId: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const socket = useSocket();

    const userRole = session?.user?.role || "FrontDesk";
    const canAdd = ["Admin", "Manager"].includes(userRole);
    const canEdit = ["Admin", "Manager"].includes(userRole);
    const canDelete = ["Admin"].includes(userRole);
    const readOnly = ["FrontDesk", "HK"].includes(userRole);

    const fetchUsers = async () => {
        setLoading(true);
        const res = await fetch("/api/settings/users");
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    const fetchProperties = async () => {
        const res = await fetch("/api/properties");
        const data = await res.json();
        setProperties(data);
    };

    useEffect(() => {
        fetchUsers();
        fetchProperties();

        if (socket) {
            const handler = () => fetchUsers();
            socket.on("USERS_UPDATED", handler);
            return () => socket.off("USERS_UPDATED", handler);
        }
    }, [socket]);

    const openAddModal = () => {
        if (!canAdd) return;
        setForm({ name: "", email: "", role: "FrontDesk", password: "", propertyId: "" });
        setEditingUser(null);
        setModalOpen(true);
    };

    const openEditModal = (user) => {
        if (!canEdit) return;
        setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            password: "",
            propertyId: user.propertyId
        });
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (readOnly) return;
        const payload = { ...form };

        if (!editingUser && !payload.password) {
            alert("Password is required");
            return;
        }

        if (editingUser && !payload.password) delete payload.password;

        const url = editingUser ? `/api/settings/users?id=${editingUser.id}` : "/api/settings/users";
        const method = editingUser ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setModalOpen(false);
    };

    const handleDelete = async (user) => {
        if (!canDelete) return;
        if (user.role === "Admin") return alert("Cannot delete Admin user");
        if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
        await fetch(`/api/settings/users?id=${user.id}`, { method: "DELETE" });
    };

    // Apply filters
    const filteredUsers = users.filter(u => {
        return (
            (!searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!filterRole || u.role === filterRole) &&
            (!filterProperty || u.propertyId === filterProperty)
        );
    });


    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">👥 Users Management</h2>
                {canAdd && (
                    <button
                        onClick={openAddModal}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add User
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col w-full md:w-1/3">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="flex flex-col w-full md:w-1/5">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Role</label>
                    <select
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="FrontDesk">FrontDesk</option>
                        <option value="HK">HK</option>
                    </select>
                </div>

                <div className="flex flex-col w-full md:w-1/4">
                    <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                    <select
                        value={filterProperty}
                        onChange={e => setFilterProperty(e.target.value)}
                        className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Properties</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow">
                <table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-left">
                        <tr>
                            <th className="px-4 py-3 border-b">Name</th>
                            <th className="px-4 py-3 border-b">Email</th>
                            <th className="px-4 py-3 border-b">Role</th>
                            <th className="px-4 py-3 border-b">Property</th>
                            <th className="px-4 py-3 border-b text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.role}</td>
                                    <td className="px-4 py-3">{user.property?.name || "—"}</td>
                                    <td className="px-4 py-3 text-center space-x-2">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (canAdd || canEdit) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">

                        {/* Header */}
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <FaUser /> {editingUser ? "Edit User" : "Add User"}
                        </h2>

                        {/* Grid Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* Name */}
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name *</label>
                                <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <FaUser className="ml-2 text-gray-400 dark:text-gray-300" />
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-r-lg bg-transparent focus:outline-none text-gray-600 dark:text-white"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
                                <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <FaEnvelope className="ml-2 text-gray-400 dark:text-gray-300" />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-r-lg bg-transparent focus:outline-none text-gray-600 dark:text-white"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
                                <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <FaLock className="ml-2 text-gray-400 dark:text-gray-300" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full px-3 py-2 rounded-r-lg bg-transparent focus:outline-none text-gray-600 dark:text-white"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
                                <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <FaUsers className="ml-2 text-gray-400 dark:text-gray-300" />
                                    <select
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        className="w-full px-3 py-2 rounded-r-lg bg-transparent focus:outline-none text-gray-600 dark:text-white"
                                        disabled={readOnly}
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="FrontDesk">FrontDesk</option>
                                        <option value="HK">HK</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                            </div>

                            {/* Property */}
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Property</label>
                                <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <FaBuilding className="ml-2 text-gray-400 dark:text-gray-300" />
                                    <select
                                        value={form.propertyId}
                                        onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-r-lg bg-transparent focus:outline-none text-gray-600 dark:text-white"
                                    >
                                        <option value="">Select Property</option>
                                        {properties.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                        </div>

                        {/* Buttons */}
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition flex items-center gap-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={readOnly}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {editingUser ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

