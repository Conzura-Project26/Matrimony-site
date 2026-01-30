/*
  Warnings:

  - You are about to drop the column `highest_qualification` on the `user_education_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_education_details" DROP COLUMN "highest_qualification",
ADD COLUMN     "qualification" VARCHAR(150);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "highest_qualification" VARCHAR(150);
