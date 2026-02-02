import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedEdgeCases() {
  try {
    console.log('\n🚀 Seeding Edge Cases for Filter Testing...\n');

    // 1. Create an INACTIVE user with approved photos (should be filtered out)
    console.log('1️⃣ Creating inactive user...');
    const inactiveUser = await prisma.user.create({
      data: {
        mobile_number: `999${Math.floor(Math.random() * 10000000)}`,
        password_hash: '$2b$10$dummy', // Dummy hash
        full_name: 'Inactive User Test',
        gender: 'Female',
        date_of_birth: new Date('1995-01-01'),
        role_id: 2, // Regular user
        profile_created_by: 'SELF',
        is_active: false, // INACTIVE
        is_mobile_verified: true,
        is_profile_verified: true,
      },
    });

    // Add personal details for completion
    await prisma.userPersonalDetails.create({
      data: {
        user_id: inactiveUser.id,
        marital_status: 'Never Married',
        height_cm: 165,
      },
    });

    // Add approved photo
    await prisma.userPhoto.create({
      data: {
        user_id: inactiveUser.id,
        photo_url: 'https://randomuser.me/api/portraits/women/90.jpg',
        is_approved: true,
        is_primary: true,
      },
    });

    console.log(`   ✅ Created inactive user: ${inactiveUser.id}\n`);

    // 2. Create users with PENDING/REJECTED photos (should be filtered out)
    console.log('2️⃣ Creating users with non-approved photos...');
    
    const pendingUser = await prisma.user.create({
      data: {
        mobile_number: `998${Math.floor(Math.random() * 10000000)}`,
        password_hash: '$2b$10$dummy',
        full_name: 'Pending Photo User',
        gender: 'Female',
        date_of_birth: new Date('1996-01-01'),
        role_id: 2,
        profile_created_by: 'SELF',
        is_active: true,
        is_mobile_verified: true,
        is_profile_verified: true,
      },
    });

    await prisma.userPersonalDetails.create({
      data: {
        user_id: pendingUser.id,
        marital_status: 'Never Married',
        height_cm: 160,
      },
    });

    await prisma.userPhoto.create({
      data: {
        user_id: pendingUser.id,
        photo_url: 'https://randomuser.me/api/portraits/women/91.jpg',
        is_approved: false, // NOT APPROVED
        is_primary: true,
      },
    });

    console.log(`   ✅ Created user with PENDING photo: ${pendingUser.id}`);

    const rejectedUser = await prisma.user.create({
      data: {
        mobile_number: `997${Math.floor(Math.random() * 10000000)}`,
        password_hash: '$2b$10$dummy',
        full_name: 'Rejected Photo User',
        gender: 'Female',
        date_of_birth: new Date('1997-01-01'),
        role_id: 2,
        profile_created_by: 'SELF',
        is_active: true,
        is_mobile_verified: true,
        is_profile_verified: true,
      },
    });

    await prisma.userPersonalDetails.create({
      data: {
        user_id: rejectedUser.id,
        marital_status: 'Never Married',
        height_cm: 162,
      },
    });

    await prisma.userPhoto.create({
      data: {
        user_id: rejectedUser.id,
        photo_url: 'https://randomuser.me/api/portraits/women/92.jpg',
        is_approved: false, // NOT APPROVED (REJECTED)
        is_primary: true,
      },
    });

    console.log(`   ✅ Created user with REJECTED photo: ${rejectedUser.id}\n`);

    // 3. Verify edge cases
    console.log('🔍 Verification:');
    
    const inactiveCount = await prisma.user.count({
      where: { is_active: false },
    });
    console.log(`   - Inactive users in DB: ${inactiveCount}`);

    const pendingPhotoCount = await prisma.userPhoto.count({
      where: { is_approved: false },
    });
    console.log(`   - Photos not approved: ${pendingPhotoCount}`);

    const approvedPhotoCount = await prisma.userPhoto.count({
      where: { is_approved: true },
    });
    console.log(`   - Photos approved: ${approvedPhotoCount}`);

    const usersWithoutApprovedPhotos = await prisma.user.count({
      where: {
        is_active: true,
        photos: {
          none: {
            is_approved: true,
          },
        },
      },
    });
    console.log(`   - Active users WITHOUT approved photos: ${usersWithoutApprovedPhotos}\n`);

    console.log('✨ Edge case seeding complete!\n');

  } catch (error) {
    console.error('❌ Error seeding edge cases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEdgeCases();
