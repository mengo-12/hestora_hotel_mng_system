/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,roomTypeId,roomId,date]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Inventory_propertyId_roomId_date_key";

-- DropIndex
DROP INDEX "public"."Inventory_propertyId_roomTypeId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_propertyId_roomTypeId_roomId_date_key" ON "public"."Inventory"("propertyId", "roomTypeId", "roomId", "date");
