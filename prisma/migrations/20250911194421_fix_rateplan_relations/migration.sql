-- AlterTable
ALTER TABLE "public"."RatePlan" ADD COLUMN     "mealPlan" TEXT,
ADD COLUMN     "parentRatePlanId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Standard';

-- CreateTable
CREATE TABLE "public"."RatePlanOccupancy" (
    "id" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "extraPrice" DECIMAL(65,30),

    CONSTRAINT "RatePlanOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RatePlanPolicy" (
    "id" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RatePlanPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RatePlanExtra" (
    "id" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "description" TEXT,

    CONSTRAINT "RatePlanExtra_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."RatePlan" ADD CONSTRAINT "RatePlan_parentRatePlanId_fkey" FOREIGN KEY ("parentRatePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RatePlanOccupancy" ADD CONSTRAINT "RatePlanOccupancy_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RatePlanPolicy" ADD CONSTRAINT "RatePlanPolicy_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RatePlanExtra" ADD CONSTRAINT "RatePlanExtra_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "public"."RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
