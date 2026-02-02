import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyData() {
  console.log('\n🔍 Database Verification:\n');
  
  // Count by physical_status
  const normal = await prisma.userPersonalDetails.count({
    where: { physical_status: 'Normal' },
  });
  
  const challenged = await prisma.userPersonalDetails.count({
    where: { physical_status: 'Physically Challenged' },
  });
  
  const nullStatus = await prisma.userPersonalDetails.count({
    where: { physical_status: null },
  });
  
  console.log(`Physical Status Counts:`);
  console.log(`  - Normal: ${normal}`);
  console.log(`  - Physically Challenged: ${challenged}`);
  console.log(`  - NULL: ${nullStatus}\n`);
  
  // Get users with Physically Challenged status that meet auto-filters
  const challengedUsers = await prisma.user.findMany({
    where: {
      is_active: true,
      profile_completion_percentage: { gte: 60 },
      personal_details: {
        physical_status: 'Physically Challenged',
      },
      photos: {
        some: { is_approved: true },
      },
    },
    include: {
      personal_details: true,
    },
  });
  
  console.log(`Users with "Physically Challenged" meeting auto-filters: ${challengedUsers.length}`);
  challengedUsers.forEach(user => {
    console.log(`  - ${user.full_name}: ${user.personal_details.physical_status}`);
  });
  
  await prisma.$disconnect();
}

verifyData();
