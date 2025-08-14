import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

// ---------------- GET: جلب بيانات نزيل ----------------
export async function GET(req, context) {
    try {
        await requireAuth(req);

        const { params } = context;
        const guestId = params.id;

        if (!guestId) {
            return new Response(
                JSON.stringify({ error: "guestId غير محدد" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const guest = await prisma.guest.findUnique({
            where: { id: guestId },
        });

        if (!guest) {
            return new Response(
                JSON.stringify({ error: "النزيل غير موجود" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(JSON.stringify(guest), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        const status = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// ---------------- PUT: تعديل بيانات نزيل ----------------
export async function PUT(req, context) {
    try {
        await requireAuth(req);

        const { params } = context;
        const guestId = params.id;

        if (!guestId) {
            return new Response(
                JSON.stringify({ error: "guestId غير محدد" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await req.json();

        // التحقق من وجود النزيل أولاً
        const existingGuest = await prisma.guest.findUnique({ where: { id: guestId } });
        if (!existingGuest) {
            return new Response(
                JSON.stringify({ error: "النزيل غير موجود" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // تحويل التواريخ إلى Date
        const dateFields = ["dateOfBirth", "passportIssue", "passportExpiry", "checkIn", "checkOut"];
        for (const field of dateFields) {
            if (data[field]) {
                data[field] = new Date(data[field]);
            }
        }

        const updatedGuest = await prisma.guest.update({
            where: { id: guestId },
            data,
        });

        return new Response(JSON.stringify(updatedGuest), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        const status = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// ---------------- DELETE: حذف نزيل ----------------
export async function DELETE(req, context) {
    try {
        await requireAuth(req);

        const { params } = context;
        const guestId = params.id;

        if (!guestId) {
            return new Response(
                JSON.stringify({ error: "guestId غير محدد" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const existingGuest = await prisma.guest.findUnique({ where: { id: guestId } });
        if (!existingGuest) {
            return new Response(
                JSON.stringify({ error: "النزيل غير موجود" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        await prisma.guest.delete({ where: { id: guestId } });

        return new Response(
            JSON.stringify({ message: "تم حذف النزيل" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        const status = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// ---------------- POST: إضافة نزيل جديد ----------------
export async function POST(req) {
    try {
        await requireAuth(req);

        const data = await req.json();

        // تحويل التواريخ إلى Date
        const dateFields = ["dateOfBirth", "passportIssue", "passportExpiry", "checkIn", "checkOut"];
        for (const field of dateFields) {
            if (!data[field]) {
                return new Response(
                    JSON.stringify({ error: `حقل ${field} مطلوب` }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
            data[field] = new Date(data[field]);
        }

        const newGuest = await prisma.guest.create({ data });

        return new Response(JSON.stringify(newGuest), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        const status = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}
