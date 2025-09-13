'use client';
import { useState, useEffect } from "react";
import { useSocket } from "./SocketProvider";

export default function AddGroupModal({ isOpen, onClose, onSaved }) {
    const [name, setName] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [leaderId, setLeaderId] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [properties, setProperties] = useState([]);
    const [leaders, setLeaders] = useState([]);
    const [companies, setCompanies] = useState([]);
    const socket = useSocket();

    useEffect(() => {
        // Fetch properties, leaders, companies
        const fetchData = async () => {
            const [propsRes, leadersRes, companiesRes] = await Promise.all([
                fetch("/api/properties"),
                fetch("/api/guests"),
                fetch("/api/companies")
            ]);
            setProperties(await propsRes.json());
            setLeaders(await leadersRes.json());
            setCompanies(await companiesRes.json());
        };
        fetchData();
    }, []);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name || !propertyId || !leaderId || !startDate || !endDate) {
            alert("يرجى ملء الحقول المطلوبة");
            return;
        }

        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, propertyId, leaderId, companyId, startDate, endDate, notes })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create group");
            }

            const newGroup = await res.json();

            // 🔹 Broadcast
            try {
                await fetch("/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "GROUP_CREATED", data: newGroup })
                });
            } catch (err) {
                console.error("Socket broadcast failed:", err);
            }

            onSaved?.();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 space-y-4">
                <h2 className="text-xl font-bold">إضافة مجموعة جديدة</h2>

                <input type="text" placeholder="اسم المجموعة" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
                
                <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="">اختر الفندق</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select value={leaderId} onChange={e => setLeaderId(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="">اختر المسؤول</option>
                    {leaders.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
                </select>

                <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="">اختر الشركة (اختياري)</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="flex gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
                </div>

                <textarea placeholder="ملاحظات" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded" />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">إلغاء</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">حفظ</button>
                </div>
            </div>
        </div>
    );
}
