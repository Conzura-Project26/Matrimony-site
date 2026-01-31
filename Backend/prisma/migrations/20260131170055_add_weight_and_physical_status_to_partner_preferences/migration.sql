-- AlterTable
ALTER TABLE "partner_preferences" ADD COLUMN     "max_weight" INTEGER,
ADD COLUMN     "min_weight" INTEGER,
ADD COLUMN     "physical_status" TEXT[] DEFAULT ARRAY[]::TEXT[];
