// import { Inter } from "next/font/google";
// import "./globals.css";
// import Sidebar from "./components/Sidebar";
// import Header from "@/app/components/Header";
// import Providers from "@/app/components/Providers"; 
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//     title: "Hestora Hotel PMS",
//     description: "Hotel Management System",
// };

// export default async function RootLayout({ children }) {
//     const session = await getServerSession(authOptions); // جلب الجلسة

//     return (
//         <html lang="en" suppressHydrationWarning>
//             <body className={inter.className}>
//                 <Providers>
//                     <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
//                         {/* Sidebar */}
//                         <Sidebar session={session} />

//                         {/* Main column */}
//                         <div className="flex-1 flex flex-col">
//                             {/* Header */}
//                             <Header session={session} />

//                             {/* Content */}
//                             <main className="flex-1 p-6 overflow-auto">
//                                 {children}
//                             </main>
//                         </div>
//                     </div>
//                 </Providers>
//             </body>
//         </html>
//     );
// }



import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "@/app/components/Header";
import Providers from "@/app/components/Providers"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Hestora Hotel PMS",
    description: "Hotel Management System",
};

export default async function RootLayout({ children }) {
    const session = await getServerSession(authOptions); // جلب الجلسة

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className}`}>
                <Providers>
                    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
                        {/* Sidebar */}
                        <Sidebar session={session} />

                        {/* Main content */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header */}
                            <Header session={session} />

                            {/* Content */}
                            <main className="flex-1 p-6 overflow-auto pt-16">
                                {/* pt-16 لإزاحة المحتوى أسفل الهيدر */}
                                {children}
                            </main>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
