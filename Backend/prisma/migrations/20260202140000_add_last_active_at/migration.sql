-- AlterTable: Add last_active_at to users table
-- Task 3.1: Profile Listing - Track user last login activity
-- This field is updated on every successful login

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3);

-- Set default value to created_at for existing users
UPDATE "users" 
SET "last_active_at" = "created_at" 
WHERE "last_active_at" IS NULL;

-- Create index for sorting by last active
CREATE INDEX IF NOT EXISTS "idx_users_last_active" ON "users"("last_active_at" DESC);

-- Add comment for documentation
COMMENT ON COLUMN "users"."last_active_at" IS 'Timestamp of user last login activity, updated on each successful authentication';
