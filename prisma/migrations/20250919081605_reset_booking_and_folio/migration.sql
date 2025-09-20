/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `Folio` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Folio_bookingId_key" ON "public"."Folio"("bookingId");
