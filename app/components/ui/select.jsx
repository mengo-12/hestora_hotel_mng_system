// app/components/ui/select.jsx
'use client';

export function Select({ className = '', children, ...props }) {
    return (
        <select
            className={`w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}
