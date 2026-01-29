-- AlterTable
ALTER TABLE "user_photos" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "user_photos_user_id_is_primary_idx" ON "user_photos"("user_id", "is_primary");
