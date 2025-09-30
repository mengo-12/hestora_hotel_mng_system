/*
  Warnings:

  - You are about to drop the column `discountPct` on the `POSSale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."POSSale" DROP COLUMN "discountPct",
ADD COLUMN     "discount" DECIMAL(65,30),
ADD COLUMN     "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0;
