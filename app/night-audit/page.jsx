import ProtectedPage from "@/app/components/ProtectedPage";
import NightAuditPageClient from "./NightAuditPageClient"; // نسخة client-side
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
            allowedRoles={["ADMIN", "Manager"]}
        >
            <NightAuditPageClient
                initialProperties={userProperties}
                initialPropertyId={userProperties?.[0]?.id || ""}
                session={session}
            />
        </ProtectedPage>
    );
}
