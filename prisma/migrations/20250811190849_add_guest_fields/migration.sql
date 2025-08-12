/*
  Warnings:

  - You are about to drop the column `fullName` on the `Guest` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Guest` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Guest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GuestType" AS ENUM ('REGULAR', 'VIP', 'CORPORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."IDType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Guest" DROP COLUMN "fullName",
DROP COLUMN "phone",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "familyName" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "public"."Gender",
ADD COLUMN     "guestType" "public"."GuestType",
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" "public"."IDType",
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phoneNumber" TEXT;
