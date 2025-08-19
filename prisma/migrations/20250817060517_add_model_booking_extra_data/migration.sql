-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "extrasData" JSONB,
ADD COLUMN     "guestsCount" INTEGER,
ADD COLUMN     "pricePerNight" DOUBLE PRECISION,
ADD COLUMN     "roomTypeId" TEXT,
ADD COLUMN     "totalNights" INTEGER;
