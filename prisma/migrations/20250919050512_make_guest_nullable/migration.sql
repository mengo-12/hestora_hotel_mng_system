-- DropForeignKey
ALTER TABLE "public"."Folio" DROP CONSTRAINT "Folio_guestId_fkey";

-- AlterTable
ALTER TABLE "public"."Folio" ALTER COLUMN "guestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
