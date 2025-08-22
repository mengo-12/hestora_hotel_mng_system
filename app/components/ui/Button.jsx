// app/components/ui/button.jsx
'use client';

export function Button({ children, className = '', ...props }) {
    return (
        <button
            className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
