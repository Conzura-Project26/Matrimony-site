/**
 * Debug Test - Check what's filtering out profiles
 */

import prisma from '../config/prisma.js';

const TEST_USER_ID = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

async function debugFilters() {
  console.log('🔍 Debugging Profile Filters\n');
  console.log('='.repeat(70));
  
  try {
    // 1. Check total users
    const totalUsers = await prisma.user.count();
    console.log(`\n1️⃣ Total Users in DB: ${totalUsers}`);
    
    // 2. Check active users
    const activeUsers = await prisma.user.count({
      where: { is_active: true }
    });
    console.log(`2️⃣ Active Users: ${activeUsers}`);
    
    // 3. Check users with 60%+ completion
    const completedUsers = await prisma.user.count({
      where: {
        is_active: true,
        profile_completion_percentage: { gte: 60 }
      }
    });
    console.log(`3️⃣ Users with ≥60% completion: ${completedUsers}`);
    
    // 4. Check users with approved photos
    const usersWithPhotos = await prisma.user.count({
      where: {
        is_active: true,
        profile_completion_percentage: { gte: 60 },
        photos: {
          some: {
            is_approved: true
          }
        }
      }
    });
    console.log(`4️⃣ Users with approved photos: ${usersWithPhotos}`);
    
    // 5. Check users excluding self
    const usersExcludingSelf = await prisma.user.count({
      where: {
        AND: [
          { id: { not: TEST_USER_ID } },
          { is_active: true },
          { profile_completion_percentage: { gte: 60 } },
          {
            photos: {
              some: {
                is_approved: true
              }
            }
          }
        ]
      }
    });
    console.log(`5️⃣ Users after excluding self: ${usersExcludingSelf}`);
    
    // 6. Get current user's gender
    const currentUser = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      select: { gender: true }
    });
    const oppositeGender = currentUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
    console.log(`\n6️⃣ Your gender: ${currentUser.gender}`);
    console.log(`   Opposite gender filter: ${oppositeGender}`);
    
    // 7. Check with gender filter
    const withGenderFilter = await prisma.user.count({
      where: {
        AND: [
          { id: { not: TEST_USER_ID } },
          { is_active: true },
          { profile_completion_percentage: { gte: 60 } },
          { gender: oppositeGender },
          {
            photos: {
              some: {
                is_approved: true
              }
            }
          }
        ]
      }
    });
    console.log(`7️⃣ With gender filter (${oppositeGender}): ${withGenderFilter}`);
    
    // 8. List all users with their details
    console.log('\n' + '='.repeat(70));
    console.log('📋 All Users in Database:\n');
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        gender: true,
        is_active: true,
        profile_completion_percentage: true,
        photos: {
          select: {
            is_approved: true,
            is_primary: true
          }
        }
      }
    });
    
    allUsers.forEach((user, index) => {
      const approvedPhotos = user.photos.filter(p => p.is_approved).length;
      const isSelf = user.id === TEST_USER_ID;
      
      console.log(`${index + 1}. ${user.full_name}`);
      console.log(`   ID: ${user.id} ${isSelf ? '(YOU)' : ''}`);
      console.log(`   Gender: ${user.gender}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Completion: ${user.profile_completion_percentage}%`);
      console.log(`   Approved Photos: ${approvedPhotos}`);
      
      // Check what filters are failing
      const failedFilters = [];
      if (!user.is_active) failedFilters.push('❌ Not active');
      if (user.profile_completion_percentage < 60) failedFilters.push('❌ <60% completion');
      if (approvedPhotos === 0) failedFilters.push('❌ No approved photos');
      if (isSelf) failedFilters.push('⚠️  Is current user');
      if (user.gender === currentUser.gender) failedFilters.push('⚠️  Same gender');
      
      if (failedFilters.length > 0) {
        console.log(`   ${failedFilters.join(', ')}`);
      } else {
        console.log(`   ✅ PASSES ALL FILTERS`);
      }
      console.log('');
    });
    
    // 9. Check if photos table has data
    console.log('='.repeat(70));
    const totalPhotos = await prisma.userPhoto.count();
    const approvedPhotos = await prisma.userPhoto.count({ where: { is_approved: true } });
    console.log(`\n📸 Photos in Database:`);
    console.log(`   Total: ${totalPhotos}`);
    console.log(`   Approved: ${approvedPhotos}`);
    
    // 10. Sample a few users with photos
    if (totalPhotos > 0) {
      console.log('\n📋 Photo Breakdown by User:');
      const usersWithPhotos = await prisma.user.findMany({
        where: {
          photos: {
            some: {}
          }
        },
        select: {
          full_name: true,
          photos: {
            select: {
              is_approved: true,
              is_primary: true
            }
          }
        },
        take: 10
      });
      
      usersWithPhotos.forEach(user => {
        const approved = user.photos.filter(p => p.is_approved).length;
        const total = user.photos.length;
        console.log(`   ${user.full_name}: ${approved}/${total} approved`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugFilters();
