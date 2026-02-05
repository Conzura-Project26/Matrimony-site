/**
 * Comprehensive Test User Seeding Script
 * Creates test users with complete profile information for all features
 */

import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

// Test users with complete profiles
const TEST_USERS = [
  {
    // Basic Info
    mobile: '9876000001',
    password: 'Male1@2024',
    email: 'arun.sharma@test.com',
    full_name: 'Arun Sharma',
    gender: 'Male',
    date_of_birth: new Date('1995-05-15'),
    profile_created_by: 'Self',
    role: 'USER',
    
    // Personal Details
    personal: {
      height_cm: 175,
      weight_kg: 72,
      marital_status: 'Never Married',
      physical_status: 'Normal',
      mother_tongue: 'Hindi',
      about_me: 'Software engineer looking for a life partner',
      blood_group: 'O+',
      body_type: 'Athletic',
      complexion: 'Fair',
      diet_preference: 'Vegetarian',
      drinking_habit: 'No',
      smoking_habit: 'No',
      city: 'Bangalore',
      state: 'Karnataka'
    },
    
    // Caste Details
    caste: {
      religion: 'Hinduism',
      caste: 'Brahmin',
      sub_caste: 'Iyer'
    },
    
    // Education
    education: {
      qualification: 'B.Tech - Computer Science',
      institution: 'IIT Delhi',
      year_of_passing: 2017
    },
    
    // Professional
    professional: {
      occupation: 'Software Engineer',
      employment_type: 'Private Sector',
      designation: 'Senior Software Engineer',
      company_name: 'Tech Corp',
      annual_income_range: '10-15 LPA',
      years_of_experience: 7,
      work_city: 'Bangalore',
      work_state: 'Karnataka',
      work_location_type: 'Office'
    },
    
    // Family
    family: {
      father_occupation: 'Business',
      mother_occupation: 'Teacher',
      siblings_details: '1 Sister, Married',
      family_values: 'Traditional'
    },
    
    // Horoscope
    horoscope: {
      rasi: 'Mesha',
      nakshatra: 'Ashwini',
      time_of_birth: '10:30:00',
      place_of_birth: 'Bangalore'
    },
    
    // Partner Preferences
    preferences: {
      min_age: 23,
      max_age: 30,
      min_height: 155,
      max_height: 170,
      min_weight: 45,
      max_weight: 65,
      marital_status_preference: ['Never Married'],
      mother_tongue_preference: ['Hindi', 'Kannada', 'Tamil'],
      diet_preference: ['Vegetarian'],
      drinking_habit_preference: ['No'],
      smoking_habit_preference: ['No'],
      education_preference: ['B.Tech', 'M.Tech', 'MBA', 'MCA'],
      employment_type_preference: ['Private Sector', 'Government'],
      physical_status: ['Normal'],
      preferred_location: {
        cities: ['Bangalore', 'Mumbai', 'Delhi'],
        states: ['Karnataka', 'Maharashtra', 'Delhi']
      }
    }
  },
  
  {
    // Basic Info
    mobile: '9876000002',
    password: 'Female1@2024',
    email: 'priya.mehta@test.com',
    full_name: 'Priya Mehta',
    gender: 'Female',
    date_of_birth: new Date('1998-08-20'),
    profile_created_by: 'Parent',
    role: 'USER',
    
    // Personal Details
    personal: {
      height_cm: 162,
      weight_kg: 55,
      marital_status: 'Never Married',
      physical_status: 'Normal',
      mother_tongue: 'Hindi',
      about_me: 'Looking for a caring and understanding life partner',
      blood_group: 'A+',
      body_type: 'Slim',
      complexion: 'Wheatish',
      diet_preference: 'Vegetarian',
      drinking_habit: 'No',
      smoking_habit: 'No',
      city: 'Mumbai',
      state: 'Maharashtra'
    },
    
    caste: {
      religion: 'Hinduism',
      caste: 'Vaishya',
      sub_caste: 'Agarwal'
    },
    
    education: {
      qualification: 'MBA - Marketing',
      institution: 'XLRI Jamshedpur',
      year_of_passing: 2020
    },
    
    professional: {
      occupation: 'Marketing Manager',
      employment_type: 'Private Sector',
      designation: 'Marketing Manager',
      company_name: 'Brand Solutions',
      annual_income_range: '8-10 LPA',
      years_of_experience: 4,
      work_city: 'Mumbai',
      work_state: 'Maharashtra',
      work_location_type: 'Hybrid'
    },
    
    family: {
      father_occupation: 'Chartered Accountant',
      mother_occupation: 'Homemaker',
      siblings_details: '1 Brother, Unmarried',
      family_values: 'Moderate'
    },
    
    horoscope: {
      rasi: 'Vrishabha',
      nakshatra: 'Rohini',
      time_of_birth: '14:20:00',
      place_of_birth: 'Mumbai'
    },
    
    preferences: {
      min_age: 26,
      max_age: 32,
      min_height: 170,
      max_height: 185,
      min_weight: 65,
      max_weight: 85,
      marital_status_preference: ['Never Married'],
      mother_tongue_preference: ['Hindi', 'Marathi', 'Gujarati'],
      diet_preference: ['Vegetarian'],
      drinking_habit_preference: ['No', 'Socially'],
      smoking_habit_preference: ['No'],
      education_preference: ['B.Tech', 'M.Tech', 'MBA', 'CA'],
      employment_type_preference: ['Private Sector', 'Business'],
      physical_status: ['Normal'],
      preferred_location: {
        cities: ['Mumbai', 'Pune', 'Delhi', 'Bangalore'],
        states: ['Maharashtra', 'Delhi', 'Karnataka']
      }
    }
  },
  
  {
    mobile: '9876000003',
    password: 'Male2@2024',
    email: 'rahul.patel@test.com',
    full_name: 'Rahul Patel',
    gender: 'Male',
    date_of_birth: new Date('1993-12-10'),
    profile_created_by: 'Self',
    role: 'USER',
    
    personal: {
      height_cm: 180,
      weight_kg: 78,
      marital_status: 'Divorced',
      physical_status: 'Normal',
      mother_tongue: 'Gujarati',
      about_me: 'Entrepreneur looking for a second chance at love',
      blood_group: 'B+',
      body_type: 'Average',
      complexion: 'Fair',
      diet_preference: 'Vegetarian',
      drinking_habit: 'Socially',
      smoking_habit: 'No',
      city: 'Ahmedabad',
      state: 'Gujarat'
    },
    
    caste: {
      religion: 'Hinduism',
      caste: 'Patel',
      sub_caste: null
    },
    
    education: {
      qualification: 'B.Com',
      institution: 'Gujarat University',
      year_of_passing: 2015
    },
    
    professional: {
      occupation: 'Business Owner',
      employment_type: 'Business',
      designation: 'Owner',
      company_name: 'Patel Textiles',
      annual_income_range: '15-20 LPA',
      years_of_experience: 9,
      work_city: 'Ahmedabad',
      work_state: 'Gujarat',
      work_location_type: 'Office'
    },
    
    family: {
      father_occupation: 'Business',
      mother_occupation: 'Homemaker',
      siblings_details: '2 Brothers, Both Married',
      family_values: 'Traditional'
    },
    
    horoscope: {
      rasi: 'Dhanu',
      nakshatra: 'Moola',
      time_of_birth: '06:45:00',
      place_of_birth: 'Ahmedabad'
    },
    
    preferences: {
      min_age: 25,
      max_age: 35,
      min_height: 155,
      max_height: 170,
      marital_status_preference: ['Never Married', 'Divorced', 'Widowed'],
      mother_tongue_preference: ['Gujarati', 'Hindi'],
      diet_preference: ['Vegetarian'],
      drinking_habit_preference: ['No', 'Socially'],
      smoking_habit_preference: ['No'],
      education_preference: ['B.Com', 'MBA', 'B.A', 'M.A'],
      employment_type_preference: ['Private Sector', 'Business', 'Homemaker'],
      physical_status: ['Normal']
    }
  },
  
  {
    mobile: '9876000004',
    password: 'Female2@2024',
    email: 'sneha.reddy@test.com',
    full_name: 'Sneha Reddy',
    gender: 'Female',
    date_of_birth: new Date('1996-03-25'),
    profile_created_by: 'Parent',
    role: 'USER',
    
    personal: {
      height_cm: 165,
      weight_kg: 58,
      marital_status: 'Never Married',
      physical_status: 'Normal',
      mother_tongue: 'Telugu',
      about_me: 'Doctor seeking a well-educated partner',
      blood_group: 'AB+',
      body_type: 'Average',
      complexion: 'Wheatish',
      diet_preference: 'Non-Vegetarian',
      drinking_habit: 'No',
      smoking_habit: 'No',
      city: 'Hyderabad',
      state: 'Telangana'
    },
    
    caste: {
      religion: 'Hinduism',
      caste: 'Reddy',
      sub_caste: null
    },
    
    education: {
      qualification: 'MBBS',
      institution: 'Osmania Medical College',
      year_of_passing: 2019
    },
    
    professional: {
      occupation: 'Doctor',
      employment_type: 'Government',
      designation: 'Medical Officer',
      company_name: 'Government Hospital',
      annual_income_range: '12-15 LPA',
      years_of_experience: 5,
      work_city: 'Hyderabad',
      work_state: 'Telangana',
      work_location_type: 'Office'
    },
    
    family: {
      father_occupation: 'Retired Government Officer',
      mother_occupation: 'Homemaker',
      siblings_details: '1 Sister, Married',
      family_values: 'Moderate'
    },
    
    horoscope: {
      rasi: 'Kumbha',
      nakshatra: 'Shatabhisha',
      time_of_birth: '08:15:00',
      place_of_birth: 'Hyderabad'
    },
    
    preferences: {
      min_age: 27,
      max_age: 33,
      min_height: 172,
      max_height: 185,
      marital_status_preference: ['Never Married'],
      mother_tongue_preference: ['Telugu', 'Hindi', 'Tamil'],
      diet_preference: ['Vegetarian', 'Non-Vegetarian'],
      drinking_habit_preference: ['No', 'Socially'],
      smoking_habit_preference: ['No'],
      education_preference: ['MBBS', 'MD', 'B.Tech', 'MBA'],
      employment_type_preference: ['Government', 'Private Sector'],
      physical_status: ['Normal']
    }
  },
  
  {
    mobile: '9876000005',
    password: 'Male3@2024',
    email: 'vikram.singh@test.com',
    full_name: 'Vikram Singh',
    gender: 'Male',
    date_of_birth: new Date('1990-07-18'),
    profile_created_by: 'Self',
    role: 'USER',
    
    personal: {
      height_cm: 178,
      weight_kg: 82,
      marital_status: 'Widowed',
      physical_status: 'Normal',
      mother_tongue: 'Punjabi',
      about_me: 'Army officer looking for a supportive life partner',
      blood_group: 'O+',
      body_type: 'Athletic',
      complexion: 'Fair',
      diet_preference: 'Non-Vegetarian',
      drinking_habit: 'Socially',
      smoking_habit: 'No',
      city: 'Delhi',
      state: 'Delhi'
    },
    
    caste: {
      religion: 'Sikhism',
      caste: 'Jat',
      sub_caste: null
    },
    
    education: {
      qualification: 'B.Sc - Physics',
      institution: 'Delhi University',
      year_of_passing: 2012
    },
    
    professional: {
      occupation: 'Defence Services',
      employment_type: 'Government',
      designation: 'Captain',
      company_name: 'Indian Army',
      annual_income_range: '10-12 LPA',
      years_of_experience: 12,
      work_city: 'Delhi',
      work_state: 'Delhi',
      work_location_type: 'Office'
    },
    
    family: {
      father_occupation: 'Retired Army Officer',
      mother_occupation: 'Homemaker',
      siblings_details: '1 Brother, Married',
      family_values: 'Traditional'
    },
    
    preferences: {
      min_age: 25,
      max_age: 32,
      min_height: 155,
      max_height: 170,
      marital_status_preference: ['Never Married', 'Divorced', 'Widowed'],
      mother_tongue_preference: ['Punjabi', 'Hindi'],
      diet_preference: ['Vegetarian', 'Non-Vegetarian'],
      drinking_habit_preference: ['No', 'Socially'],
      smoking_habit_preference: ['No'],
      education_preference: ['B.A', 'B.Com', 'B.Sc', 'MBA'],
      employment_type_preference: ['Government', 'Private Sector', 'Homemaker'],
      physical_status: ['Normal']
    }
  },
  
  {
    mobile: '9876000006',
    password: 'Moderator@2024',
    email: 'admin.mod@test.com',
    full_name: 'Admin Moderator',
    gender: 'Male',
    date_of_birth: new Date('1988-01-01'),
    profile_created_by: 'Self',
    role: 'MODERATOR',
    
    personal: {
      height_cm: 175,
      weight_kg: 70,
      marital_status: 'Married',
      physical_status: 'Normal',
      mother_tongue: 'Hindi',
      city: 'Bangalore',
      state: 'Karnataka'
    }
  },
  
  {
    mobile: '9876000007',
    password: 'Admin@2024',
    email: 'super.admin@test.com',
    full_name: 'Super Admin',
    gender: 'Male',
    date_of_birth: new Date('1985-01-01'),
    profile_created_by: 'Self',
    role: 'ADMIN',
    
    personal: {
      height_cm: 178,
      weight_kg: 75,
      marital_status: 'Married',
      physical_status: 'Normal',
      mother_tongue: 'English',
      city: 'Bangalore',
      state: 'Karnataka'
    }
  }
];

