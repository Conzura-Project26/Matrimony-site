/*
  Warnings:

  - Added the required column `updated_at` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `user_reports` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "interests" DROP CONSTRAINT "interests_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "interests" DROP CONSTRAINT "interests_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "report_action_logs" DROP CONSTRAINT IF EXISTS "report_action_logs_acted_by_fkey";

-- DropForeignKey
ALTER TABLE "report_action_logs" DROP CONSTRAINT IF EXISTS "report_action_logs_user_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "idx_shortlisted_profiles_shortlisted_user";

-- DropIndex
DROP INDEX IF EXISTS "idx_shortlisted_profiles_user";

-- DropIndex
DROP INDEX IF EXISTS "idx_horoscope_nakshatra";

-- DropIndex
DROP INDEX IF EXISTS "idx_horoscope_rasi";

-- DropIndex
DROP INDEX IF EXISTS "idx_personal_details_height";

-- DropIndex
DROP INDEX IF EXISTS "idx_personal_details_mother_tongue";

-- DropIndex
DROP INDEX IF EXISTS "idx_users_last_active";

-- DropIndex
DROP INDEX IF EXISTS "idx_users_profile_id";

-- DropIndex
DROP INDEX IF EXISTS "idx_users_shortlist_count";

-- DropIndex
DROP INDEX IF EXISTS "idx_users_shortlisted_by_count";

-- DropIndex
DROP INDEX IF EXISTS "idx_users_views_count";

-- AlterTable
ALTER TABLE "search_logs" ALTER COLUMN "search_filters" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "auto_renew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" UUID,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "plan_id" UUID,
ADD COLUMN     "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "trial_end_date" DATE,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_reports" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "category" DROP DEFAULT;

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price_amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "billing_cycle" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    "duration_days" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "trial_period_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_plan_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deactivated_at" TIMESTAMP(3),
    "deactivated_by" UUID,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "value_type" VARCHAR(20) NOT NULL DEFAULT 'BOOLEAN',
    "reset_period" VARCHAR(20) NOT NULL DEFAULT 'NONE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" SERIAL NOT NULL,
    "plan_id" UUID NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "value_number" INTEGER,
    "value_string" VARCHAR(50),
    "value_boolean" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscription_plans_code_is_active_idx" ON "subscription_plans"("code", "is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscription_plans_priority_is_active_idx" ON "subscription_plans"("priority", "is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscription_plans_is_active_billing_cycle_idx" ON "subscription_plans"("is_active", "billing_cycle");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_code_version_key" ON "subscription_plans"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "features_code_key" ON "features"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "features_code_is_active_idx" ON "features"("code", "is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "plan_features_plan_id_feature_id_idx" ON "plan_features"("plan_id", "feature_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "plan_features_plan_id_feature_id_key" ON "plan_features"("plan_id", "feature_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_usage_user_id_feature_id_window_end_idx" ON "feature_usage"("user_id", "feature_id", "window_end");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_usage_window_end_idx" ON "feature_usage"("window_end");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "feature_usage_user_id_feature_id_window_start_key" ON "feature_usage"("user_id", "feature_id", "window_start");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "profile_views_search_log_id_idx" ON "profile_views"("search_log_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_status_idx" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_plan_id_status_idx" ON "subscriptions"("plan_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_end_date_idx" ON "subscriptions"("end_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_status_auto_renew_end_date_idx" ON "subscriptions"("status", "auto_renew", "end_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_users_last_active" ON "users"("last_active_at");

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_action_logs" ADD CONSTRAINT "report_action_logs_acted_by_fkey" FOREIGN KEY ("acted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_action_logs" ADD CONSTRAINT "report_action_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_parent_plan_id_fkey" FOREIGN KEY ("parent_plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex (with error handling)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_match_interactions_match_id') THEN
    ALTER INDEX "idx_match_interactions_match_id" RENAME TO "match_interactions_match_id_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_matches_expires_at') THEN
    ALTER INDEX "idx_matches_expires_at" RENAME TO "matches_expires_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_matches_generated_at') THEN
    ALTER INDEX "idx_matches_generated_at" RENAME TO "matches_generated_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_matches_user_match_type') THEN
    ALTER INDEX "idx_matches_user_match_type" RENAME TO "matches_user_id_match_type_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_source_viewed_at') THEN
    ALTER INDEX "idx_profile_views_source_viewed_at" RENAME TO "profile_views_view_source_viewed_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_viewed_user_viewed_at') THEN
    ALTER INDEX "idx_profile_views_viewed_user_viewed_at" RENAME TO "profile_views_viewed_user_id_viewed_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_viewer_viewed_at') THEN
    ALTER INDEX "idx_profile_views_viewer_viewed_at" RENAME TO "profile_views_viewer_id_viewed_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_views_viewer_viewed_user') THEN
    ALTER INDEX "idx_profile_views_viewer_viewed_user" RENAME TO "profile_views_viewer_id_viewed_user_id_viewed_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_search_logs_searched_at') THEN
    ALTER INDEX "idx_search_logs_searched_at" RENAME TO "search_logs_searched_at_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_search_logs_user_id') THEN
    ALTER INDEX "idx_search_logs_user_id" RENAME TO "search_logs_user_id_idx";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_feature_restrictions_user_id_feature_is_active_expires_at_') THEN
    ALTER INDEX "user_feature_restrictions_user_id_feature_is_active_expires_at_" RENAME TO "user_feature_restrictions_user_id_feature_is_active_expires_idx";
  END IF;
END
$$;
