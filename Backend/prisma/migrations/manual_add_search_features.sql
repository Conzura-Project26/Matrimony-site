-- Manual Migration: Add Search Features
-- Task 3.3: Advanced Search Implementation
-- Date: 2026-02-02

-- Add profile_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_id VARCHAR(20) UNIQUE;

-- Add new columns to search_logs table
ALTER TABLE search_logs 
ALTER COLUMN search_filters SET NOT NULL,
ALTER COLUMN search_filters SET DEFAULT '{}'::jsonb;

ALTER TABLE search_logs 
ADD COLUMN IF NOT EXISTS result_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users(profile_id);

-- Create index for height filtering
CREATE INDEX IF NOT EXISTS idx_personal_details_height ON user_personal_details(height_cm);

-- Create index for mother tongue filtering
CREATE INDEX IF NOT EXISTS idx_personal_details_mother_tongue ON user_personal_details(mother_tongue);

-- Create indexes for horoscope filtering
CREATE INDEX IF NOT EXISTS idx_horoscope_rasi ON user_horoscope_details(rasi);
CREATE INDEX IF NOT EXISTS idx_horoscope_nakshatra ON user_horoscope_details(nakshatra);

-- Add comment for profile_id
COMMENT ON COLUMN users.profile_id IS 'Human-readable unique profile ID (e.g., MAT00001234)';
