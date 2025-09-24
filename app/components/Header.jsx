// 'use client';
// import { useState, useEffect } from "react";
// import { usePathname } from "next/navigation";
// import ThemeToggle from "./ThemeToggle";
// import { Bell, Menu, LogOut } from "lucide-react";
// import { signOut } from "next-auth/react";

// export default function Header({ session, collapsed, setCollapsed }) {
//     const pathname = usePathname();
//     const [sectionName, setSectionName] = useState("");
//     const [notificationsOpen, setNotificationsOpen] = useState(false);

//     // تحديد اسم القسم الحالي بناءً على المسار
//     useEffect(() => {
//         const pathMap = {
//             "/": "Dashboard",
//             "/front-desk": "Front desk",
//             "/rooms": "Rooms",
//             "/bookings": "Bookings",
//             "/guests": "Guests",
//             "/folios": "Folio",
//             "/companies": "Companies",
//             "/groups": "Groups",
//             "/groupBookings": "Groups bookings",
//             "/roomsBlocks": "Rooms Blocks",
//             "/houseKeeping": "Housekeeping",
//             "/night-audit": "Night Audit",
//             "/inventory": "Inventory",
//             "/rate-plans": "Rate plans",
//             "/reports": "Reports",
//             "/reports/financial": "Reports - Financial",
//             "/settings_hotel": "Settings",
//             "/settings_hotel/users": "Settings - Users",
//         };
//         setSectionName(pathMap[pathname] || "Section");
//     }, [pathname]);

//     return (
//         <header className="w-full flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 shadow-md fixed top-0 z-50">
//             {/* زر فتح/إغلاق Sidebar */}
//             <button
//                 onClick={() => setCollapsed(!collapsed)}
//                 className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition"
//             >
//                 <Menu className="text-gray-700 dark:text-gray-200" size={20} />
//             </button>

//             {/* القسم الحالي */}
//             <div className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100 text-center md:text-left">
//                 {sectionName}
//             </div>

//             {/* أيقونات وبيانات المستخدم */}
//             <div className="flex items-center gap-4">
//                 {/* Notifications */}
//                 <div className="relative">
//                     <button
//                         onClick={() => setNotificationsOpen(!notificationsOpen)}
//                         className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
//                     >
//                         <Bell className="text-gray-700 dark:text-gray-200" size={20} />
//                     </button>
//                     {notificationsOpen && (
//                         <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50">
//                             <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Notifications</div>
//                             <div className="text-sm text-gray-700 dark:text-gray-200">No new notifications</div>
//                         </div>
//                     )}
//                 </div>

//                 {/* Theme Toggle */}
//                 <ThemeToggle />

//                 {/* بيانات المستخدم داخل الهيدر */}
//                 {session?.user && (
//                     <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
//                         {session.user.image ? (
//                             <img
//                                 src={session.user.image}
//                                 alt={session.user.name}
//                                 className="w-10 h-10 rounded-full"
//                             />
//                         ) : (
//                             <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
//                                 {session.user.name?.charAt(0)}
//                             </div>
//                         )}
//                         <div className="flex flex-col">
//                             <span className="font-semibold text-gray-900 dark:text-gray-100">{session.user.name}</span>
//                             {session.user.role && <span className="text-sm text-gray-600 dark:text-gray-300">{session.user.role}</span>}
//                             <span className="text-sm text-gray-600 dark:text-gray-300">{session.user.email}</span>
//                         </div>
//                         <button
//                             onClick={() => signOut()}
//                             className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 transition"
//                         >
//                             <LogOut size={16} /> Logout
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </header>

//     );
// }





'use client';
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { Bell, Menu, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Header({ session, collapsed, setCollapsed }) {
    const pathname = usePathname();
    const [sectionName, setSectionName] = useState("");
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notifRef = useRef(null);

    // تحديث اسم القسم بناءً على المسار
    useEffect(() => {
        const pathMap = {
            "/": "Dashboard",
            "/front-desk": "Front desk",
            "/rooms": "Rooms",
            "/bookings": "Bookings",
            "/guests": "Guests",
            "/folios": "Folio",
            "/companies": "Companies",
            "/groups": "Groups",
            "/groupBookings": "Groups bookings",
            "/roomsBlocks": "Rooms Blocks",
            "/houseKeeping": "Housekeeping",
            "/night-audit": "Night Audit",
            "/inventory": "Inventory",
            "/rate-plans": "Rate plans",
            "/reports": "Reports",
            "/reports/financial": "Reports - Financial",
            "/settings_hotel": "Settings",
            "/settings_hotel/users": "Settings - Users",
        };
        setSectionName(pathMap[pathname] || "Section");
    }, [pathname]);

    // إغلاق Notifications عند الضغط خارجها
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notifRef]);

    return (
        <header className="flex items-center justify-between px-6 h-16 bg-white dark:bg-gray-900 shadow-md flex-shrink-0 z-20">
            {/* زر فتح/إغلاق Sidebar */}
            <button
                onClick={() => setCollapsed?.(!collapsed)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition"
            >
                <Menu className="text-gray-700 dark:text-gray-200" size={20} />
            </button>

            {/* اسم القسم الحالي */}
            <div className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100 text-center md:text-left">
                {sectionName}
            </div>

            {/* أيقونات وبيانات المستخدم */}
            <div className="flex items-center gap-4 h-full">
                {/* Notifications */}
                <div className="relative flex items-center h-full" ref={notifRef}>
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                    >
                        <Bell className="text-gray-700 dark:text-gray-200" size={20} />
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50">
                            <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Notifications</div>
                            <div className="text-sm text-gray-700 dark:text-gray-200">No new notifications</div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* بيانات المستخدم */}
                {session?.user && (
                    <div className="flex items-center gap-3 h-full">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                {session.user.name?.charAt(0)}
                            </div>
                        )}
                        <div className="flex flex-col justify-center text-right">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{session.user.name}</span>
                            {session.user.role && <span className="text-sm text-gray-600 dark:text-gray-300">{session.user.role}</span>}
                            {/* <span className="text-sm text-gray-600 dark:text-gray-300">{session.user.email}</span> */}
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 transition"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}


