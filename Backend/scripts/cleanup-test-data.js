import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    console.log('🧹 Starting cleanup of test data...\n');

    // Generate the exact test mobile numbers (9000000001 to 9000000020)
    const testMobileNumbers = Array.from({ length: 20 }, (_, i) => 
      `900000000${i + 1}`.slice(0, 10)
    );

    // Generate the exact test profile IDs (MAT00000001 to MAT00000020)
    const testProfileIds = Array.from({ length: 20 }, (_, i) => 
      `MAT${String(i + 1).padStart(8, '0')}`
    );

    console.log('Looking for test users with:');
    console.log('  Mobile numbers:', testMobileNumbers.slice(0, 3).join(', '), '...');
    console.log('  Profile IDs:', testProfileIds.slice(0, 3).join(', '), '...\n');

    // Find only the seeded test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { profile_id: { in: testProfileIds } },
          { mobile_number: { in: testMobileNumbers } }
        ]
      },
      select: {
        id: true,
        mobile_number: true,
        profile_id: true,
      }
    });

    if (testUsers.length === 0) {
      console.log('✅ No test data found to clean up.');
      return;
    }

    console.log(`Found ${testUsers.length} test users to delete:`);
    testUsers.forEach(user => {
      console.log(`  - ${user.profile_id || 'NULL'}: ${user.mobile_number}`);
    });
    console.log();

    const userIds = testUsers.map(u => u.id);

    // Delete related data first (in reverse order of dependencies)
    console.log('Deleting related data...');

    // Delete search logs
    const searchLogs = await prisma.searchLog.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${searchLogs.count} search logs`);

    // Delete photos
    const photos = await prisma.userPhoto.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${photos.count} photos`);

    // Delete partner preferences
    const preferences = await prisma.partnerPreferences.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${preferences.count} partner preferences`);

    // Delete horoscope details
    const horoscopes = await prisma.userHoroscopeDetails.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${horoscopes.count} horoscope details`);

    // Delete family details
    const families = await prisma.userFamilyDetails.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${families.count} family details`);

    // Delete professional details
    const professionals = await prisma.userProfessionalDetails.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${professionals.count} professional details`);

    // Delete education details
    const educations = await prisma.userEducationDetails.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${educations.count} education details`);

    // Delete caste details
    const castes = await prisma.userCasteDetails.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${castes.count} caste details`);

    // Delete personal details
    const personals = await prisma.userPersonalDetails.deleteMany({
      where: { user_id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${personals.count} personal details`);

    // Finally, delete users
    const users = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`  ✅ Deleted ${users.count} users\n`);

    console.log('🎉 Cleanup completed successfully!');
    console.log(`   Total records deleted: ${
      searchLogs.count + photos.count + preferences.count + 
      horoscopes.count + families.count + professionals.count + 
      educations.count + castes.count + personals.count + 
      users.count
    }`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
