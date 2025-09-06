"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage({ children, session, allowedRoles = [] }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!session) {
            router.replace("/auth/signin");
            return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
            router.replace("/unauthorized");
            return;
        }

        setAuthorized(true);
    }, [session, router, allowedRoles]);

    if (!authorized) return null;

    return <>{children}</>; // JSX عادي
}
