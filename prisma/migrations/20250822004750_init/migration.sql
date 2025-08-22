-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RoomStatus" AS ENUM ('CLEAN', 'DIRTY', 'OUT_OF_ORDER', 'OCCUPIED', 'VACANT');

-- CreateEnum
CREATE TYPE "public"."ChargeType" AS ENUM ('ROOM', 'SERVICE', 'TAX', 'ADJUSTMENT', 'PAYMENT');

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Guest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nationality" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoomType" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxAdults" INTEGER NOT NULL DEFAULT 2,
    "maxChildren" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "status" "public"."RoomStatus" NOT NULL DEFAULT 'CLEAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RatePlan" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "roomId" TEXT,
    "ratePlanId" TEXT,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'TENTATIVE',
    "guaranteed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Folio" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FolioLine" (
    "id" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."ChargeType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolioLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceCatalog" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HousekeepingTask" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "note" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousekeepingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "public"."Property"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_email_key" ON "public"."Guest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_propertyId_code_key" ON "public"."RoomType"("propertyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_propertyId_number_key" ON "public"."Room"("propertyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "RatePlan_propertyId_code_key" ON "public"."RatePlan"("propertyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "public"."Reservation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Folio_reservationId_key" ON "public"."Folio"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCatalog_propertyId_code_key" ON "public"."ServiceCatalog"("propertyId", "code");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomType" ADD CONSTRAINT "RoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RatePlan" ADD CONSTRAINT "RatePlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RatePlan" ADD CONSTRAINT "RatePlan_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolioLine" ADD CONSTRAINT "FolioLine_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "public"."Folio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceCatalog" ADD CONSTRAINT "ServiceCatalog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
