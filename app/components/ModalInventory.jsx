'use client';
import { ReactNode } from "react";

export default function Modal({ open, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-4 relative">
                {/* زر الإغلاق */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg font-bold"
                >
                    &times;
                </button>
                {/* محتوى المودال */}
                {children}
            </div>
        </div>
    );
}
