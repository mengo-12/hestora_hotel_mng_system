-- DropForeignKey
ALTER TABLE "public"."Folio" DROP CONSTRAINT "Folio_bookingId_fkey";

-- DropIndex
DROP INDEX "public"."Folio_bookingId_key";
