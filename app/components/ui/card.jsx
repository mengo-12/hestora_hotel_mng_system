// app/components/ui/card.jsx
'use client';

export function Card({ children, className = '' }) {
    return (
        <div className={`p-4 rounded-lg shadow bg-white dark:bg-gray-700 ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children }) {
    return <div className="mb-2 font-bold text-lg">{children}</div>;
}

export function CardContent({ children }) {
    return <div>{children}</div>;
}
