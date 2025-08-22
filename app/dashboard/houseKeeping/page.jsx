// app/housekeeping/page.jsx
import { prisma } from '../../lib/prisma';

export default async function HousekeepingPage() {
    const tasks = await prisma.housekeepingTask.findMany({
        include: {
            room: { include: { roomType: true } },
            assignedTo: true,
        },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Housekeeping</h1>
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
                    {tasks.map((t) => (
                        <tr key={t.id} className="border-b">
                            <td className="p-2">{t.room.number}</td>
                            <td className="p-2">{t.type}</td>
                            <td className="p-2">{t.status}</td>
                            <td className="p-2">{t.assignedTo?.name || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
