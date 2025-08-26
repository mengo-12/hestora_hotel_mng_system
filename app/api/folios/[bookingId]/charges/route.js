// app/api/folios/[bookingId]/charges/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";


export async function GET(req, { params }) {
    try {
        const charges = await prisma.charge.findMany({
            where: { folio: { bookingId: params.bookingId } },
            include: {
                postedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return new Response(JSON.stringify(charges), { status: 200 });
    } catch (err) {
        console.error("Error fetching charges:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch charges" }), { status: 500 });
    }
}


export async function POST(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

        const { code, description, amount, tax } = await req.json();
        if (!code || !description || !amount) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const folio = await prisma.folio.findUnique({ where: { bookingId: params.bookingId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        const charge = await prisma.charge.create({
            data: {
                folioId: folio.id,
                code,
                description,
                amount: Number(amount),
                tax: tax ? Number(tax) : 0,
                postedById: session.user.id,
            },
            include: { postedBy: true },
        });

        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "CHARGE_ADDED", data: { folioId: folio.id, charge } }),
        });

        return new Response(JSON.stringify(charge), { status: 201 });
    } catch (err) {
        console.error("Error creating charge:", err);
        return new Response(JSON.stringify({ error: "Failed to add charge" }), { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const bookingId = params.bookingId;
        const { chargeId } = await req.json();

        const folio = await prisma.folio.findUnique({ where: { bookingId } });
        if (!folio) return new Response(JSON.stringify({ error: "Folio not found" }), { status: 404 });

        await prisma.charge.delete({ where: { id: chargeId } });

        await fetch("http://localhost:3001/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "CHARGE_DELETED", data: { folioId: folio.id, chargeId } }),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Error deleting charge:", err);
        return new Response(JSON.stringify({ error: "Failed to delete charge" }), { status: 500 });
    }
}
