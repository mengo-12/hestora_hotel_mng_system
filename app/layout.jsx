import './globals.css';

import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Providers } from './components/Providers';

export default function RootLayout({ children }) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <Providers>
                    <Header />
                    <ToastContainer position="top-right" />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
