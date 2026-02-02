/**
 * Seed Test Photos for Female Users
 * 
 * This script adds approved photos to female users with 60%+ completion
 * to enable testing of the profile listing feature.
 */

import prisma from '../config/prisma.js';

// Sample photo URLs (using placeholder services)
const SAMPLE_PHOTO_URLS = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/women/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'https://randomuser.me/api/portraits/women/9.jpg',
  'https://randomuser.me/api/portraits/women/10.jpg',
  'https://randomuser.me/api/portraits/women/11.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
  'https://randomuser.me/api/portraits/women/13.jpg',
  'https://randomuser.me/api/portraits/women/14.jpg',
  'https://randomuser.me/api/portraits/women/15.jpg',
  'https://randomuser.me/api/portraits/women/16.jpg',
  'https://randomuser.me/api/portraits/women/17.jpg',
  'https://randomuser.me/api/portraits/women/18.jpg',
  'https://randomuser.me/api/portraits/women/19.jpg',
  'https://randomuser.me/api/portraits/women/20.jpg',
];

async function seedPhotos() {
  console.log('📸 Seeding Test Photos for Female Users');
  console.log('='.repeat(70) + '\n');

  try {
    // Find female users with 60%+ completion who don't have approved photos
    const femaleUsers = await prisma.user.findMany({
      where: {
        gender: 'Female',
        profile_completion_percentage: { gte: 60 },
      },
      include: {
        photos: true,
      },
    });

    console.log(`Found ${femaleUsers.length} female users with ≥60% completion\n`);

    if (femaleUsers.length === 0) {
      console.log('❌ No female users found with 60%+ completion');
      console.log('   Please ensure female users exist in the database first.\n');
      return;
    }

    let photosAdded = 0;
    let usersUpdated = 0;

    for (let i = 0; i < femaleUsers.length; i++) {
      const user = femaleUsers[i];
      const hasApprovedPhotos = user.photos.some(p => p.is_approved);

      if (hasApprovedPhotos) {
        console.log(`⏭️  ${user.full_name} - Already has approved photos, skipping`);
        continue;
      }

      console.log(`\n📸 Adding photos for: ${user.full_name}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Current photos: ${user.photos.length}`);

      // Add 2-3 photos per user
      const numPhotos = Math.floor(Math.random() * 2) + 2; // 2 or 3 photos
      const userPhotos = [];

      for (let j = 0; j < numPhotos; j++) {
        const photoUrl = SAMPLE_PHOTO_URLS[(i * 3 + j) % SAMPLE_PHOTO_URLS.length];
        const isPrimary = j === 0; // First photo is primary

        const photo = await prisma.userPhoto.create({
          data: {
            user_id: user.id,
            photo_url: photoUrl,
            is_approved: true,
            approved_by: user.id, // Self-approved for testing
            is_primary: isPrimary,
            visibility: 'PUBLIC',
          },
        });

        userPhotos.push(photo);
        photosAdded++;
        
        console.log(`   ✅ Added photo ${j + 1}: ${isPrimary ? '⭐ PRIMARY' : ''}`);
      }

      usersUpdated++;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ SEEDING COMPLETE\n');
    console.log(`📊 Summary:`);
    console.log(`   Users updated: ${usersUpdated}`);
    console.log(`   Photos added: ${photosAdded}`);
    console.log(`   Average photos per user: ${(photosAdded / usersUpdated).toFixed(1)}`);

    // Verify results
    console.log('\n🔍 Verification:');
    const usersWithApprovedPhotos = await prisma.user.count({
      where: {
        gender: 'Female',
        profile_completion_percentage: { gte: 60 },
        photos: {
          some: {
            is_approved: true,
          },
        },
      },
    });

    console.log(`   Female users with 60%+ completion and approved photos: ${usersWithApprovedPhotos}`);

    // Show sample profiles that will now appear
    console.log('\n👤 Sample profiles that will now appear in listing:');
    const sampleProfiles = await prisma.user.findMany({
      where: {
        gender: 'Female',
        profile_completion_percentage: { gte: 60 },
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
          select: { is_primary: true },
        },
      },
      take: 5,
    });

    sampleProfiles.forEach((profile, idx) => {
      console.log(`   ${idx + 1}. ${profile.full_name}`);
      console.log(`      Completion: ${profile.profile_completion_percentage}%`);
      console.log(`      Approved Photos: ${profile.photos.length}`);
    });

    console.log('\n🎉 You can now test the profile listing feature!');
    console.log('   Run: node src/tests/task3.1-verification.js\n');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedPhotos();
