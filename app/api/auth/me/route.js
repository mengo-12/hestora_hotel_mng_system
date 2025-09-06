import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ user: null }), { status: 200 });

    return new Response(JSON.stringify({ user: session.user }), { status: 200 });
}
