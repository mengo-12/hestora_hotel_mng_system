/*
  Warnings:

  - The `status` column on the `Room` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `oldStatus` on the `RoomStatusLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `newStatus` on the `RoomStatusLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- تحديث RoomStatusLog
UPDATE "RoomStatusLog" SET "oldStatus" =
  CASE
    WHEN "oldStatus" IN ('VacantClean', 'Reserved', 'Inspected', 'ExpectedArrival') THEN 'VACANT'
    WHEN "oldStatus" IN ('OccupiedDirty', 'OccupiedClean', 'DoNotDisturb') THEN 'OCCUPIED'
    WHEN "oldStatus" = 'VacantDirty' THEN 'CLEANING'
    WHEN "oldStatus" IN ('OutOfOrder', 'OutOfService', 'Maintenance') THEN 'MAINTENANCE'
    ELSE 'VACANT'
  END;

UPDATE "RoomStatusLog" SET "newStatus" =
  CASE
    WHEN "newStatus" IN ('VacantClean', 'Reserved', 'Inspected', 'ExpectedArrival') THEN 'VACANT'
    WHEN "newStatus" IN ('OccupiedDirty', 'OccupiedClean', 'DoNotDisturb') THEN 'OCCUPIED'
    WHEN "newStatus" = 'VacantDirty' THEN 'CLEANING'
    WHEN "newStatus" IN ('OutOfOrder', 'OutOfService', 'Maintenance') THEN 'MAINTENANCE'
    ELSE 'VACANT'
  END;

-- تحديث Room
UPDATE "Room" SET "status" =
  CASE
    WHEN "status" IN ('VacantClean', 'Reserved', 'Inspected', 'ExpectedArrival') THEN 'VACANT'
    WHEN "status" IN ('OccupiedDirty', 'OccupiedClean', 'DoNotDisturb') THEN 'OCCUPIED'
    WHEN "status" = 'VacantDirty' THEN 'CLEANING'
    WHEN "status" IN ('OutOfOrder', 'OutOfService', 'Maintenance') THEN 'MAINTENANCE'
    ELSE 'VACANT'
  END;
