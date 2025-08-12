"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddRoomPage() {
    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState(1);
    const [type, setType] = useState("SINGLE");
    const [pricePerNight, setPricePerNight] = useState("");
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();

        const data = {
            roomNumber,
            floor: Number(floor),
            type,
            pricePerNight: Number(pricePerNight),
        };

        const res = await fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            router.push("/dashboard/rooms");
        } else {
            alert("حدث خطأ أثناء إضافة الغرفة");
        }
    }

    return (
        <div>
            <h1 className="text-3xl mb-6">إضافة غرفة جديدة</h1>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label>رقم الغرفة</label>
                    <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div>
                    <label>الطابق</label>
                    <input
                        type="number"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        min={1}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div>
                    <label>نوع الغرفة</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="SINGLE">مفردة</option>
                        <option value="DOUBLE">مزدوجة</option>
                        <option value="SUITE">جناح</option>
                    </select>
                </div>

                <div>
                    <label>سعر الليلة (ريال)</label>
                    <input
                        type="number"
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(e.target.value)}
                        min={0}
                        required
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    إضافة الغرفة
                </button>
            </form>
        </div>
    );
}
