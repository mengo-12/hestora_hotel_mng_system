'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddGroupModal from "@/app/components/AddGroupModal";
import EditGroupModal from "@/app/components/EditGroupModal";

export default function GroupsTable({ session, userProperties }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const socket = useSocket();

    const role = session?.user?.role || "Guest";
    const canAddEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = role === "Admin";
    const canView = ["Admin", "FrontDesk", "Manager"].includes(role);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            setGroups(data);
        } catch (err) {
            console.error("❌ Failed to fetch groups:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canView) return;

        fetchGroups();

        if (socket) {
            socket.on("GROUP_CREATED", (group) => setGroups(prev => [...prev, group]));
            socket.on("GROUP_UPDATED", (updatedGroup) => setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)));
            socket.on("GROUP_DELETED", (groupId) => setGroups(prev => prev.filter(g => g.id !== groupId)));
        }

        return () => {
            if (socket) {
                socket.off("GROUP_CREATED");
                socket.off("GROUP_UPDATED");
                socket.off("GROUP_DELETED");
            }
        };
    }, [socket, canView]);

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المجموعات الأساسية</h1>
                {canAddEdit && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        + إضافة مجموعة
                    </button>
                )}
            </div>

            {loading ? (
                <p>جاري التحميل...</p>
            ) : (
                <table className="w-full border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-2 py-1">الاسم</th>
                            <th className="border px-2 py-1">الفندق</th>
                            <th className="border px-2 py-1">المسؤول</th>
                            <th className="border px-2 py-1">الشركة</th>
                            <th className="border px-2 py-1">تاريخ البداية</th>
                            <th className="border px-2 py-1">تاريخ النهاية</th>
                            <th className="border px-2 py-1">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <tr key={group.id}>
                                <td className="border px-2 py-1">{group.name}</td>
                                <td className="border px-2 py-1">{group.property?.name}</td>
                                <td className="border px-2 py-1">{group.leader ? `${group.leader.firstName} ${group.leader.lastName}` : ""}</td>
                                <td className="border px-2 py-1">{group.company?.name || ""}</td>
                                <td className="border px-2 py-1">{new Date(group.startDate).toLocaleDateString()}</td>
                                <td className="border px-2 py-1">{new Date(group.endDate).toLocaleDateString()}</td>
                                <td className="border px-2 py-1">
                                    {canAddEdit && (
                                        <button
                                            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setShowEditModal(true);
                                            }}
                                        >
                                            تعديل
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                            onClick={async () => {
                                                if (!confirm("هل أنت متأكد من حذف المجموعة؟")) return;
                                                try {
                                                    await fetch(`/api/groups?id=${group.id}`, { method: "DELETE" });
                                                    setGroups(prev => prev.filter(g => g.id !== group.id));
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }}
                                        >
                                            حذف
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showAddModal && canAddEdit && (
                <AddGroupModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => setShowAddModal(false)}
                />
            )}

            {showEditModal && selectedGroup && canAddEdit && (
                <EditGroupModal
                    group={selectedGroup}
                    isOpen={!!showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSaved={() => setShowEditModal(false)}
                />
            )}
        </div>
    );
}
