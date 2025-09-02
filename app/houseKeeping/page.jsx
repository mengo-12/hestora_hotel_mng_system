'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import HousekeepingModal from "@/app/components/HousekeepingModal";

export default function HousekeepingPage() {
    const [tasks, setTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalTask, setModalTask] = useState(null);
    const socket = useSocket();

    const fetchTasks = async () => {
        const res = await fetch("/api/housekeeping");
        const data = await res.json();
        setTasks(data);
    };

    useEffect(() => { fetchTasks(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("HK_TASK_UPDATED", (updatedTask) => {
            setTasks(prev => {
                const index = prev.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) prev[index] = updatedTask;
                else prev.push(updatedTask);
                return [...prev];
            });
        });
        return () => socket.off("HK_TASK_UPDATED");
    }, [socket]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Housekeeping Tasks</h1>
            <button
                onClick={() => { setModalTask(null); setShowModal(true); }}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Task
            </button>

            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Room</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Assigned To</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(t => (
                        <tr key={t.id} className="border-b">
                            <td className="p-2">{t.room?.number}</td>
                            <td className="p-2">{t.type}</td>
                            <td className="p-2">{t.status}</td>
                            <td className="p-2">{t.assignedTo?.name || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <HousekeepingModal
                    task={modalTask}
                    onClose={() => setShowModal(false)}
                    onSaved={() => fetchTasks()}
                />
            )}
        </div>
    );
}
