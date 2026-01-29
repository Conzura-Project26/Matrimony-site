-- Manual Migration: Rename highest_qualification to qualification
-- Date: 2026-01-30
-- Task 2.3: Fix database design - qualification should be neutral term

-- Step 1: Add highest_qualification to users table (cached field)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS highest_qualification VARCHAR(150);

-- Step 2: Rename highest_qualification to qualification in user_education_details
ALTER TABLE user_education_details 
RENAME COLUMN highest_qualification TO qualification;

-- Step 3: Update existing data - populate users.highest_qualification from education data
-- This calculates the highest qualification for each user
UPDATE users u
SET highest_qualification = (
  SELECT e.qualification
  FROM user_education_details e
  WHERE e.user_id = u.id
  ORDER BY e.year_of_passing DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM user_education_details e2 
  WHERE e2.user_id = u.id
);

-- Verification queries (run these to confirm changes):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'highest_qualification';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_education_details' AND column_name = 'qualification';
