-- CreateTable
CREATE TABLE "public"."NightAudit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "closedDate" TEXT NOT NULL,
    "closedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NightAudit_pkey" PRIMARY KEY ("id")
);
