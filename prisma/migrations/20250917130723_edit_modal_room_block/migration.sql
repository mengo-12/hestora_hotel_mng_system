-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "roomBlockId" TEXT,
ADD COLUMN     "roomTypeId" TEXT;

-- AlterTable
ALTER TABLE "public"."RoomBlock" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "public"."RoomType" ADD COLUMN     "companyId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."RoomType" ADD CONSTRAINT "RoomType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_roomBlockId_fkey" FOREIGN KEY ("roomBlockId") REFERENCES "public"."RoomBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomBlock" ADD CONSTRAINT "RoomBlock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