async function seedCompleteTestUsers() {
  console.log('\n🌱 Starting comprehensive test user seeding...\n');
  
  const createdUsers = [];
  
  for (const userData of TEST_USERS) {
    try {
      console.log(`\n📝 Processing: ${userData.full_name} (${userData.mobile})`);
      
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { mobile_number: userData.mobile }
      });
      
      if (user) {
        console.log(`   ⚠️  User already exists`);
        createdUsers.push(user);
        continue;
      }
      
      // Get role ID
      const role = await prisma.role.findUnique({
        where: { role_name: userData.role }
      });
      
      if (!role) {
        console.log(`   ❌ Role ${userData.role} not found`);
        continue;
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      // Create user
      user = await prisma.user.create({
        data: {
          mobile_number: userData.mobile,
          password_hash: passwordHash,
          full_name: userData.full_name,
          email: userData.email,
          role_id: role.id,
          gender: userData.gender,
          date_of_birth: userData.date_of_birth,
          profile_created_by: userData.profile_created_by,
          is_mobile_verified: true,
          is_active: true
        }
      });
      
      console.log(`   ✅ User created: ${user.id}`);
      
      // Create personal details
      if (userData.personal) {
        await prisma.userPersonalDetails.create({
          data: {
            user_id: user.id,
            ...userData.personal
          }
        });
        console.log(`   ✅ Personal details added`);
      }
      
      // Create caste details
      if (userData.caste) {
        const religion = await prisma.religion.findUnique({
          where: { religion_name: userData.caste.religion }
        });
        
        if (religion) {
          const caste = await prisma.caste.findFirst({
            where: {
              religion_id: religion.id,
              caste_name: userData.caste.caste
            }
          });
          
          let subCaste = null;
          if (userData.caste.sub_caste && caste) {
            subCaste = await prisma.subCaste.findFirst({
              where: {
                caste_id: caste.id,
                sub_caste_name: userData.caste.sub_caste
              }
            });
          }
          
          await prisma.userCasteDetails.create({
            data: {
              user_id: user.id,
              religion_id: religion.id,
              caste_id: caste?.id,
              sub_caste_id: subCaste?.id
            }
          });
          console.log(`   ✅ Caste details added`);
        }
      }
      
      // Create education details
      if (userData.education) {
        await prisma.userEducationDetails.create({
          data: {
            user_id: user.id,
            qualification: userData.education.qualification,
            institution_name: userData.education.institution,
            year_of_passing: userData.education.year_of_passing
          }
        });
        console.log(`   ✅ Education details added`);
      }
      
      // Create professional details
      if (userData.professional) {
        await prisma.userProfessionalDetails.create({
          data: {
            user_id: user.id,
            ...userData.professional
          }
        });
        console.log(`   ✅ Professional details added`);
      }
      
      // Create family details
      if (userData.family) {
        await prisma.userFamilyDetails.create({
          data: {
            user_id: user.id,
            ...userData.family
          }
        });
        console.log(`   ✅ Family details added`);
      }
      
      // Create horoscope details
      if (userData.horoscope) {
        await prisma.userHoroscopeDetails.create({
          data: {
            user_id: user.id,
            rasi: userData.horoscope.rasi,
            nakshatra: userData.horoscope.nakshatra,
            time_of_birth: new Date(`1970-01-01T${userData.horoscope.time_of_birth}`),
            place_of_birth: userData.horoscope.place_of_birth
          }
        });
        console.log(`   ✅ Horoscope details added`);
      }
      
      // Create partner preferences
      if (userData.preferences) {
        // Get religion IDs for preferences
        let religionPreference = [];
        if (userData.caste) {
          const religion = await prisma.religion.findUnique({
            where: { religion_name: userData.caste.religion }
          });
          if (religion) religionPreference.push(religion.id);
        }
        
        await prisma.partnerPreferences.create({
          data: {
            user_id: user.id,
            ...userData.preferences,
            religion_preference: religionPreference,
            caste_preference: []
          }
        });
        console.log(`   ✅ Partner preferences added`);
      }
      
      createdUsers.push(user);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SEEDING SUMMARY\n');
  console.log(`Total users processed: ${TEST_USERS.length}`);
  console.log(`Successfully created/verified: ${createdUsers.length}\n`);
  
  console.log('👥 User List:\n');
  createdUsers.forEach((user, index) => {
    const userData = TEST_USERS[index];
    console.log(`${index + 1}. ${user.full_name}`);
    console.log(`   Mobile: ${user.mobile_number}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${userData.role}`);
    console.log(``);
  });
  
  console.log('='.repeat(80));
  console.log('\n✅ Comprehensive test user seeding complete!\n');
  
  await prisma.$disconnect();
}

seedCompleteTestUsers().catch(console.error);
