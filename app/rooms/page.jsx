
// FrontDesk: يرى الغرف للفندق المخصص له فقط، يمكنه Check-In / Check-Out.

// Manager: يرى كل غرف الفنادق المسموح بها له، يمكنه إضافة وتعديل الغرف، لكنه لا يمكنه حذفها.

// Admin: كامل الصلاحيات (Add / Edit / Delete / Check-In/Out).

// HK: يرى الغرف للفندق المخصص له فقط، لا يمكنه تعديل الغرف، لكنه يرى الحالة فقط.


import ProtectedPage from "@/app/components/ProtectedPage";
import RoomsPage from "./RoomsPage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page() {
    const session = await getServerSession(authOptions);

    let userProperties = [];
    if (session?.user?.id) {
        userProperties = await prisma.property.findMany({
            where: {
                users: { some: { id: session.user.id } }
            },
            select: { id: true, name: true }
        });
    }

    return (
        <ProtectedPage
            session={session}
            allowedRoles={["ADMIN", "FrontDesk", "Manager", "HK"]}
        >
            <RoomsPage 
                userProperties={userProperties} 
                session={session} 
            />
        </ProtectedPage>
    );
}
