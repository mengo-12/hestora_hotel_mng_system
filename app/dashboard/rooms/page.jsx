"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
        } else if (!["ADMIN", "HOUSEKEEPING"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchRooms();
        }
    }, [session, status, router]);

    async function fetchRooms() {
        try {
            const res = await fetch("/api/rooms");
            if (!res.ok) throw new Error("خطأ في جلب الغرف");
            const data = await res.json();
            setRooms(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return <p>جاري تحميل الغرف...</p>;
    }

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg" dir="rtl">
            <h1 className="text-3xl mb-6 text-black dark:text-white">إدارة الغرف</h1>

            <button
                onClick={() => router.push("/dashboard/rooms/new")}
                className="mb-6 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
            >
                إضافة غرفة جديدة
            </button>

            {rooms.length === 0 ? (
                <p className="text-black dark:text-white">لا يوجد غرف حاليا.</p>
            ) : (
                <div className="overflow-x-auto rounded border border-gray-300 dark:border-gray-700">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border px-4 py-2 text-black dark:text-white">رقم الغرفة</th>
                                <th className="border px-4 py-2 text-black dark:text-white">الطابق</th>
                                <th className="border px-4 py-2 text-black dark:text-white">النوع</th>
                                <th className="border px-4 py-2 text-black dark:text-white">الحالة</th>
                                <th className="border px-4 py-2 text-black dark:text-white">سعر الليلة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                                    <td className="border px-4 py-2 text-black dark:text-white">{room.roomNumber}</td>
                                    <td className="border px-4 py-2 text-black dark:text-white">{room.floor}</td>
                                    <td className="border px-4 py-2 text-black dark:text-white">{room.type}</td>
                                    <td className="border px-4 py-2 text-black dark:text-white">{room.status}</td>
                                    <td className="border px-4 py-2 text-black dark:text-white">{room.pricePerNight}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>


    );
}
