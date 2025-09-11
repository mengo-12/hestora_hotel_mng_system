/*
  Warnings:

  - Made the column `updatedAt` on table `RateRule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."RateRule" ALTER COLUMN "updatedAt" SET NOT NULL;
