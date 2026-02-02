import prisma from '../config/prisma.js';

async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        is_active: true,
        gender: 'Female',
        id: {
          not: 'f6ab094e-2900-497f-bb0d-000cc93a25db' // Exclude test user
        }
      },
      select: {
        id: true,
        full_name: true,
        gender: true,
        profile_id: true
      },
      take: 5
    });
    
    console.log('Target users found:', users.length);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.full_name} (${user.profile_id})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Gender: ${user.gender}`);
    });
    
    if (users.length > 0) {
      console.log('\n✅ Use this as TEST_TARGET_USER_ID:', users[0].id);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

getUsers();
