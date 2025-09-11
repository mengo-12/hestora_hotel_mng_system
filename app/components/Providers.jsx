"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SocketProvider } from "@/app/components/SocketProvider";


export default function Providers({ children }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <SocketProvider>

                    {children}

                </SocketProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
