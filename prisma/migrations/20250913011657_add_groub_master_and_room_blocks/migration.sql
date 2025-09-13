-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "public"."Folio" ADD COLUMN     "groupMasterId" TEXT;

-- CreateTable
CREATE TABLE "public"."GroupMaster" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "companyId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoomBlock" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "pickedUp" INTEGER NOT NULL DEFAULT 0,
    "ratePlanId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBlock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."GroupMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_groupMasterId_fkey" FOREIGN KEY ("groupMasterId") REFERENCES "public"."GroupMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMaster" ADD CONSTRAINT "GroupMaster_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMaster" ADD CONSTRAINT "GroupMaster_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "public"."Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMaster" ADD CONSTRAINT "GroupMaster_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomBlock" ADD CONSTRAINT "RoomBlock_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."GroupMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomBlock" ADD CONSTRAINT "RoomBlock_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomBlock" ADD CONSTRAINT "RoomBlock_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
