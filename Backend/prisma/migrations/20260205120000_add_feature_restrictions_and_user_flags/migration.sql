-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_flagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "moderation_flags" JSONB;

-- CreateEnum
CREATE TYPE "RestrictedFeature" AS ENUM ('CHAT', 'INTEREST', 'UPLOAD', 'SEARCH');

-- CreateTable
CREATE TABLE "user_feature_restrictions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "feature" "RestrictedFeature" NOT NULL,
    "restricted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "reason" TEXT,
    "restricted_by" UUID NOT NULL,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3),
    "report_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_feature_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_feature_restrictions_user_id_feature_is_active_expires_at_idx" ON "user_feature_restrictions"("user_id", "feature", "is_active", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_feature_restrictions_user_id_feature_is_active_key" ON "user_feature_restrictions"("user_id", "feature", "is_active");

-- AddForeignKey
ALTER TABLE "user_feature_restrictions" ADD CONSTRAINT "user_feature_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
