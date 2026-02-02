import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedMaleProfiles() {
  try {
    console.log('\n🚀 Starting Male Profile Seeding...\n');

    // Find existing male users (excluding the logged-in test user)
    const maleUsers = await prisma.user.findMany({
      where: {
        gender: 'Male',
        mobile_number: { not: '9380245433' }, // Exclude test user
      },
      include: {
        personal_details: true,
        photos: true,
      },
    });

    console.log(`📊 Found ${maleUsers.length} male users (excluding test user)\n`);

    let updatedCount = 0;
    let photosAdded = 0;

    for (const user of maleUsers) {
      // Calculate profile completion
      const completion = await calculateCompletion(user.id);
      
      if (completion < 60) {
        console.log(`⏭️  Skipping user ${user.id} - completion ${completion}% (need 60%+)`);
        continue;
      }

      // Check if user already has approved photos
      const hasApprovedPhotos = user.photos.some(p => p.is_approved === true);
      if (hasApprovedPhotos) {
        console.log(`✅ User ${user.id} already has approved photos`);
        updatedCount++;
        continue;
      }

      // Add 2-3 approved photos for this user
      const numPhotos = Math.floor(Math.random() * 2) + 2; // 2 or 3 photos
      const photoUrls = [
        'https://randomuser.me/api/portraits/men/1.jpg',
        'https://randomuser.me/api/portraits/men/2.jpg',
        'https://randomuser.me/api/portraits/men/3.jpg',
        'https://randomuser.me/api/portraits/men/4.jpg',
        'https://randomuser.me/api/portraits/men/5.jpg',
        'https://randomuser.me/api/portraits/men/6.jpg',
        'https://randomuser.me/api/portraits/men/7.jpg',
        'https://randomuser.me/api/portraits/men/8.jpg',
      ];

      // Shuffle and pick photos
      const selectedPhotos = photoUrls.sort(() => 0.5 - Math.random()).slice(0, numPhotos);

      for (let i = 0; i < selectedPhotos.length; i++) {
        await prisma.userPhoto.create({
          data: {
            user_id: user.id,
            photo_url: selectedPhotos[i],
            is_approved: true,
            is_primary: i === 0, // First photo is primary
          },
        });
        photosAdded++;
      }

      console.log(`✅ Added ${numPhotos} approved photos for user ${user.id} (completion: ${completion}%)`);
      updatedCount++;
    }

    console.log(`\n✨ Seeding Complete!`);
    console.log(`   - Male users updated: ${updatedCount}`);
    console.log(`   - Photos added: ${photosAdded}\n`);

    // Verify results
    console.log('🔍 Verification:');
    const maleUsersWithPhotos = await prisma.user.findMany({
      where: {
        gender: 'Male',
        mobile_number: { not: '9380245433' },
        is_active: true,
        photos: {
          some: {
            is_approved: true,
          },
        },
      },
      include: {
        photos: {
          where: { is_approved: true },
        },
      },
    });

    console.log(`   - Male users with approved photos: ${maleUsersWithPhotos.length}`);
    for (const user of maleUsersWithPhotos) {
      const completion = await calculateCompletion(user.id);
      console.log(`     • User ${user.id}: ${user.photos.length} photos, ${completion}% completion`);
    }

  } catch (error) {
    console.error('❌ Error seeding male profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function calculateCompletion(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      personal_details: true,
      caste_details: true,
      education_details: true,
      professional_details: true,
      horoscope_details: true,
      partner_preferences: true,
      photos: true,
    },
  });

  if (!user) return 0;

  let completed = 0;
  const total = 7;

  // Basic info (always present)
  completed++;

  // Personal details
  if (user.personal_details) completed++;

  // Caste details
  if (user.caste_details) completed++;

  // Education details
  if (user.education_details) completed++;

  // Professional details
  if (user.professional_details) completed++;

  // Horoscope details
  if (user.horoscope_details) completed++;

  // Partner preferences
  if (user.partner_preferences) completed++;

  return Math.round((completed / total) * 100);
}

seedMaleProfiles();
