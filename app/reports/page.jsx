
// Admin: يرى كل الفنادق والتقارير.

// Manager: يرى فقط الفنادق المسموح بها له.

// FrontDesk: يرى فقط تقارير الفندق الذي يعمل فيه.

// الآن:

// Admin: يرى كل الفنادق، يمكن التصدير والطباعة.

// Manager: يرى فقط الفنادق المسموح بها له.

// FrontDesk: يرى فقط الفندق الخاص به ولا يمكنه تغييره.

// أزرار التصدير والطباعة محدودة حسب الدور.


// app/reports/page.jsx
import ProtectedPage from "@/app/components/ProtectedPage";
import ReportsPage from "./ReportsPage"; // نسخة client-side
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
            allowedRoles={["Admin", "Manager", "FrontDesk"]}
        >
            <ReportsPage userProperties={userProperties} session={session} />
        </ProtectedPage>
    );
}
