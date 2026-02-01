/*
  Warnings:

  - You are about to drop the column `location_preference` on the `partner_preferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "partner_preferences" DROP COLUMN "location_preference",
ADD COLUMN     "preferred_location" JSONB;
