/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,code]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId,roomTypeId,date]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `propertyId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Company_code_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "propertyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN     "hotelGroupId" TEXT,
ADD COLUMN     "propertyId" TEXT;

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "hotelGroupId" TEXT;

-- CreateTable
CREATE TABLE "public"."HotelGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_propertyId_code_key" ON "public"."Company"("propertyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_propertyId_roomTypeId_date_key" ON "public"."Inventory"("propertyId", "roomTypeId", "date");

-- AddForeignKey
ALTER TABLE "public"."HotelGroup" ADD CONSTRAINT "HotelGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_hotelGroupId_fkey" FOREIGN KEY ("hotelGroupId") REFERENCES "public"."HotelGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Guest" ADD CONSTRAINT "Guest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Guest" ADD CONSTRAINT "Guest_hotelGroupId_fkey" FOREIGN KEY ("hotelGroupId") REFERENCES "public"."HotelGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
