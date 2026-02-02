/**
 * Seed Test Data for Search Functionality
 * Creates diverse user profiles with complete information for testing search
 * 
 * Usage: node scripts/seed-search-test-data.js
 */

import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import logger from '../src/config/logger.js';

// Test data arrays
const maleNames = [
  'Rajesh Kumar', 'Amit Sharma', 'Vikram Singh', 'Rohan Gupta', 'Arjun Patel',
  'Sanjay Verma', 'Karan Mehta', 'Aditya Reddy', 'Nikhil Joshi', 'Rahul Desai'
];

const femaleNames = [
  'Priya Sharma', 'Anita Patel', 'Sneha Reddy', 'Divya Kumar', 'Kavita Singh',
  'Ritu Gupta', 'Meera Joshi', 'Pooja Verma', 'Neha Mehta', 'Anjali Desai'
];

const occupations = [
  'Software Engineer', 'Doctor', 'Teacher', 'Business Analyst', 'CA',
  'Architect', 'Marketing Manager', 'Civil Engineer', 'Bank Manager', 'Pharmacist'
];

const companies = [
  'TCS', 'Infosys', 'Wipro', 'Google India', 'Microsoft',
  'Apollo Hospital', 'HDFC Bank', 'ICICI Bank', 'Reliance', 'Deloitte'
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

const states = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu',
  'Maharashtra', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'
];

const motherTongues = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Marathi',
  'Gujarati', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi'
];

const rasiOptions = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 
  'Karka (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)',
  'Tula (Libra)', 'Vrishchika (Scorpio)', 'Dhanu (Sagittarius)',
  'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)'
];

const nakshatraOptions = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati'
];

const qualifications = [
  'B.Tech', 'M.Tech', 'MBA', 'MBBS', 'B.Com', 
  'M.Com', 'B.Sc', 'M.Sc', 'BCA', 'MCA'
];

const aboutMeTemplates = [
  'Looking for a life partner who values family and career.',
  'Engineer by profession, love traveling and reading books.',
  'Simple, family-oriented person seeking a compatible match.',
  'Passionate about my work and enjoy outdoor activities.',
  'Looking for someone who shares similar values and goals.',
];

// Helper to generate random number in range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to pick random element from array
const randomPick = (arr) => arr[randomInt(0, arr.length - 1)];

// Generate unique mobile number
const generateMobile = (index) => `${9000000000 + index}`;

// Generate profile ID
const generateProfileId = (index) => `MAT${String(index).padStart(8, '0')}`;

