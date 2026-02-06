-- AlterTable: Add new columns to audit_logs table
ALTER TABLE "audit_logs" ADD COLUMN "target_user_id" UUID,
ADD COLUMN "action_type" VARCHAR(50) NOT NULL DEFAULT 'USER_ACTION',
ADD COLUMN "resource_type" VARCHAR(50),
ADD COLUMN "resource_id" VARCHAR(100),
ADD COLUMN "metadata" JSONB,
ADD COLUMN "user_agent" VARCHAR(500),
ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS';

-- Update existing action column to be NOT NULL with larger size
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE VARCHAR(255);

-- CreateIndex: Performance indexes for audit_logs
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
CREATE INDEX "audit_logs_target_user_id_created_at_idx" ON "audit_logs"("target_user_id", "created_at");
CREATE INDEX "audit_logs_action_type_created_at_idx" ON "audit_logs"("action_type", "created_at");
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Update existing records to have default action_type (if any exist)
UPDATE "audit_logs" SET "action_type" = 'ADMIN_ACTION' WHERE "action_type" IS NULL;
UPDATE "audit_logs" SET "status" = 'SUCCESS' WHERE "status" IS NULL;

-- Comment on table
COMMENT ON TABLE "audit_logs" IS 'Enhanced audit logging system - Phase 5 Task 5.6';
COMMENT ON COLUMN "audit_logs"."action_type" IS 'ADMIN_ACTION, USER_ACTION, SYSTEM_ACTION, AUTH_EVENT';
COMMENT ON COLUMN "audit_logs"."target_user_id" IS 'User affected by the action';
COMMENT ON COLUMN "audit_logs"."metadata" IS 'Additional context (PII-masked)';
COMMENT ON COLUMN "audit_logs"."status" IS 'SUCCESS, FAILURE, PARTIAL';
