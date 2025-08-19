/*
  Warnings:

  - Made the column `changedBy` on table `RoomStatusLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."RoomStatusLog" ALTER COLUMN "changedBy" SET NOT NULL;
