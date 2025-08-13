import './globals.css';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Providers } from './components/Providers';
import Header from './components/Header';


export default function RootLayout({ children }) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <Providers>
                    <Header/>
                    <ToastContainer position="top-right" />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
