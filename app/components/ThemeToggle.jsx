"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null; // 🔑 يمنع مشاكل Hydration

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg border bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}
