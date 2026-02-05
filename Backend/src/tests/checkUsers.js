import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        mobile_number: true,
        email: true,
        full_name: true,
        role: {
          select: {
            role_name: true,
          },
        },
      },
      take: 20,
    });

    console.log('Existing users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    // Check for specific phone numbers
    console.log('\n\nChecking for specific users:');
    const phones = ['8073550468', '+918073550468', '9902964782', '+919902964782', '9380245433', '+919380245433'];
    
    for (const phone of phones) {
      const user = await prisma.user.findUnique({
        where: { mobile_number: phone },
        select: { mobile_number: true, full_name: true, role: { select: { role_name: true } } },
      });
      console.log(`${phone}: ${user ? `Found - ${user.full_name} (${user.role.role_name})` : 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
