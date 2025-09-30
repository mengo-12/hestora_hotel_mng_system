'use client';
import { useEffect, useState } from "react";

export default function AddLoyaltyMemberModal({ isOpen, onClose, userProperties, onAdded }) {
    const [guests, setGuests] = useState([]);
    const [selectedGuestId, setSelectedGuestId] = useState("");
    const [membershipLevel, setMembershipLevel] = useState("");
    const [loyaltyProgram, setLoyaltyProgram] = useState("");

    const levels = ["Bronze", "Silver", "Gold", "Platinum"]; // مستويات جاهزة

    useEffect(() => {
        if (!isOpen) return;

        const fetchGuests = async () => {
            try {
                const res = await fetch("/api/guests");
                const data = await res.json();
                setGuests(data);
            } catch (err) {
                console.error("Failed to fetch guests:", err);
            }
        };

        fetchGuests();
    }, [isOpen]);

    const handleAdd = async () => {
        if (!selectedGuestId) return alert("اختر نزيل");
        if (!membershipLevel) return alert("اختر المستوى");

        try {
            const res = await fetch("/api/loyalty/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guestId: selectedGuestId,
                    membershipLevel,
                    loyaltyProgram
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("تمت إضافة عضو الولاء بنجاح");
                if (onAdded) onAdded();
                onClose();
            } else {
                alert(data.error || "حدث خطأ أثناء الإضافة");
            }
        } catch (err) {
            alert("خطأ في الاتصال بالخادم");
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg border-t-4 border-blue-500">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">إضافة عضو ولاء جديد</h2>

                {/* اختيار النزيل */}
                <div className="flex flex-col mb-4">
                    <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">اختر النزيل</label>
                    <select
                        value={selectedGuestId}
                        onChange={e => setSelectedGuestId(e.target.value)}
                        className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- اختر النزيل --</option>
                        {guests.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.firstName} {g.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* اختيار المستوى */}
                <div className="flex flex-col mb-4">
                    <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">المستوى</label>
                    <select
                        value={membershipLevel}
                        onChange={e => setMembershipLevel(e.target.value)}
                        className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- اختر المستوى --</option>
                        {levels.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>

                {/* البرنامج */}
                <div className="flex flex-col mb-6">
                    <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">البرنامج</label>
                    <input
                        type="text"
                        value={loyaltyProgram}
                        onChange={e => setLoyaltyProgram(e.target.value)}
                        placeholder="اسم البرنامج"
                        className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* الأزرار */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-300 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-400 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        إضافة
                    </button>
                </div>
            </div>
        </div>
    );
}
