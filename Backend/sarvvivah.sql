SET timezone = 'Asia/Kolkata';

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO roles (role_name, description) VALUES
('ADMIN','Full system access'),
('MODERATOR','Verification & moderation'),
('USER','Platform user');


CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id),
    permission_id INT REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INT REFERENCES roles(id),
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
    date_of_birth DATE NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    profile_created_by VARCHAR(20)
        CHECK (profile_created_by IN ('Self','Parent','Guardian')),
    is_mobile_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_profile_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    otp_code VARCHAR(10),
    purpose VARCHAR(30),
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);


CREATE TABLE religions (
    id SERIAL PRIMARY KEY,
    religion_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);


CREATE TABLE castes (
    id SERIAL PRIMARY KEY,
    religion_id INT REFERENCES religions(id),
    caste_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);


CREATE TABLE sub_castes (
    id SERIAL PRIMARY KEY,
    caste_id INT REFERENCES castes(id),
    sub_caste_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_personal_details (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    height_cm INT,
    weight_kg INT,
    marital_status VARCHAR(30),
    physical_status VARCHAR(50),
    mother_tongue VARCHAR(50)
);


CREATE TABLE user_caste_details (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    religion_id INT REFERENCES religions(id),
    caste_id INT REFERENCES castes(id),
    sub_caste_id INT REFERENCES sub_castes(id),
    community_details TEXT
);


CREATE TABLE user_education_details (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    highest_qualification VARCHAR(150),
    institution_name VARCHAR(200),
    year_of_passing INT
);

CREATE TABLE user_professional_details (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    occupation VARCHAR(150),
    employment_type VARCHAR(100),
    company_name VARCHAR(200),
    annual_income_range VARCHAR(50),
    work_location VARCHAR(150)
);


CREATE TABLE user_family_details (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    father_occupation VARCHAR(150),
    mother_occupation VARCHAR(150),
    siblings_details TEXT,
    family_values VARCHAR(100)
);


CREATE TABLE user_horoscope_details (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    rasi VARCHAR(50),
    nakshatra VARCHAR(50),
    time_of_birth TIME,
    place_of_birth VARCHAR(150)
);


CREATE TABLE user_photos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    photo_url TEXT NOT NULL,
    visibility VARCHAR(20) DEFAULT 'PUBLIC',
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE partner_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    min_age INT,
    max_age INT,
    min_height INT,
    max_height INT,
    religion_preference TEXT,
    caste_preference TEXT,
    education_preference TEXT,
    profession_preference TEXT,
    location_preference TEXT
);



CREATE TABLE shortlisted_profiles (
    user_id UUID REFERENCES users(id),
    shortlisted_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, shortlisted_user_id)
);


CREATE TABLE search_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    search_filters JSONB,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    status VARCHAR(20)
        CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE user_reports (
    id SERIAL PRIMARY KEY,
    reported_by UUID REFERENCES users(id),
    reported_user UUID REFERENCES users(id),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    action TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    plan_name VARCHAR(50),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);