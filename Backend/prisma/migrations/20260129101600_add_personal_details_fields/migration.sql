-- AlterTable
ALTER TABLE "user_personal_details" ADD COLUMN     "about_me" TEXT,
ADD COLUMN     "blood_group" VARCHAR(10),
ADD COLUMN     "body_type" VARCHAR(30),
ADD COLUMN     "complexion" VARCHAR(30),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diet_preference" VARCHAR(30),
ADD COLUMN     "drinking_habit" VARCHAR(30),
ADD COLUMN     "smoking_habit" VARCHAR(30),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
