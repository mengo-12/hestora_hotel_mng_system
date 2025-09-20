-- AlterTable
ALTER TABLE "public"."Folio" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "roomBlockId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."GroupMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folio" ADD CONSTRAINT "Folio_roomBlockId_fkey" FOREIGN KEY ("roomBlockId") REFERENCES "public"."RoomBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
