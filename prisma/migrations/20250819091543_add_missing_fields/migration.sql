-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraServices" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "taxPercent" INTEGER NOT NULL DEFAULT 15;
