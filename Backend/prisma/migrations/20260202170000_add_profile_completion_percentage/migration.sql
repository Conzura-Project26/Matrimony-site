-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_completion_percentage" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_users_profile_completion" ON "users"("profile_completion_percentage");
