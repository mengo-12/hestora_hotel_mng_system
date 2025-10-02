// components/ConfirmationModal.jsx
"use client";
import React from "react";

export default function ConfirmationModal({ open, message, onClose, onConfirm, loading }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-80">
                <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 transition"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
