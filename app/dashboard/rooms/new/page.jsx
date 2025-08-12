"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AddRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState("");
    const [type, setType] = useState("SINGLE");
    const [pricePerNight, setPricePerNight] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) router.push("/login");
        else if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        }
    }, [session, status, router]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomNumber, floor: parseInt(floor), type, pricePerNight: parseFloat(pricePerNight) }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في إضافة الغرفة");
            }

            alert("تمت إضافة الغرفة بنجاح");
            router.push("/dashboard/rooms");
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading") {
        return <p className="text-center mt-10">جاري التحقق من الصلاحيات...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6 border rounded mt-6 shadow-md bg-white dark:bg-gray-900" dir="rtl">
            <h1 className="text-2xl mb-6 font-bold text-center text-black dark:text-white">إضافة غرفة جديدة</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <label className="flex flex-col text-right text-black dark:text-white">
                    رقم الغرفة <span className="text-red-600">*</span>
                    <input
                        type="text"
                        required
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                </label>

                <label className="flex flex-col text-right text-black dark:text-white">
                    الدور <span className="text-red-600">*</span>
                    <input
                        type="number"
                        required
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                </label>

                <label className="flex flex-col text-right text-black dark:text-white">
                    نوع الغرفة <span className="text-red-600">*</span>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
                    >
                        <option value="SINGLE">فردية</option>
                        <option value="DOUBLE">ثنائية</option>
                        <option value="SUITE">جناح</option>
                    </select>
                </label>

                <label className="flex flex-col text-right text-black dark:text-white">
                    سعر الليلة <span className="text-red-600">*</span>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
            </form>
        </div>

    );
}
