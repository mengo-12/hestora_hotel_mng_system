// app/pos/roles/page.jsx
import ProtectedPage from "@/app/components/ProtectedPage";
import POSRolesPage from "./POSRolesPage"; // الصفحة الفعلية للأدوار في POS
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
            allowedRoles={["Admin", "Manager"]} // فقط من لديهم صلاحيات إدارة POS
        >
            <POSRolesPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}
