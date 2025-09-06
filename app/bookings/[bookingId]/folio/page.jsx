import ProtectedPage from "@/app/components/ProtectedPage";
import FolioPage from "./FolioPage"; // ✨ أنقل الكود الأصلي هنا
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function Page({ params }) {
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
            allowedRoles={["ADMIN", "FrontDesk", "Manager"]}
        >
            <FolioPage 
                bookingId={params.bookingId} 
                userProperties={userProperties} 
                session={session} 
            />
        </ProtectedPage>
    );
}
