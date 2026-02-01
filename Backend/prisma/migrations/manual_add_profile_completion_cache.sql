-- Manual migration: Add profile_completion_percentage to users table
-- Date: 2026-02-01
-- Purpose: Cache profile completion percentage to avoid recalculation on every dashboard load

-- Add profile_completion_percentage column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN users.profile_completion_percentage IS 'Cached profile completion percentage (0-100). Updated automatically when profile data changes.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_profile_completion 
ON users(profile_completion_percentage);
