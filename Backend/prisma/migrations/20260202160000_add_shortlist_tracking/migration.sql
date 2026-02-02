-- Migration: Add Shortlist Tracking Fields
-- Task 3.6: Shortlist Management
-- Date: 2026-02-02

-- Add shortlist tracking columns to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "shortlist_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "shortlisted_by_count" INTEGER DEFAULT 0;

-- Update existing users to have 0 counts
UPDATE "users" 
SET "shortlist_count" = 0, "shortlisted_by_count" = 0
WHERE "shortlist_count" IS NULL OR "shortlisted_by_count" IS NULL;

-- Add indexes for better query performance on shortlist counts
CREATE INDEX IF NOT EXISTS "idx_users_shortlist_count" ON "users"("shortlist_count");
CREATE INDEX IF NOT EXISTS "idx_users_shortlisted_by_count" ON "users"("shortlisted_by_count");

-- Add index on shortlisted_profiles for faster lookups
CREATE INDEX IF NOT EXISTS "idx_shortlisted_profiles_user" ON "shortlisted_profiles"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_shortlisted_profiles_shortlisted_user" ON "shortlisted_profiles"("shortlisted_user_id", "created_at" DESC);

-- Comments for documentation
COMMENT ON COLUMN "users"."shortlist_count" IS 'Number of profiles this user has shortlisted';
COMMENT ON COLUMN "users"."shortlisted_by_count" IS 'Number of users who have shortlisted this profile';
