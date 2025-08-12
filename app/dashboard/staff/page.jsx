"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
        } else if (session.user.role !== "ADMIN") {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchUsers();
        }
    }, [session, status, router]);

    async function fetchUsers() {
        try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("خطأ في جلب المستخدمين");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return <p className="text-center mt-10 text-gray-700 dark:text-gray-300">جاري تحميل المستخدمين...</p>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
                <button
                    onClick={() => router.push("/dashboard/staff/new")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                >
                    إضافة موظف جديد
                </button>
            </div>

            {users.length === 0 ? (
                <p className="text-gray-700 dark:text-gray-300">لا يوجد مستخدمين حاليا.</p>
            ) : (
                <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-sm text-left text-gray-800 dark:text-gray-200">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 border dark:border-gray-700">الاسم</th>
                                <th className="px-4 py-3 border dark:border-gray-700">البريد الإلكتروني</th>
                                <th className="px-4 py-3 border dark:border-gray-700">الدور</th>
                                <th className="px-4 py-3 border dark:border-gray-700">تاريخ الإنشاء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`${index % 2 === 0
                                        ? "bg-white dark:bg-gray-900"
                                        : "bg-gray-50 dark:bg-gray-800"
                                        } hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer`}
                                    onClick={() => router.push(`/dashboard/staff/${user.id}`)}
                                >
                                    <td className="px-4 py-3 border dark:border-gray-700">{user.name}</td>
                                    <td className="px-4 py-3 border dark:border-gray-700">{user.email}</td>
                                    <td className="px-4 py-3 border dark:border-gray-700">{user.role}</td>
                                    <td className="px-4 py-3 border dark:border-gray-700">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

