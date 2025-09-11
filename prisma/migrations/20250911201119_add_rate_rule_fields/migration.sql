/*
  Warnings:

  - You are about to drop the column `adults` on the `RatePlanOccupancy` table. All the data in the column will be lost.
  - You are about to drop the column `children` on the `RatePlanOccupancy` table. All the data in the column will be lost.
  - You are about to drop the column `extraPrice` on the `RatePlanOccupancy` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `RateRule` table. All the data in the column will be lost.
  - You are about to alter the column `priceOverride` on the `RateRule` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - Added the required column `occupancy` to the `RatePlanOccupancy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `RatePlanOccupancy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RatePlanOccupancy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."RatePlanOccupancy" DROP COLUMN "adults",
DROP COLUMN "children",
DROP COLUMN "extraPrice",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "occupancy" INTEGER NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."RateRule" DROP COLUMN "date",
ADD COLUMN     "blackout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "derivedFromRatePlanId" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxOccupancy" INTEGER,
ADD COLUMN     "mealPlan" TEXT,
ADD COLUMN     "minOccupancy" INTEGER,
ADD COLUMN     "policy" TEXT,
ADD COLUMN     "seasonName" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "priceOverride" SET DATA TYPE DOUBLE PRECISION;
