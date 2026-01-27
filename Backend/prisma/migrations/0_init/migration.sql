-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" INTEGER NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "mobile_number" VARCHAR(15) NOT NULL,
    "email" VARCHAR(150),
    "password_hash" TEXT NOT NULL,
    "profile_created_by" VARCHAR(20) NOT NULL,
    "is_mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_profile_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID,
    "otp_code" VARCHAR(10),
    "purpose" VARCHAR(30),
    "expires_at" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "otp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "religions" (
    "id" SERIAL NOT NULL,
    "religion_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "religions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "castes" (
    "id" SERIAL NOT NULL,
    "religion_id" INTEGER NOT NULL,
    "caste_name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "castes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_castes" (
    "id" SERIAL NOT NULL,
    "caste_id" INTEGER NOT NULL,
    "sub_caste_name" VARCHAR(150),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sub_castes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_personal_details" (
    "user_id" UUID NOT NULL,
    "height_cm" INTEGER,
    "weight_kg" INTEGER,
    "marital_status" VARCHAR(30),
    "physical_status" VARCHAR(50),
    "mother_tongue" VARCHAR(50),

    CONSTRAINT "user_personal_details_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_caste_details" (
    "user_id" UUID NOT NULL,
    "religion_id" INTEGER,
    "caste_id" INTEGER,
    "sub_caste_id" INTEGER,
    "community_details" TEXT,

    CONSTRAINT "user_caste_details_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_education_details" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "highest_qualification" VARCHAR(150),
    "institution_name" VARCHAR(200),
    "year_of_passing" INTEGER,

    CONSTRAINT "user_education_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_professional_details" (
    "user_id" UUID NOT NULL,
    "occupation" VARCHAR(150),
    "employment_type" VARCHAR(100),
    "company_name" VARCHAR(200),
    "annual_income_range" VARCHAR(50),
    "work_location" VARCHAR(150),

    CONSTRAINT "user_professional_details_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_family_details" (
    "user_id" UUID NOT NULL,
    "father_occupation" VARCHAR(150),
    "mother_occupation" VARCHAR(150),
    "siblings_details" TEXT,
    "family_values" VARCHAR(100),

    CONSTRAINT "user_family_details_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_horoscope_details" (
    "user_id" UUID NOT NULL,
    "rasi" VARCHAR(50),
    "nakshatra" VARCHAR(50),
    "time_of_birth" TIME,
    "place_of_birth" VARCHAR(150),

    CONSTRAINT "user_horoscope_details_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_photos" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "visibility" VARCHAR(20) DEFAULT 'PUBLIC',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" UUID,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_preferences" (
    "user_id" UUID NOT NULL,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "min_height" INTEGER,
    "max_height" INTEGER,
    "religion_preference" TEXT,
    "caste_preference" TEXT,
    "education_preference" TEXT,
    "profession_preference" TEXT,
    "location_preference" TEXT,

    CONSTRAINT "partner_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "shortlisted_profiles" (
    "user_id" UUID NOT NULL,
    "shortlisted_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlisted_profiles_pkey" PRIMARY KEY ("user_id","shortlisted_user_id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID,
    "search_filters" JSONB,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" SERIAL NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" SERIAL NOT NULL,
    "reported_by" UUID NOT NULL,
    "reported_user" UUID NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" UUID,
    "action" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_name" VARCHAR(50),
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_name_key" ON "permissions"("permission_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_number_key" ON "users"("mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "religions_religion_name_key" ON "religions"("religion_name");

-- CreateIndex
CREATE UNIQUE INDEX "castes_religion_id_caste_name_key" ON "castes"("religion_id", "caste_name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_castes_caste_id_sub_caste_name_key" ON "sub_castes"("caste_id", "sub_caste_name");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_logs" ADD CONSTRAINT "otp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "castes" ADD CONSTRAINT "castes_religion_id_fkey" FOREIGN KEY ("religion_id") REFERENCES "religions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_castes" ADD CONSTRAINT "sub_castes_caste_id_fkey" FOREIGN KEY ("caste_id") REFERENCES "castes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_personal_details" ADD CONSTRAINT "user_personal_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_caste_details" ADD CONSTRAINT "user_caste_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_caste_details" ADD CONSTRAINT "user_caste_details_religion_id_fkey" FOREIGN KEY ("religion_id") REFERENCES "religions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_caste_details" ADD CONSTRAINT "user_caste_details_caste_id_fkey" FOREIGN KEY ("caste_id") REFERENCES "castes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_caste_details" ADD CONSTRAINT "user_caste_details_sub_caste_id_fkey" FOREIGN KEY ("sub_caste_id") REFERENCES "sub_castes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_education_details" ADD CONSTRAINT "user_education_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_professional_details" ADD CONSTRAINT "user_professional_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_details" ADD CONSTRAINT "user_family_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_horoscope_details" ADD CONSTRAINT "user_horoscope_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photos" ADD CONSTRAINT "user_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photos" ADD CONSTRAINT "user_photos_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlisted_profiles" ADD CONSTRAINT "shortlisted_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlisted_profiles" ADD CONSTRAINT "shortlisted_profiles_shortlisted_user_id_fkey" FOREIGN KEY ("shortlisted_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_fkey" FOREIGN KEY ("reported_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

