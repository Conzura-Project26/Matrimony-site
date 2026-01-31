/*
  Warnings:

  - The `religion_preference` column on the `partner_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `caste_preference` column on the `partner_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `education_preference` column on the `partner_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `profession_preference` column on the `partner_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `location_preference` column on the `partner_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "partner_preferences" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diet_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "drinking_habit_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "income_preference_max" TEXT,
ADD COLUMN     "income_preference_min" TEXT,
ADD COLUMN     "marital_status_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mother_tongue_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "smoking_habit_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "religion_preference",
ADD COLUMN     "religion_preference" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
DROP COLUMN "caste_preference",
ADD COLUMN     "caste_preference" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
DROP COLUMN "education_preference",
ADD COLUMN     "education_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "profession_preference",
ADD COLUMN     "profession_preference" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "location_preference",
ADD COLUMN     "location_preference" TEXT[] DEFAULT ARRAY[]::TEXT[];
