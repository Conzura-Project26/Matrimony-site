-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('DAILY_MATCH', 'RECOMMENDATION', 'NEW_MATCH');

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "matched_user_id" UUID NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "match_type" "MatchType" NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "viewed_at" TIMESTAMP(3),
    "action" VARCHAR(20),
    "acted_at" TIMESTAMP(3),

    CONSTRAINT "match_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_matches_user_match_type" ON "matches"("user_id", "match_type");

-- CreateIndex
CREATE INDEX "idx_matches_generated_at" ON "matches"("generated_at");

-- CreateIndex
CREATE INDEX "idx_matches_expires_at" ON "matches"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_id_matched_user_id_match_type_key" ON "matches"("user_id", "matched_user_id", "match_type");

-- CreateIndex
CREATE INDEX "idx_match_interactions_match_id" ON "match_interactions"("match_id");

-- CreateIndex
CREATE INDEX "idx_users_matchmaking" ON "users"("gender", "is_active", "is_profile_verified");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_matched_user_id_fkey" FOREIGN KEY ("matched_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_interactions" ADD CONSTRAINT "match_interactions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
