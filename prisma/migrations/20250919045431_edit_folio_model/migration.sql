-- DropForeignKey
ALTER TABLE "public"."Folio" DROP CONSTRAINT "Folio_bookingId_fkey";

-- AlterTable
ALTER TABLE "public"."Folio" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
