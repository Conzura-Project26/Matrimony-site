-- DropForeignKey
ALTER TABLE "partner_preferences" DROP CONSTRAINT "partner_preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_caste_details" DROP CONSTRAINT "user_caste_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_education_details" DROP CONSTRAINT "user_education_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_family_details" DROP CONSTRAINT "user_family_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_horoscope_details" DROP CONSTRAINT "user_horoscope_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_personal_details" DROP CONSTRAINT "user_personal_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_photos" DROP CONSTRAINT "user_photos_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_professional_details" DROP CONSTRAINT "user_professional_details_user_id_fkey";

-- AddForeignKey
ALTER TABLE "user_personal_details" ADD CONSTRAINT "user_personal_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_caste_details" ADD CONSTRAINT "user_caste_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_education_details" ADD CONSTRAINT "user_education_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_professional_details" ADD CONSTRAINT "user_professional_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_details" ADD CONSTRAINT "user_family_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_horoscope_details" ADD CONSTRAINT "user_horoscope_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photos" ADD CONSTRAINT "user_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
