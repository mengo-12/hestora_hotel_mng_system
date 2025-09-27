'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BedDouble,
    Users,
    Building2,
    FolderOpen,
    Briefcase,
    CalendarCheck2,
    Layers,
    SprayCan,
    MoonStar,
    Package,
    DollarSign,
    Settings,
    BarChart2,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Utensils,
} from "lucide-react";

export default function Sidebar({ session, }) {
    const pathname = usePathname();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const links = [
        { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
        { name: 'Front desk', href: '/front-desk', icon: <BedDouble size={18} /> },
        { name: 'Rooms', href: '/rooms', icon: <FolderOpen size={18} /> },
        { name: 'Bookings', href: '/bookings', icon: <CalendarCheck2 size={18} /> },
        { name: 'Guests', href: '/guests', icon: <Users size={18} /> },
        { name: 'Folio', href: '/folios', icon: <Briefcase size={18} /> },
        { name: 'Companies', href: '/companies', icon: <Building2 size={18} /> },
        { name: 'Groups', href: '/groups', icon: <Users size={18} /> },
        { name: 'Groups bookings', href: '/groupBookings', icon: <Users size={18} /> },
        { name: 'Rooms Blocks', href: '/roomsBlocks', icon: <Layers size={18} /> },
        { name: 'Housekeeping', href: '/houseKeeping', icon: <SprayCan size={18} /> },
        { name: 'Night Audit', href: '/night-audit', icon: <MoonStar size={18} /> },
        { name: 'Inventory', href: '/inventory', icon: <Package size={18} /> },
        { name: 'Rate plans', href: '/rate-plans', icon: <DollarSign size={18} /> },
        { name: 'Restaurant', href: '/pos', icon: <Utensils size={18} /> },
    ];

    const SidebarContent = (
        <motion.div
            className={`flex flex-col h-full transition-all duration-300 shadow-xl ${
                collapsed ? 'w-20' : 'w-64'
            } bg-blue-700 text-white`}
            animate={{ width: collapsed ? 80 : 256 }}
        >
            {/* Logo */}
            <div className="p-6 font-bold text-2xl border-b border-blue-600 flex items-center justify-between">
                {!collapsed && <span>Hestora PMS</span>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded hover:bg-blue-600 transition-all"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto sidebar-scroll">
                {links.map(link => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                            pathname === link.href
                                ? 'bg-gradient-to-r from-blue-800 to-blue-900 font-semibold shadow-md'
                                : 'hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700'
                        }`}
                        onClick={() => setIsOpen(false)}
                    >
                        {link.icon}
                        {!collapsed && <span>{link.name}</span>}
                    </Link>
                ))}

                {/* Reports Dropdown */}
                {!collapsed && (
                    <div>
                        <button
                            onClick={() => setReportsOpen(!reportsOpen)}
                            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 ${
                                pathname.startsWith('/reports')
                                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 font-semibold shadow-md'
                                    : 'hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700'
                            }`}
                        >
                            <span className="flex items-center gap-2"><BarChart2 size={18}/> Reports</span>
                            <span>{reportsOpen ? '▲' : '▼'}</span>
                        </button>

                        {reportsOpen && (
                            <div className="pl-8 mt-1 space-y-1">
                                <Link href="/reports" className="block px-4 py-2 rounded hover:bg-blue-600">Overview</Link>
                                <Link href="/reports/financial" className="block px-4 py-2 rounded hover:bg-blue-600">Financial</Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Dropdown */}
                {!collapsed && (
                    <div>
                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 ${
                                pathname.startsWith('/settings_hotel')
                                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 font-semibold shadow-md'
                                    : 'hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700'
                            }`}
                        >
                            <span className="flex items-center gap-2"><Settings size={18} /> Settings</span>
                            <span>{settingsOpen ? '▲' : '▼'}</span>
                        </button>

                        {settingsOpen && (
                            <div className="pl-8 mt-1 space-y-1">
                                <Link href="/settings_hotel" className="block px-4 py-2 rounded hover:bg-blue-600">Hotel</Link>
                                <Link href="/settings_hotel/users" className="block px-4 py-2 rounded hover:bg-blue-600">Users</Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-blue-600 flex flex-col gap-3">
                {!collapsed && <div className="mt-2 text-sm text-blue-200 text-center">&copy; 2025 Hestora Hotel</div>}
            </div>
        </motion.div>
    );

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg"
            >
                <Menu size={20} />
            </button>

            {/* Desktop sidebar */}
            <div className="hidden md:block h-screen">{SidebarContent}</div>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full z-50"
                    >
                        {SidebarContent}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-white"
                        >
                            <X size={22} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                /* Custom scrollbar */
                .sidebar-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .sidebar-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    transition: background 0.3s;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.6);
                }
            `}</style>
        </>
    );
}




