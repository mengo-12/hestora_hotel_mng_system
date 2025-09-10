import ProtectedPage from "@/app/components/ProtectedPage";
import RatePlansPage from "./RatePlansPage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session?.user) return <p>ليس لديك صلاحية للوصول لهذه الصفحة.</p>;

    // جلب كل الفنادق التي ينتمي إليها المستخدم
    const userProperties = await prisma.property.findMany({
        where: {
            users: { some: { id: session.user.id } }
        },
        select: {
            id: true,
            name: true,
            roomTypes: { select: { id: true, name: true } } // مهم جداً
        }
    });

    return (
        <ProtectedPage session={session} allowedRoles={["Admin", "FrontDesk", "Manager"]}>
            <RatePlansPage session={session} userProperties={userProperties} />
        </ProtectedPage>
    );
}
