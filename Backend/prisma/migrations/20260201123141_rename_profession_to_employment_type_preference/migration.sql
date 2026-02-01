/*
  Warnings:

  - You are about to drop the column `profession_preference` on the `partner_preferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "partner_preferences" DROP COLUMN "profession_preference",
ADD COLUMN     "employment_type_preference" TEXT[] DEFAULT ARRAY[]::TEXT[];
