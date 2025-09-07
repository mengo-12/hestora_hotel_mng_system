// 'use client';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useState, useEffect } from 'react';
// import ThemeToggle from "./ThemeToggle";
// import { signOut, useSession } from "next-auth/react"; // ✅ useSession
// import { useSocket } from './SocketProvider';

// export default function Sidebar() {
//     const pathname = usePathname();
//     const [settingsOpen, setSettingsOpen] = useState(false);
//     const { data: session, status, update } = useSession(); // ✅ reactive session
//     const socket = useSocket();

//     // الاستماع لتحديثات المستخدم عبر Socket.io
//     useEffect(() => {
//         if (!socket) return;

//         const handler = (updatedUser) => {
//             update({
//                 ...session,
//                 user: updatedUser
//             }); // ✅ يجدد بيانات الـ session مباشرة
//         };

//         socket.on("USER_UPDATED", handler);
//         return () => socket.off("USER_UPDATED", handler);
//     }, [socket, session, update]);

//     const links = [
//         { name: 'Dashboard', href: '/' },
//         { name: 'Front desk', href: '/front-desk' },
//         { name: 'Rooms', href: '/rooms' },
//         { name: 'Bookings', href: '/bookings' },
//         { name: 'Guests', href: '/guests' },
//         { name: 'Folios', href: '/folios' },
//         { name: 'Housekeeping', href: '/houseKeeping' },
//         { name: 'Night Audit', href: '/night-audit' },
//         { name: 'Reports', href: '/reports' },
//     ];

//     return (
//         <aside className="w-64 bg-white dark:bg-gray-800 shadow flex flex-col text-gray-900 dark:text-gray-100">

//             {/* بيانات المستخدم */}
//             {session?.user && (
//                 <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//                     <div className="font-bold text-lg">{session.user.name}</div>
//                     <div className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</div>
//                     <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">{session.user.role}</div>
//                 </div>
//             )}

//             <div className="p-6 font-bold text-2xl border-b border-gray-200 dark:border-gray-700">
//                 Hestora PMS
//             </div>

//             <nav className="flex-1 p-4 space-y-2">
//                 {links.map(link => (
//                     <Link
//                         key={link.name}
//                         href={link.href}
//                         className={`block px-4 py-2 rounded 
//               ${pathname === link.href
//                         ? 'bg-gray-300 dark:bg-gray-700 font-semibold'
//                         : 'hover:bg-gray-200 dark:hover:bg-gray-700'
//                     }`}
//                     >
//                         {link.name}
//                     </Link>
//                 ))}

//                 {/* Settings Dropdown */}
//                 <div>
//                     <button
//                         onClick={() => setSettingsOpen(!settingsOpen)}
//                         className={`w-full text-left px-4 py-2 rounded flex justify-between items-center
//               ${pathname.startsWith('/settings_hotel') ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
//                     >
//                         Settings
//                         <span className="ml-2">{settingsOpen ? '▲' : '▼'}</span>
//                     </button>

//                     {settingsOpen && (
//                         <div className="pl-4 mt-1 space-y-1">
//                             <Link
//                                 href="/settings_hotel"
//                                 className={`block px-4 py-2 rounded 
//                   ${pathname === '/settings_hotel' ? 'bg-gray-200 dark:bg-gray-600 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
//                             >
//                                 Hotel
//                             </Link>
//                             <Link
//                                 href="/settings_hotel/users"
//                                 className={`block px-4 py-2 rounded 
//                   ${pathname === '/settings_hotel/users' ? 'bg-gray-200 dark:bg-gray-600 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
//                             >
//                                 Users
//                             </Link>
//                         </div>
//                     )}
//                 </div>
//             </nav>

//             <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
//                 <ThemeToggle />

//                 {session?.user ? (
//                     <button
//                         onClick={() => signOut({ callbackUrl: '/auth/signin' })}
//                         className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//                     >
//                         تسجيل الخروج
//                     </button>
//                 ) : (
//                     <Link
//                         href="/auth/signin"
//                         className="w-full px-4 py-2 bg-blue-500 text-white rounded text-center hover:bg-blue-600"
//                     >
//                         تسجيل الدخول
//                     </Link>
//                 )}

//                 <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//                     &copy; 2025 Hestora Hotel
//                 </div>
//             </div>
//         </aside>
//     );
// }




'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from "./ThemeToggle";
import { signOut, useSession } from "next-auth/react";
import { useSocket } from './SocketProvider';

export default function Sidebar() {
    const pathname = usePathname();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false); // <-- dropdown Reports
    const { data: session, status, update } = useSession();
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handler = (updatedUser) => {
            update({ ...session, user: updatedUser });
        };

        socket.on("USER_UPDATED", handler);
        return () => socket.off("USER_UPDATED", handler);
    }, [socket, session, update]);

    const links = [
        { name: 'Dashboard', href: '/' },
        { name: 'Front desk', href: '/front-desk' },
        { name: 'Rooms', href: '/rooms' },
        { name: 'Bookings', href: '/bookings' },
        { name: 'Guests', href: '/guests' },
        { name: 'Folios', href: '/folios' },
        { name: 'Housekeeping', href: '/houseKeeping' },
        { name: 'Night Audit', href: '/night-audit' },
    ];

    const role = session?.user?.role || "Guest";

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 shadow flex flex-col text-gray-900 dark:text-gray-100">
            {session?.user && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-bold text-lg">{session.user.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">{session.user.role}</div>
                </div>
            )}

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

                {/* Reports Dropdown */}
                <div>
                    <button
                        onClick={() => setReportsOpen(!reportsOpen)}
                        className={`w-full text-left px-4 py-2 rounded flex justify-between items-center
            ${pathname.startsWith('/reports') ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        Reports
                        <span className="ml-2">{reportsOpen ? '▲' : '▼'}</span>
                    </button>

                    {reportsOpen && (
                        <div className="pl-4 mt-1 space-y-1">
                            <Link
                                href="/reports"
                                className={`block px-4 py-2 rounded 
                ${pathname === '/reports' ? 'bg-gray-200 dark:bg-gray-600 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Overview
                            </Link>

                            <Link
                                href="/reports/financial"
                                className={`block px-4 py-2 rounded 
                ${pathname.startsWith('/reports/financial') ? 'bg-gray-200 dark:bg-gray-600 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Financial
                            </Link>
                        </div>
                    )}
                </div>

                {/* Settings Dropdown */}
                <div>
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className={`w-full text-left px-4 py-2 rounded flex justify-between items-center
              ${pathname.startsWith('/settings_hotel') ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        Settings
                        <span className="ml-2">{settingsOpen ? '▲' : '▼'}</span>
                    </button>

                    {settingsOpen && (
                        <div className="pl-4 mt-1 space-y-1">
                            <Link
                                href="/settings_hotel"
                                className={`block px-4 py-2 rounded 
                  ${pathname === '/settings_hotel' ? 'bg-gray-200 dark:bg-gray-600 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Hotel
                            </Link>
                            <Link
                                href="/settings_hotel/users"
                                className={`block px-4 py-2 rounded 
                  ${pathname === '/settings_hotel/users' ? 'bg-gray-200 dark:bg-gray-600 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Users
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                <ThemeToggle />
                {session?.user ? (
                    <button
                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        تسجيل الخروج
                    </button>
                ) : (
                    <Link
                        href="/auth/signin"
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded text-center hover:bg-blue-600"
                    >
                        تسجيل الدخول
                    </Link>
                )}
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    &copy; 2025 Hestora Hotel
                </div>
            </div>
        </aside>
    );
}
