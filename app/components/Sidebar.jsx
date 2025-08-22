'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: 'Dashboard', href: '/' },
        { name: 'Rooms', href: '/rooms' },
        { name: 'Bookings', href: '/bookings' },
        { name: 'Guests', href: '/guests' },
        { name: 'Folios', href: '/folios' },
        { name: 'Housekeeping', href: '/housekeeping' },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 shadow flex flex-col text-gray-900 dark:text-gray-100">
            <div className="p-6 font-bold text-2xl border-b border-gray-200 dark:border-gray-700">
                Hestora PMS
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {links.map(link => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`block px-4 py-2 rounded 
                          ${pathname === link.href
                                ? 'bg-gray-300 dark:bg-gray-700 font-semibold'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {link.name}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <ThemeToggle />
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    &copy; 2025 Hestora Hotel
                </div>
            </div>
        </aside>
    );
}
