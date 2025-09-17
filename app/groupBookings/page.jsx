// app/group-bookings/page.jsx
import ProtectedPage from "@/app/components/ProtectedPage";
import GroupBookingsPage from "./GroupBookingsPage"; // صفحة الكارد
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page() {
    const session = await getServerSession(authOptions);

    let userProperties = [];
    let groups = [];
    if (session?.user?.id) {
        userProperties = await prisma.property.findMany({
            where: { users: { some: { id: session.user.id } } },
            select: { id: true, name: true }
        });

        groups = await prisma.groupMaster.findMany({
            where: { propertyId: { in: userProperties.map(p => p.id) } },
            select: { id: true, name: true }
        });
    }

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <GroupBookingsPage userProperties={userProperties} session={session} groups={groups} />
        </ProtectedPage>
    );
}
