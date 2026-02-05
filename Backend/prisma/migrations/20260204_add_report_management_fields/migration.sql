-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ACTION_TAKEN', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('FAKE_PROFILE', 'HARASSMENT', 'INAPPROPRIATE_PHOTO', 'INAPPROPRIATE_CONTENT', 'SPAM', 'SCAM', 'UNDERAGE', 'MARRIED', 'DUPLICATE_PROFILE', 'OFFENSIVE_BEHAVIOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportAction" AS ENUM ('NO_ACTION', 'WARN_USER', 'SUSPEND_USER', 'DEACTIVATE_USER', 'DELETE_CONTENT', 'RESTRICT_FEATURES', 'FLAG_USER');

-- AlterTable user_reports
ALTER TABLE "user_reports" 
  ADD COLUMN "category" "ReportCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "severity" "ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "action_taken" "ReportAction",
  ADD COLUMN "admin_notes" TEXT,
  ADD COLUMN "resolved_by" INTEGER,
  ADD COLUMN "resolved_at" TIMESTAMP(3),
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "status" SET DEFAULT 'OPEN',
  ALTER COLUMN "status" TYPE "ReportStatus" USING "status"::text::"ReportStatus";

-- CreateTable
CREATE TABLE "report_action_logs" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" "ReportAction" NOT NULL,
    "metadata" JSONB,
    "acted_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_reports_status_severity_created_at_idx" ON "user_reports"("status", "severity", "created_at");

-- CreateIndex
CREATE INDEX "user_reports_reported_user_status_idx" ON "user_reports"("reported_user", "status");

-- CreateIndex
CREATE INDEX "user_reports_reported_by_idx" ON "user_reports"("reported_by");

-- CreateIndex
CREATE INDEX "user_reports_created_at_idx" ON "user_reports"("created_at");

-- CreateIndex
CREATE INDEX "report_action_logs_report_id_created_at_idx" ON "report_action_logs"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "report_action_logs_user_id_idx" ON "report_action_logs"("user_id");

-- CreateIndex
CREATE INDEX "report_action_logs_acted_by_idx" ON "report_action_logs"("acted_by");

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_action_logs" ADD CONSTRAINT "report_action_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "user_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_action_logs" ADD CONSTRAINT "report_action_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_action_logs" ADD CONSTRAINT "report_action_logs_acted_by_fkey" FOREIGN KEY ("acted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
