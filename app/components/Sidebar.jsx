// app/components/Sidebar.jsx
'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Bookings', path: '/bookings' },
    { name: 'Folios', path: '/folios' },
    { name: 'Housekeeping', path: '/housekeeping' },
    { name: 'Guests', path: '/guests' },
];

export default function Sidebar() {
    const pathname = usePathname();
    return (
        <aside className="w-64 bg-white shadow-md flex flex-col">
            <div className="p-6 text-xl font-bold border-b">Hestora PMS</div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.path}
                        className={`block p-2 rounded ${pathname === item.path ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                            }`}
                    >
                        {item.name}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
