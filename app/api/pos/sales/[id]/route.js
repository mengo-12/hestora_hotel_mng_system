// app/api/pos/sales/[id]/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // السماح فقط لأدمن ومدير
        if (!["Admin", "Manager"].includes(session.user.role)) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }

        const { id } = params;

        // احذف العناصر المرتبطة أولاً (لتجنب P2003 Foreign key constraint)
        await prisma.pOSSaleItem.deleteMany({
            where: { saleId: id }
        });

        // بعدين احذف الفاتورة نفسها
        await prisma.pOSSale.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (err) {
        console.error("❌ Delete Sale API Error:", err);
        return new Response(JSON.stringify({ error: "Failed to delete sale" }), { status: 500 });
    }
}
