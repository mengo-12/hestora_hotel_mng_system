"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ReservationsPage() {
    const { data, mutate } = useSWR("/api/reservations", fetcher);
    const [guestName, setGuestName] = useState("");
    const [arrival, setArrival] = useState("");
    const [departure, setDeparture] = useState("");

    const handleAdd = async (e) => {
        e.preventDefault();
        await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestName, arrival, departure }),
        });
        mutate(); // إعادة تحميل البيانات
        setGuestName("");
        setArrival("");
        setDeparture("");
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">الحجوزات</h2>

            <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2">
                <input
                    type="text"
                    placeholder="اسم النزيل"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="p-2 border rounded"
                    required
                />
                <input
                    type="date"
                    value={arrival}
                    onChange={(e) => setArrival(e.target.value)}
                    className="p-2 border rounded"
                    required
                />
                <input
                    type="date"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="p-2 border rounded"
                    required
                />
                <button className="bg-blue-600 text-white p-2 rounded">إضافة حجز</button>
            </form>

            <div className="grid gap-2">
                {data?.map((res) => (
                    <div key={res.id} className="p-3 bg-white rounded shadow">
                        <p>النزيل: {res.guestName}</p>
                        <p>الوصول: {res.arrival}</p>
                        <p>المغادرة: {res.departure}</p>
                    </div>
                )) || <p>جارٍ تحميل الحجوزات...</p>}
            </div>
        </div>
    );
}
