import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TARGET_USER_ID = 'eb5321fe-160b-4688-8ca2-d56f3b1d6e4e';

async function seedForExistingUser() {
  try {
    console.log('🌱 Seeding test data for existing user...\n');

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID },
      select: { id: true, mobile_number: true, profile_id: true, gender: true }
    });

    if (!targetUser) {
      console.log('❌ Target user not found:', TARGET_USER_ID);
      return;
    }

    console.log('✅ Found target user:', targetUser);

    // Assign profile ID if not present
    if (!targetUser.profile_id) {
      const updatedUser = await prisma.user.update({
        where: { id: TARGET_USER_ID },
        data: { profile_id: 'MAT00000001' }
      });
      console.log('✅ Assigned profile ID:', updatedUser.profile_id);
      targetUser.profile_id = updatedUser.profile_id;
    }

    // Create other test users for searching
    console.log('\n📝 Creating additional test profiles...\n');

    const testPassword = await bcrypt.hash('Test@123', 10);
    const testProfiles = [];

    // Create 10 male profiles
    for (let i = 2; i <= 11; i++) {
      const profileId = `MAT${String(i).padStart(8, '0')}`;
      const mobileNumber = `900000000${i}`;
      
      const user = await prisma.user.upsert({
        where: { mobile_number: mobileNumber },
        update: {
          profile_id: profileId,
          full_name: `Test Male ${i}`,
          gender: 'Male',
          date_of_birth: new Date(1995 + (i % 5), (i % 12), 15),
        },
        create: {
          profile_id: profileId,
          role_id: 2,
          full_name: `Test Male ${i}`,
          gender: 'Male',
          date_of_birth: new Date(1995 + (i % 5), (i % 12), 15),
          mobile_number: mobileNumber,
          password_hash: testPassword,
          profile_created_by: 'Self',
          is_mobile_verified: true,
        },
      });

      // Personal details with varying heights
      await prisma.userPersonalDetails.upsert({
        where: { user_id: user.id },
        update: {
          height_cm: 155 + (i * 3), // Heights from 158 to 188
          weight_kg: 60 + (i * 2),
          marital_status: i % 3 === 0 ? 'Never Married' : 'Divorced',
          mother_tongue: ['Tamil', 'Telugu', 'Hindi', 'Kannada', 'Malayalam'][i % 5],
          physical_status: 'Normal',
        },
        create: {
          user_id: user.id,
          height_cm: 155 + (i * 3),
          weight_kg: 60 + (i * 2),
          marital_status: i % 3 === 0 ? 'Never Married' : 'Divorced',
          mother_tongue: ['Tamil', 'Telugu', 'Hindi', 'Kannada', 'Malayalam'][i % 5],
          physical_status: 'Normal',
        },
      });

      // Education details - use deleteMany + create since it has auto-increment id
      await prisma.userEducationDetails.deleteMany({
        where: { user_id: user.id }
      });
      await prisma.userEducationDetails.create({
        data: {
          user_id: user.id,
          qualification: ['B.Tech', 'M.Tech', 'MBA', 'B.Com', 'M.Com'][i % 5],
        },
      });

      // Professional details
      await prisma.userProfessionalDetails.upsert({
        where: { user_id: user.id },
        update: {
          employment_type: ['Private Sector', 'Government', 'Business'][i % 3],
          occupation: ['Software Engineer', 'Doctor', 'Teacher', 'Businessman'][i % 4],
          annual_income_range: `${5 + i}-${6 + i} Lakhs`,
        },
        create: {
          user_id: user.id,
          employment_type: ['Private Sector', 'Government', 'Business'][i % 3],
          occupation: ['Software Engineer', 'Doctor', 'Teacher', 'Businessman'][i % 4],
          annual_income_range: `${5 + i}-${6 + i} Lakhs`,
        },
      });

      // Horoscope details with varying rasi/nakshatra
      await prisma.userHoroscopeDetails.upsert({
        where: { user_id: user.id },
        update: {
          rasi: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo'][i % 5],
          nakshatra: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira'][i % 5],
        },
        create: {
          user_id: user.id,
          rasi: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo'][i % 5],
          nakshatra: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira'][i % 5],
        },
      });

      testProfiles.push({ profileId, mobileNumber, userId: user.id });
      console.log(`  ✅ Created ${profileId}: ${user.full_name} (${mobileNumber})`);
    }

    // Create 10 female profiles
    for (let i = 12; i <= 21; i++) {
      const profileId = `MAT${String(i).padStart(8, '0')}`;
      const mobileNumber = `900000000${i}`;
      
      const user = await prisma.user.upsert({
        where: { mobile_number: mobileNumber },
        update: {
          profile_id: profileId,
          full_name: `Test Female ${i}`,
          gender: 'Female',
          date_of_birth: new Date(1995 + (i % 5), (i % 12), 15),
        },
        create: {
          profile_id: profileId,
          role_id: 2,
          full_name: `Test Female ${i}`,
          gender: 'Female',
          date_of_birth: new Date(1995 + (i % 5), (i % 12), 15),
          mobile_number: mobileNumber,
          password_hash: testPassword,
          profile_created_by: 'Self',
          is_mobile_verified: true,
        },
      });

      // Personal details
      await prisma.userPersonalDetails.upsert({
        where: { user_id: user.id },
        update: {
          height_cm: 145 + (i * 2), // Heights from 169 to 187
          weight_kg: 45 + (i * 2),
          marital_status: i % 3 === 0 ? 'Never Married' : 'Divorced',
          mother_tongue: ['Tamil', 'Telugu', 'Hindi', 'Kannada', 'Malayalam'][i % 5],
          physical_status: 'Normal',
        },
        create: {
          user_id: user.id,
          height_cm: 145 + (i * 2),
          weight_kg: 45 + (i * 2),
          marital_status: i % 3 === 0 ? 'Never Married' : 'Divorced',
          mother_tongue: ['Tamil', 'Telugu', 'Hindi', 'Kannada', 'Malayalam'][i % 5],
          physical_status: 'Normal',
        },
      });

      // Education - use deleteMany + create since it has auto-increment id
      await prisma.userEducationDetails.deleteMany({
        where: { user_id: user.id }
      });
      await prisma.userEducationDetails.create({
        data: {
          user_id: user.id,
          qualification: ['B.Tech', 'M.Tech', 'MBA', 'B.Sc', 'M.Sc'][i % 5],
        },
      });

      // Professional
      await prisma.userProfessionalDetails.upsert({
        where: { user_id: user.id },
        update: {
          employment_type: ['Private Sector', 'Government', 'Not Working'][i % 3],
          occupation: ['Software Engineer', 'Doctor', 'Teacher', 'Homemaker'][i % 4],
          annual_income_range: `${4 + i}-${5 + i} Lakhs`,
        },
        create: {
          user_id: user.id,
          employment_type: ['Private Sector', 'Government', 'Not Working'][i % 3],
          occupation: ['Software Engineer', 'Doctor', 'Teacher', 'Homemaker'][i % 4],
          annual_income_range: `${4 + i}-${5 + i} Lakhs`,
        },
      });

      // Horoscope
      await prisma.userHoroscopeDetails.upsert({
        where: { user_id: user.id },
        update: {
          rasi: ['Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn'][i % 5],
          nakshatra: ['Pushya', 'Ashlesha', 'Magha', 'Purva', 'Uttara'][i % 5],
        },
        create: {
          user_id: user.id,
          rasi: ['Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn'][i % 5],
          nakshatra: ['Pushya', 'Ashlesha', 'Magha', 'Purva', 'Uttara'][i % 5],
        },
      });

      testProfiles.push({ profileId, mobileNumber, userId: user.id });
      console.log(`  ✅ Created ${profileId}: ${user.full_name} (${mobileNumber})`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`   Created ${testProfiles.length} test profiles`);
    console.log('\n📋 Test Credentials:');
    console.log('   Mobile: 9000000002 to 9000000021');
    console.log('   Password: Test@123');
    console.log('\n🔍 Search Test Data:');
    console.log('   Heights: 158-188 cm (males), 169-187 cm (females)');
    console.log('   Mother Tongues: Tamil, Telugu, Hindi, Kannada, Malayalam');
    console.log('   Rasis: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn');
    console.log('   Nakshatras: Ashwini, Bharani, Krittika, Rohini, Mrigashira, Pushya, Ashlesha, Magha, Purva, Uttara');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedForExistingUser();
