// app/inventory/page.jsx
import ProtectedPage from "@/app/components/ProtectedPage";
import RoomInventoryPage from "./RoomInventoryPage";
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
            allowedRoles={["Admin", "FrontDesk", "Manager"]}
        >
            <RoomInventoryPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}
