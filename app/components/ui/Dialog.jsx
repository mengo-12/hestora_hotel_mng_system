// app/components/ui/dialog.jsx
'use client';
import { useEffect } from "react";

export function Dialog({ isOpen, onClose, children }) {
    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ children }) {
    return <div className="mb-4 font-bold text-lg text-gray-800 dark:text-white">{children}</div>;
}

export function DialogContent({ children }) {
    return <div className="space-y-4">{children}</div>;
}

export function DialogFooter({ children }) {
    return <div className="mt-4 flex justify-end gap-2">{children}</div>;
}
