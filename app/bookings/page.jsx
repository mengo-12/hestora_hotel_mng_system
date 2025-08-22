// app/bookings/page.jsx
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export default async function BookingsPage() {
    const bookings = await prisma.booking.findMany({
        include: {
            guest: true,
            room: { include: { roomType: true } },
            ratePlan: true,
        },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Bookings</h1>
            <Link
                href="/bookings/new"
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block"
            >
                New Booking
            </Link>
            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Room</th>
                        <th className="p-2">Rate Plan</th>
                        <th className="p-2">Check-In</th>
                        <th className="p-2">Check-Out</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((b) => (
                        <tr key={b.id} className="border-b">
                            <td className="p-2">{b.guest.firstName} {b.guest.lastName}</td>
                            <td className="p-2">{b.room?.number || '-'}</td>
                            <td className="p-2">{b.ratePlan?.name || '-'}</td>
                            <td className="p-2">{new Date(b.checkIn).toLocaleDateString()}</td>
                            <td className="p-2">{new Date(b.checkOut).toLocaleDateString()}</td>
                            <td className="p-2">{b.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
