/*
  Warnings:

  - You are about to drop the column `guestId` on the `LoyaltyProgram` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `LoyaltyProgram` table. All the data in the column will be lost.
  - You are about to drop the column `programName` on the `LoyaltyProgram` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `LoyaltyProgram` table. All the data in the column will be lost.
  - Added the required column `minPoints` to the `LoyaltyProgram` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `LoyaltyProgram` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."LoyaltyProgram" DROP CONSTRAINT "LoyaltyProgram_guestId_fkey";

-- AlterTable
ALTER TABLE "public"."LoyaltyMember" ADD COLUMN     "loyaltyProgramId" TEXT;

-- AlterTable
ALTER TABLE "public"."LoyaltyProgram" DROP COLUMN "guestId",
DROP COLUMN "points",
DROP COLUMN "programName",
DROP COLUMN "tier",
ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "maxPoints" INTEGER,
ADD COLUMN     "minPoints" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."LoyaltyMember" ADD CONSTRAINT "LoyaltyMember_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "public"."LoyaltyProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
