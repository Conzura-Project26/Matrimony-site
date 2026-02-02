import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        profile_id: {
          startsWith: 'MAT'
        }
      },
      select: {
        mobile_number: true,
        profile_id: true,
      },
      take: 5,
      orderBy: { profile_id: 'asc' }
    });

    console.log('First 5 seeded test users:');
    users.forEach(u => {
      console.log(`  ${u.profile_id}: ${u.mobile_number}`);
    });

    // Also check if we can find by mobile number
    const testUser = await prisma.user.findUnique({
      where: { mobile_number: '9000000001' },
      select: { id: true, mobile_number: true, profile_id: true }
    });

    console.log('\nLooking for mobile 9000000001:');
    if (testUser) {
      console.log('  ✅ Found:', testUser);
    } else {
      console.log('  ❌ Not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
