-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID';

-- CreateTable
CREATE TABLE "public"."ExtraService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ExtraService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingExtra" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "extraServiceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BookingExtra_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BookingExtra" ADD CONSTRAINT "BookingExtra_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingExtra" ADD CONSTRAINT "BookingExtra_extraServiceId_fkey" FOREIGN KEY ("extraServiceId") REFERENCES "public"."ExtraService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
