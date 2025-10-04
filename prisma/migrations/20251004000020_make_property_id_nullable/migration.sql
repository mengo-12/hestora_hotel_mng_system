-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_propertyId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "propertyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
