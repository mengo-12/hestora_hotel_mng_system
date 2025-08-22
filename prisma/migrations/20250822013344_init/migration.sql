/*
  Warnings:

  - You are about to drop the column `balance` on the `Folio` table. All the data in the column will be lost.
  - You are about to drop the column `reservationId` on the `Folio` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Guest` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Guest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Guest` table. All the data in the column will be lost.
  - You are about to drop the column `done` on the `HousekeepingTask` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `HousekeepingTask` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `RatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `RatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Room` table. All the data in the column will be lost.
  - The `status` column on the `Room` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `baseRate` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `maxAdults` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `maxChildren` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `hashedPassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `FolioLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceCatalog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `Folio` will be added. If there are existing duplicate values, this will fail.
  - Made the column `actorId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `bookingId` to the `Folio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestId` to the `Folio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `HousekeepingTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `HousekeepingTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `RatePlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `RatePlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `RoomType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `RoomType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `propertyId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folio" DROP CONSTRAINT "Folio_reservationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FolioLine" DROP CONSTRAINT "FolioLine_folioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HousekeepingTask" DROP CONSTRAINT "HousekeepingTask_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_guestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_ratePlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_roomTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceCatalog" DROP CONSTRAINT "ServiceCatalog_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_propertyId_fkey";

-- DropIndex
DROP INDEX "public"."Folio_reservationId_key";

-- DropIndex
DROP INDEX "public"."Guest_email_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" ALTER COLUMN "actorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Folio" DROP COLUMN "balance",
DROP COLUMN "reservationId",
ADD COLUMN     "bookingId" TEXT NOT NULL,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Open';

-- AlterTable
ALTER TABLE "public"."Guest" DROP COLUMN "createdAt",
DROP COLUMN "notes",
DROP COLUMN "updatedAt",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "passportNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."HousekeepingTask" DROP COLUMN "done",
DROP COLUMN "note",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Open',
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "propertyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Property" ALTER COLUMN "timezone" DROP DEFAULT,
ALTER COLUMN "currency" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."RatePlan" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "price",
DROP COLUMN "updatedAt",
ADD COLUMN     "basePrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "notes" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'VACANT';

-- AlterTable
ALTER TABLE "public"."RoomType" DROP COLUMN "baseRate",
DROP COLUMN "createdAt",
DROP COLUMN "maxAdults",
DROP COLUMN "maxChildren",
DROP COLUMN "updatedAt",
ADD COLUMN     "amenities" TEXT,
ADD COLUMN     "basePrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "capacity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "hashedPassword",
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'FrontDesk',
ALTER COLUMN "propertyId" SET NOT NULL;

-- DropTable
DROP TABLE "public"."FolioLine";

-- DropTable
DROP TABLE "public"."Reservation";

-- DropTable
DROP TABLE "public"."ServiceCatalog";

-- DropEnum
DROP TYPE "public"."ChargeType";

-- DropEnum
DROP TYPE "public"."ReservationStatus";

-- DropEnum
DROP TYPE "public"."RoomStatus";

-- CreateTable
CREATE TABLE "public"."RoomStatusLog" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "roomId" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Booked',
    "ratePlanId" TEXT,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateRule" (
    "id" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "priceOverride" DECIMAL(65,30),
    "minLOS" INTEGER,
    "maxLOS" INTEGER,
    "closedToArrival" BOOLEAN NOT NULL DEFAULT false,
    "closedToDeparture" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "allotment" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "stopSell" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Charge" (
    "id" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30),
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedById" TEXT NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "ref" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedById" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creditLimit" DECIMAL(65,30),
    "rateAgreement" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "public"."Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Folio_bookingId_key" ON "public"."Folio"("bookingId");

-- AddForeignKey
ALTER TABLE "public"."RoomStatusLog" ADD CONSTRAINT "RoomStatusLog_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomStatusLog" ADD CONSTRAINT "RoomStatusLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateRule" ADD CONSTRAINT "RateRule_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Charge" ADD CONSTRAINT "Charge_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "public"."Folio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Charge" ADD CONSTRAINT "Charge_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "public"."Folio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Company" ADD CONSTRAINT "Company_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
