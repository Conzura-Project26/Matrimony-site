/**
 * Seed Test User Profile
 * Populates test user (9380245433) with complete profile data to reach 60%+ completion
 */

import prisma from '../src/config/prisma.js';
import { updateProfileCompletionCache } from '../src/utils/profileCompletion.js';

const TEST_USER_MOBILE = '9380245433';
const TEST_USER_ID = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

async function seedTestUser() {
  console.log('🌱 Seeding test user profile...\n');

  try {
    // 1. Update basic info (add email)
    console.log('📧 Adding email to user...');
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: {
        email: 'harsha.test@example.com',
        highest_qualification: 'B.Tech in Computer Science'
      }
    });
    console.log('✓ Email and qualification added\n');

    // 2. Add Personal Details (20 points)
    console.log('👤 Adding personal details...');
    await prisma.userPersonalDetails.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        height_cm: 175,
        weight_kg: 70,
        marital_status: 'Never Married',
        physical_status: 'Normal',
        mother_tongue: 'Telugu',
        complexion: 'Fair',
        body_type: 'Average',
        blood_group: 'O+',
        diet_preference: 'Vegetarian',
        drinking_habit: 'Non-Drinker',
        smoking_habit: 'Non-Smoker',
        about_me: 'Software engineer passionate about technology and innovation. Looking for a life partner who shares similar values and interests.',
        city: 'Bangalore',
        state: 'Karnataka'
      },
      create: {
        user_id: TEST_USER_ID,
        height_cm: 175,
        weight_kg: 70,
        marital_status: 'Never Married',
        physical_status: 'Normal',
        mother_tongue: 'Telugu',
        complexion: 'Fair',
        body_type: 'Average',
        blood_group: 'O+',
        diet_preference: 'Vegetarian',
        drinking_habit: 'Non-Drinker',
        smoking_habit: 'Non-Smoker',
        about_me: 'Software engineer passionate about technology and innovation. Looking for a life partner who shares similar values and interests.',
        city: 'Bangalore',
        state: 'Karnataka'
      }
    });
    console.log('✓ Personal details added\n');

    // 3. Add Caste Details (10 points)
    console.log('🕉️ Adding caste details...');
    await prisma.userCasteDetails.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        religion_id: 1, // Hindu
        caste_id: 1,    // Assuming ID 1 exists
        sub_caste_id: null
      },
      create: {
        user_id: TEST_USER_ID,
        religion_id: 1,
        caste_id: 1,
        sub_caste_id: null
      }
    });
    console.log('✓ Caste details added\n');

    // 4. Add Education Details (10 points - 2 entries)
    console.log('🎓 Adding education details...');
    
    // Delete existing education entries first
    await prisma.userEducationDetails.deleteMany({
      where: { user_id: TEST_USER_ID }
    });
    
    await prisma.userEducationDetails.createMany({
      data: [
        {
          user_id: TEST_USER_ID,
          qualification: 'B.Tech in Computer Science',
          institution_name: 'IIT Bangalore',
          year_of_passing: 2020
        },
        {
          user_id: TEST_USER_ID,
          qualification: '12th Standard',
          institution_name: 'ABC High School',
          year_of_passing: 2016
        }
      ]
    });
    console.log('✓ Education details added\n');

    // 5. Add Professional Details (10 points)
    console.log('💼 Adding professional details...');
    await prisma.userProfessionalDetails.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        occupation: 'Software Engineer',
        employment_type: 'Full-time',
        company_name: 'Tech Solutions Pvt Ltd',
        annual_income_range: '10-15 Lakhs',
        designation: 'Senior Developer',
        years_of_experience: 4,
        work_city: 'Bangalore',
        work_state: 'Karnataka',
        work_location_type: 'Hybrid'
      },
      create: {
        user_id: TEST_USER_ID,
        occupation: 'Software Engineer',
        employment_type: 'Full-time',
        company_name: 'Tech Solutions Pvt Ltd',
        annual_income_range: '10-15 Lakhs',
        designation: 'Senior Developer',
        years_of_experience: 4,
        work_city: 'Bangalore',
        work_state: 'Karnataka',
        work_location_type: 'Hybrid'
      }
    });
    console.log('✓ Professional details added\n');

    // 6. Add Family Details (10 points)
    console.log('👨‍👩‍👧‍👦 Adding family details...');
    await prisma.userFamilyDetails.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        father_occupation: 'Business Owner',
        mother_occupation: 'Homemaker',
        siblings_details: '1 brother, 1 sister',
        family_values: 'Traditional'
      },
      create: {
        user_id: TEST_USER_ID,
        father_occupation: 'Business Owner',
        mother_occupation: 'Homemaker',
        siblings_details: '1 brother, 1 sister',
        family_values: 'Traditional'
      }
    });
    console.log('✓ Family details added\n');

    // 7. Add Horoscope Details (5 points)
    console.log('🌟 Adding horoscope details...');
    await prisma.userHoroscopeDetails.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        rasi: 'Mesha (Aries)',
        nakshatra: 'Ashwini',
        time_of_birth: new Date('2000-01-01T10:30:00Z'),
        place_of_birth: 'Bangalore'
      },
      create: {
        user_id: TEST_USER_ID,
        rasi: 'Mesha (Aries)',
        nakshatra: 'Ashwini',
        time_of_birth: new Date('2000-01-01T10:30:00Z'),
        place_of_birth: 'Bangalore'
      }
    });
    console.log('✓ Horoscope details added\n');

    // 8. Add Partner Preferences (5 points)
    console.log('💑 Adding partner preferences...');
    await prisma.partnerPreferences.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        min_age: 22,
        max_age: 28,
        min_height: 155,
        max_height: 170,
        marital_status_preference: ['Never Married'],
        mother_tongue_preference: ['Telugu', 'Hindi', 'English'],
        religion_preference: [1],
        education_preference: ['B.Tech', 'B.E.', 'M.Tech', 'MBA'],
        employment_type_preference: ['Full-time', 'Self-employed']
      },
      create: {
        user_id: TEST_USER_ID,
        min_age: 22,
        max_age: 28,
        min_height: 155,
        max_height: 170,
        marital_status_preference: ['Never Married'],
        mother_tongue_preference: ['Telugu', 'Hindi', 'English'],
        religion_preference: [1],
        education_preference: ['B.Tech', 'B.E.', 'M.Tech', 'MBA'],
        employment_type_preference: ['Full-time', 'Self-employed']
      }
    });
    console.log('✓ Partner preferences added\n');

    // 9. Update profile completion percentage
    console.log('🔄 Calculating profile completion...');
    const completionPercentage = await updateProfileCompletionCache(TEST_USER_ID);
    console.log(`✓ Profile completion updated: ${completionPercentage}%\n`);

    // Verify the update
    const updatedUser = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      select: {
        full_name: true,
        mobile_number: true,
        email: true,
        profile_completion_percentage: true
      }
    });

    console.log('✅ Test user seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Name: ${updatedUser.full_name}`);
    console.log(`📱 Mobile: ${updatedUser.mobile_number}`);
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`📊 Profile Completion: ${updatedUser.profile_completion_percentage}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (updatedUser.profile_completion_percentage >= 60) {
      console.log('🎉 User now meets minimum 60% requirement for sending interests!\n');
    } else {
      console.log(`⚠️ Warning: Profile completion is below 60% (${updatedUser.profile_completion_percentage}%)\n`);
    }

  } catch (error) {
    console.error('❌ Error seeding test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedTestUser();
