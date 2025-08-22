// app/layout.jsx
import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Hestora Hotel PMS',
    description: 'Hotel Management System',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} flex h-screen bg-gray-100`}>
                <Sidebar />
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </body>
        </html>
    );
}
