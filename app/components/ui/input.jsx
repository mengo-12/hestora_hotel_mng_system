// app/components/ui/input.jsx
'use client';

export function Input({ className = '', ...props }) {
    return (
        <input
            className={`w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
            {...props}
        />
    );
}
