import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";


async function main() {
    const folios = await prisma.folio.findMany({
        select: { id: true, bookingId: true, groupId: true, companyId: true, status: true }
    });
    console.log("Folios:", folios);

    const bookings = await prisma.booking.findMany({
        select: { id: true, guestId: true, groupId: true, companyId: true }
    });
    console.log("Bookings:", bookings);
}

main().finally(() => prisma.$disconnect());
