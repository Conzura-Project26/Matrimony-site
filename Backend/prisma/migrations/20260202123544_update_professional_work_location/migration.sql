-- AlterTable: Update UserProfessionalDetails
-- Remove work_location field and add work_location_type, work_state, work_city fields
-- This migration splits the single work_location field into structured fields with validation

-- Drop the old work_location column
ALTER TABLE "user_professional_details" DROP COLUMN IF EXISTS "work_location";

-- Add new work location fields
ALTER TABLE "user_professional_details" 
  ADD COLUMN "work_location_type" VARCHAR(50),
  ADD COLUMN "work_state" VARCHAR(100),
  ADD COLUMN "work_city" VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN "user_professional_details"."work_location_type" IS 'Type of work location: On-Site, Remote, Hybrid, Multiple Locations, Overseas';
COMMENT ON COLUMN "user_professional_details"."work_state" IS 'Work state - validated against master data';
COMMENT ON COLUMN "user_professional_details"."work_city" IS 'Work city - validated against master data for the corresponding state';
