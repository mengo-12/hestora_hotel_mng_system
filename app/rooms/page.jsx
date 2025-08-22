// app/rooms/page.jsx
import { prisma } from '../../lib/prisma';

export default async function RoomsPage() {
    const rooms = await prisma.room.findMany({
        include: { roomType: true },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Rooms</h1>
            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Number</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Floor</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map((room) => (
                        <tr key={room.id} className="border-b">
                            <td className="p-2">{room.number}</td>
                            <td className="p-2">{room.roomType.name}</td>
                            <td className="p-2">{room.status}</td>
                            <td className="p-2">{room.floor}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
