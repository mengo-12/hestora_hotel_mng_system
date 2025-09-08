import prisma from "../lib/prisma.js";

async function main() {
  console.log("Converting Room and RoomStatusLog enums to string...");

  // تحويل عمود Room.status
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Room"
    ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
  `);

  // تحويل أعمدة RoomStatusLog.oldStatus و newStatus
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "RoomStatusLog"
    ALTER COLUMN "oldStatus" TYPE TEXT USING "oldStatus"::TEXT,
    ALTER COLUMN "newStatus" TYPE TEXT USING "newStatus"::TEXT;
  `);

  // حذف enum القديم
  await prisma.$executeRawUnsafe(`
    DROP TYPE IF EXISTS "RoomStatus";
  `);

  console.log("Conversion completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
