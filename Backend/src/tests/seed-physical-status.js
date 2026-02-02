import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addPhysicalStatusData() {
  try {
    console.log('\n🚀 Adding physical_status data to test profiles...\n');

    // Find female users with approved photos
    const femaleUsers = await prisma.user.findMany({
      where: {
        gender: 'Female',
        is_active: true,
        personal_details: { isNot: null },
        photos: {
          some: { is_approved: true },
        },
      },
      include: {
        personal_details: true,
      },
      take: 5,
    });

    console.log(`📊 Found ${femaleUsers.length} female users to update\n`);

    let updated = 0;
    const statuses = ['Normal', 'Physically Challenged'];

    for (let i = 0; i < femaleUsers.length; i++) {
      const user = femaleUsers[i];
      const status = i < 3 ? 'Normal' : 'Physically Challenged';
      
      await prisma.userPersonalDetails.update({
        where: { user_id: user.id },
        data: { physical_status: status },
      });

      console.log(`✅ Updated user ${user.id}: physical_status = "${status}"`);
      updated++;
    }

    console.log(`\n✨ Updated ${updated} profiles with physical_status data\n`);

    // Verify
    console.log('🔍 Verification:');
    const normalCount = await prisma.userPersonalDetails.count({
      where: { physical_status: 'Normal' },
    });
    const challengedCount = await prisma.userPersonalDetails.count({
      where: { physical_status: 'Physically Challenged' },
    });

    console.log(`   - Normal: ${normalCount} profiles`);
    console.log(`   - Physically Challenged: ${challengedCount} profiles\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPhysicalStatusData();
