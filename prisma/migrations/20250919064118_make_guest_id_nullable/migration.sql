-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_guestId_fkey";

-- AlterTable
ALTER TABLE "public"."Booking" ALTER COLUMN "guestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
