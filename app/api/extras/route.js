import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function GET() {
    const extras = await prisma.extraService.findMany()
    return new Response(JSON.stringify(extras), { status: 200 })
}
