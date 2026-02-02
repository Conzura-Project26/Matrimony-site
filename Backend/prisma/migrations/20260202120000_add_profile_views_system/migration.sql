-- Task 3.5: Profile Views & Activity System
-- Creates profile_views table with analytics tracking
-- Date: February 2, 2026

-- ============================================
-- 1. Create ViewSource Enum
-- ============================================

CREATE TYPE "ViewSource" AS ENUM ('SEARCH', 'MATCH', 'RECOMMENDATION', 'DIRECT', 'SHORTLIST', 'INTEREST');

-- ============================================
-- 2. Create Profile Views Table
-- ============================================

CREATE TABLE IF NOT EXISTS "profile_views" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "viewer_id" UUID NOT NULL,
  "viewed_user_id" UUID NOT NULL,
  "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "view_source" "ViewSource" NOT NULL DEFAULT 'DIRECT',
  "view_duration_seconds" INTEGER,
  "search_log_id" INTEGER,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  
  CONSTRAINT "profile_views_viewer_id_fkey" 
    FOREIGN KEY ("viewer_id") 
    REFERENCES "users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "profile_views_viewed_user_id_fkey" 
    FOREIGN KEY ("viewed_user_id") 
    REFERENCES "users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "profile_views_search_log_id_fkey" 
    FOREIGN KEY ("search_log_id") 
    REFERENCES "search_logs"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
    
  -- Prevent self-views at database level
  CONSTRAINT "profile_views_no_self_view" 
    CHECK ("viewer_id" != "viewed_user_id")
);

-- ============================================
-- 3. Create Indexes for Performance
-- ============================================

-- For "Who viewed my profile" queries (most common)
CREATE INDEX IF NOT EXISTS "idx_profile_views_viewed_user_viewed_at" 
  ON "profile_views"("viewed_user_id", "viewed_at" DESC);

-- For "Profiles I viewed" queries
CREATE INDEX IF NOT EXISTS "idx_profile_views_viewer_viewed_at" 
  ON "profile_views"("viewer_id", "viewed_at" DESC);

-- For deduplication and rate limiting checks
CREATE INDEX IF NOT EXISTS "idx_profile_views_viewer_viewed_user" 
  ON "profile_views"("viewer_id", "viewed_user_id", "viewed_at" DESC);

-- For analytics by source
CREATE INDEX IF NOT EXISTS "idx_profile_views_source_viewed_at" 
  ON "profile_views"("view_source", "viewed_at" DESC);

-- For search log linkage
CREATE INDEX IF NOT EXISTS "idx_profile_views_search_log_id" 
  ON "profile_views"("search_log_id") WHERE "search_log_id" IS NOT NULL;

-- ============================================
-- 4. Add Viewer Count Cache to Users Table
-- ============================================

ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "profile_views_count" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_users_views_count" 
  ON "users"("profile_views_count" DESC);

-- ============================================
-- 5. Comments for Documentation
-- ============================================

COMMENT ON TABLE "profile_views" IS 'Tracks all profile view events for analytics and "who viewed me" feature';
COMMENT ON COLUMN "profile_views"."view_source" IS 'Source of view: SEARCH, MATCH, RECOMMENDATION, DIRECT, SHORTLIST, INTEREST';
COMMENT ON COLUMN "profile_views"."view_duration_seconds" IS 'Time spent viewing profile (capped at 600 seconds for analytics)';
COMMENT ON COLUMN "profile_views"."search_log_id" IS 'Optional link to search that led to this view';
COMMENT ON COLUMN "profile_views"."ip_address" IS 'IP address for analytics and security';
COMMENT ON COLUMN "profile_views"."user_agent" IS 'Device/browser info for analytics';
COMMENT ON COLUMN "users"."profile_views_count" IS 'Cached count of total profile views (updated periodically)';

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Task 3.5 Profile Views system created successfully';
  RAISE NOTICE '   - profile_views table created';
  RAISE NOTICE '   - 5 indexes created for performance';
  RAISE NOTICE '   - ViewSource enum created';
  RAISE NOTICE '   - Viewer count cache added to users';
  RAISE NOTICE '   - Self-view constraint enforced';
END $$;
