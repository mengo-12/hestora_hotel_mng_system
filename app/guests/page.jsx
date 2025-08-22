// app/guests/page.jsx
import { prisma } from '../../lib/prisma';

export default async function GuestsPage() {
    const guests = await prisma.guest.findMany({
        include: { bookings: true },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Guests</h1>
            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Bookings</th>
                    </tr>
                </thead>
                <tbody>
                    {guests.map((g) => (
                        <tr key={g.id} className="border-b">
                            <td className="p-2">{g.firstName} {g.lastName}</td>
                            <td className="p-2">{g.email || '-'}</td>
                            <td className="p-2">{g.phone || '-'}</td>
                            <td className="p-2">{g.bookings.length}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
