/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,roomTypeId,date]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId,roomId,date]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Inventory_propertyId_roomTypeId_roomId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_propertyId_roomTypeId_date_key" ON "public"."Inventory"("propertyId", "roomTypeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_propertyId_roomId_date_key" ON "public"."Inventory"("propertyId", "roomId", "date");
