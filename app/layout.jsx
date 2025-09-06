// import { Inter } from "next/font/google";
// import "./globals.css";
// import { SocketProvider } from "@/app/components/SocketProvider";
// import { ThemeProvider } from "next-themes";
// import Sidebar from "./components/Sidebar";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//     title: "Hestora Hotel PMS",
//     description: "Hotel Management System",
// };

// export default function RootLayout({ children }) {
//     return (
//         <html lang="en" suppressHydrationWarning>
//             <body className={inter.className}>
//                 <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
//                     {/* نوفر الـ Socket context لكل الصفحات */}
//                     <SocketProvider>
//                         <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
//                             <Sidebar />
//                             <main className="flex-1 p-6">{children}</main>
//                         </div>
//                     </SocketProvider>
//                 </ThemeProvider>
//             </body>
//         </html>
//     );
// }



import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Providers from "@/app/components/Providers"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // ملف إعدادات next-auth الخاص بك

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Hestora Hotel PMS",
    description: "Hotel Management System",
};

export default async function RootLayout({ children }) {
    const session = await getServerSession(authOptions); // 🔑 جلب الجلسة

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                        <Sidebar session={session} /> {/* تمرير الجلسة */}
                        <main className="flex-1 p-6">{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}


