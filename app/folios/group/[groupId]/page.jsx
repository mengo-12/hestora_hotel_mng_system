'use client';
import { useEffect, useState } from "react";
import FolioPage from "../../[bookingId]/FolioPage";
import { getSession } from "next-auth/react";

export default function Page({ params }) {
    const groupId = params.groupId;
    const [session, setSession] = useState(null);

    // جلب الجلسة بشكل صحيح
    useEffect(() => {
        getSession().then(sess => setSession(sess));
    }, []);

    if (!session) return <p>Loading session...</p>;

    return <FolioPage groupId={groupId} session={session} />;
}