'use client';
import Link from 'next/link';

export default function DashboardPage() {
  const modules = [
    { name: 'Rooms', href: '/rooms', color: 'bg-purple-500' },
    { name: 'Bookings', href: '/bookings', color: 'bg-green-500' },
    { name: 'Guests', href: '/guests', color: 'bg-pink-500' },
    { name: 'Folios', href: '/folios', color: 'bg-yellow-500' },
    { name: 'Housekeeping', href: '/housekeeping', color: 'bg-blue-500' },
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => (
          <Link
            key={mod.name}
            href={mod.href}
            className={`${mod.color} text-white p-6 rounded shadow hover:scale-105 transition`}
          >
            {mod.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