async function createTestUsers() {
  console.log('🚀 Starting test data creation...\n');

  try {
    // Get USER role
    const userRole = await prisma.role.findUnique({
      where: { role_name: 'USER' },
    });

    if (!userRole) {
      console.error('❌ USER role not found. Please seed roles first.');
      process.exit(1);
    }

    // Get Hindu religion for test data
    let hinduReligion = await prisma.religion.findFirst({
      where: { religion_name: 'Hindu' },
      include: { castes: true },
    });

    if (!hinduReligion) {
      console.log('Creating Hindu religion...');
      hinduReligion = await prisma.religion.create({
        data: { religion_name: 'Hindu', is_active: true },
        include: { castes: true },
      });
    }

    // Ensure we have castes
    if (hinduReligion.castes.length === 0) {
      console.log('Creating test castes...');
      await prisma.caste.createMany({
        data: [
          { religion_id: hinduReligion.id, caste_name: 'Brahmin', is_active: true },
          { religion_id: hinduReligion.id, caste_name: 'Kshatriya', is_active: true },
          { religion_id: hinduReligion.id, caste_name: 'Vaishya', is_active: true },
        ],
      });
      hinduReligion = await prisma.religion.findUnique({
        where: { id: hinduReligion.id },
        include: { castes: true },
      });
    }

    const hashedPassword = await bcrypt.hash('Test@123', 10);
    let successCount = 0;
    let errorCount = 0;

    // Create 10 male users
    console.log('Creating male users...');
    for (let i = 1; i <= 10; i++) {
      try {
        const gender = 'MALE';
        const age = randomInt(25, 35);
        const dateOfBirth = new Date();
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

        const user = await prisma.user.create({
          data: {
            profile_id: generateProfileId(i),
            role_id: userRole.id,
            full_name: maleNames[i - 1],
            gender,
            date_of_birth: dateOfBirth,
            mobile_number: generateMobile(i),
            email: `male${i}@test.com`,
            password_hash: hashedPassword,
            profile_created_by: 'SELF',
            is_mobile_verified: true,
            is_email_verified: true,
            is_profile_verified: true,
            is_active: true,
            highest_qualification: randomPick(qualifications),
            profile_completion_percentage: randomInt(70, 100),
          },
        });

        // Personal Details
        await prisma.userPersonalDetails.create({
          data: {
            user_id: user.id,
            height_cm: randomInt(165, 185),
            weight_kg: randomInt(60, 85),
            marital_status: 'NEVER_MARRIED',
            mother_tongue: motherTongues[i - 1],
            about_me: randomPick(aboutMeTemplates),
            body_type: 'ATHLETIC',
            complexion: 'FAIR',
            city: cities[i - 1],
            state: states[i - 1],
            diet_preference: 'VEGETARIAN',
            drinking_habit: 'NEVER',
            smoking_habit: 'NEVER',
          },
        });

        // Caste Details
        await prisma.userCasteDetails.create({
          data: {
            user_id: user.id,
            religion_id: hinduReligion.id,
            caste_id: randomPick(hinduReligion.castes).id,
          },
        });

        // Professional Details
        await prisma.userProfessionalDetails.create({
          data: {
            user_id: user.id,
            occupation: occupations[i - 1],
            employment_type: i <= 7 ? 'PRIVATE_JOB' : 'BUSINESS',
            company_name: companies[i - 1],
            annual_income_range: i <= 5 ? 'L5_TO_10L' : 'L10_TO_15L',
            work_location: cities[i - 1],
            designation: i <= 5 ? 'Senior ' + occupations[i - 1] : occupations[i - 1],
            years_of_experience: randomInt(3, 10),
          },
        });

        // Horoscope Details
        await prisma.userHoroscopeDetails.create({
          data: {
            user_id: user.id,
            rasi: rasiOptions[i - 1],
            nakshatra: nakshatraOptions[i - 1],
            place_of_birth: cities[i - 1],
          },
        });

        // Education Details
        await prisma.userEducationDetails.create({
          data: {
            user_id: user.id,
            qualification: randomPick(qualifications),
            institution_name: 'Test University',
            year_of_passing: 2015 + i,
          },
        });

        successCount++;
        console.log(`✅ Created: ${user.full_name} (${user.profile_id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating male user ${i}:`, error.message);
      }
    }

    // Create 10 female users
    console.log('\nCreating female users...');
    for (let i = 11; i <= 20; i++) {
      try {
        const gender = 'FEMALE';
        const age = randomInt(22, 30);
        const dateOfBirth = new Date();
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

        const user = await prisma.user.create({
          data: {
            profile_id: generateProfileId(i),
            role_id: userRole.id,
            full_name: femaleNames[i - 11],
            gender,
            date_of_birth: dateOfBirth,
            mobile_number: generateMobile(i),
            email: `female${i}@test.com`,
            password_hash: hashedPassword,
            profile_created_by: 'PARENT',
            is_mobile_verified: true,
            is_email_verified: true,
            is_profile_verified: true,
            is_active: true,
            highest_qualification: randomPick(qualifications),
            profile_completion_percentage: randomInt(70, 100),
          },
        });

        // Personal Details
        await prisma.userPersonalDetails.create({
          data: {
            user_id: user.id,
            height_cm: randomInt(150, 170),
            weight_kg: randomInt(45, 65),
            marital_status: 'NEVER_MARRIED',
            mother_tongue: motherTongues[i - 11],
            about_me: randomPick(aboutMeTemplates),
            body_type: 'SLIM',
            complexion: 'FAIR',
            city: cities[i - 11],
            state: states[i - 11],
            diet_preference: 'VEGETARIAN',
            drinking_habit: 'NEVER',
            smoking_habit: 'NEVER',
          },
        });

        // Caste Details
        await prisma.userCasteDetails.create({
          data: {
            user_id: user.id,
            religion_id: hinduReligion.id,
            caste_id: randomPick(hinduReligion.castes).id,
          },
        });

        // Professional Details
        await prisma.userProfessionalDetails.create({
          data: {
            user_id: user.id,
            occupation: occupations[i - 11],
            employment_type: i <= 17 ? 'PRIVATE_JOB' : 'GOVERNMENT_JOB',
            company_name: companies[i - 11],
            annual_income_range: i <= 15 ? 'L5_TO_10L' : 'L10_TO_15L',
            work_location: cities[i - 11],
            designation: occupations[i - 11],
            years_of_experience: randomInt(2, 8),
          },
        });

        // Horoscope Details
        await prisma.userHoroscopeDetails.create({
          data: {
            user_id: user.id,
            rasi: rasiOptions[i - 11],
            nakshatra: nakshatraOptions[i - 11],
            place_of_birth: cities[i - 11],
          },
        });

        // Education Details
        await prisma.userEducationDetails.create({
          data: {
            user_id: user.id,
            qualification: randomPick(qualifications),
            institution_name: 'Test University',
            year_of_passing: 2015 + i,
          },
        });

        successCount++;
        console.log(`✅ Created: ${user.full_name} (${user.profile_id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating female user ${i}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST DATA CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount} users`);
    console.log(`❌ Failed:  ${errorCount} users`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n✅ Test data created successfully!');
      console.log('\n📝 Test Credentials:');
      console.log('   Email: male1@test.com, female11@test.com, etc.');
      console.log('   Password: Test@123');
      console.log('\n🔍 Profile IDs:');
      console.log('   MAT00000001 to MAT00000020');
      console.log('\n💡 You can now test search with various filters:');
      console.log('   - Keywords: engineer, doctor, teacher, etc.');
      console.log('   - Mother Tongues: Hindi, English, Tamil, etc.');
      console.log('   - Heights: 150-185 cm range');
      console.log('   - Rasis: Mesha, Simha, etc.');
      console.log('   - Nakshatras: Ashwini, Bharani, etc.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    logger.error('Seed test data error', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n👋 Database connection closed.');
  }
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
