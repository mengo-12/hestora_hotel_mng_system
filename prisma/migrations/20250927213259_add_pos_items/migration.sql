-- CreateTable
CREATE TABLE "public"."POSItem" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."POSItem" ADD CONSTRAINT "POSItem_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "public"."POSOutlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
