/*
  Warnings:

  - The values [CHECKED_IN,CHECKED_OUT] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `createdById` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPING');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "public"."Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Booking" ALTER COLUMN "status" TYPE "public"."BookingStatus_new" USING ("status"::text::"public"."BookingStatus_new");
ALTER TYPE "public"."BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "public"."BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
COMMIT;

-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PARTIAL';

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropIndex
DROP INDEX "public"."Invoice_bookingId_key";

-- DropIndex
DROP INDEX "public"."Room_roomNumber_key";

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "paymentStatus" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Room" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL;

-- DropTable
DROP TABLE "public"."Payment";

-- DropEnum
DROP TYPE "public"."PaymentMethod";

-- DropEnum
DROP TYPE "public"."PaymentStatusGeneric";

-- DropEnum
DROP TYPE "public"."Role";

-- DropEnum
DROP TYPE "public"."RoomStatus";

-- CreateTable
CREATE TABLE "public"."BookingService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
