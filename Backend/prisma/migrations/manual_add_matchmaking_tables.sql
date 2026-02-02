-- Task 3.4: Matchmaking Algorithm - Database Migration
-- Creates matches and match_interactions tables with indexes
-- Date: February 2, 2026

-- ============================================
-- 1. Create MatchType Enum
-- ============================================

CREATE TYPE "MatchType" AS ENUM ('DAILY_MATCH', 'RECOMMENDATION', 'NEW_MATCH');

-- ============================================
-- 2. Create Matches Table
-- ============================================

CREATE TABLE IF NOT EXISTS "matches" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "matched_user_id" UUID NOT NULL,
  "match_score" DOUBLE PRECISION NOT NULL,
  "match_type" "MatchType" NOT NULL,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  
  CONSTRAINT "matches_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "matches_matched_user_id_fkey" 
    FOREIGN KEY ("matched_user_id") 
    REFERENCES "users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "matches_user_id_matched_user_id_match_type_key" 
    UNIQUE ("user_id", "matched_user_id", "match_type")
);

-- ============================================
-- 3. Create Match Interactions Table
-- ============================================

CREATE TABLE IF NOT EXISTS "match_interactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "match_id" UUID NOT NULL,
  "is_viewed" BOOLEAN NOT NULL DEFAULT false,
  "viewed_at" TIMESTAMP(3),
  "action" VARCHAR(20),
  "acted_at" TIMESTAMP(3),
  
  CONSTRAINT "match_interactions_match_id_fkey" 
    FOREIGN KEY ("match_id") 
    REFERENCES "matches"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- ============================================
-- 4. Create Indexes for Performance
-- ============================================

-- Matches table indexes
CREATE INDEX IF NOT EXISTS "idx_matches_user_match_type" 
  ON "matches"("user_id", "match_type");

CREATE INDEX IF NOT EXISTS "idx_matches_generated_at" 
  ON "matches"("generated_at");

CREATE INDEX IF NOT EXISTS "idx_matches_expires_at" 
  ON "matches"("expires_at");

CREATE INDEX IF NOT EXISTS "idx_matches_score" 
  ON "matches"("match_score");

-- Match interactions table indexes
CREATE INDEX IF NOT EXISTS "idx_match_interactions_match_id" 
  ON "match_interactions"("match_id");

CREATE INDEX IF NOT EXISTS "idx_match_interactions_action" 
  ON "match_interactions"("action");

-- Users table - Add matchmaking composite index
CREATE INDEX IF NOT EXISTS "idx_users_matchmaking" 
  ON "users"("gender", "is_active", "is_profile_verified");

-- Comments for documentation
COMMENT ON TABLE "matches" IS 'Generated matchmaking recommendations for users';
COMMENT ON TABLE "match_interactions" IS 'User interactions with matches (views, skips, interests)';
COMMENT ON COLUMN "matches"."match_type" IS 'Type of match: DAILY_MATCH, RECOMMENDATION, or NEW_MATCH';
COMMENT ON COLUMN "matches"."match_score" IS 'Bidirectional compatibility score (0-100)';
COMMENT ON COLUMN "matches"."expires_at" IS 'Expiry time for daily matches (null for others)';
COMMENT ON COLUMN "match_interactions"."action" IS 'User action: VIEWED, SKIPPED, or INTERESTED';

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Task 3.4 Matchmaking tables and indexes created successfully';
END $$;
