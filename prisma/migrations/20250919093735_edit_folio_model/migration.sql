/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `Folio` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Folio_bookingId_key" ON "public"."Folio"("bookingId");

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
