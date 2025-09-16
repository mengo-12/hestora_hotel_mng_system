// app/groups/page.jsx
import ProtectedPage from "@/app/components/ProtectedPage";
import GroupsPage from "./GroupsPage"; // الملف الداخلي للـ Groups UI
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page() {
    const session = await getServerSession(authOptions);

    // جلب الفنادق المسموح بها للمستخدم
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
            allowedRoles={["Admin", "FrontDesk", "Manager"]} // تحديد الأدوار المسموح لها
        >
            <GroupsPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}
