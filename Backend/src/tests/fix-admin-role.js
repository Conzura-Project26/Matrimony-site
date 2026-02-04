/**
 * Quick script to check and update user role to ADMIN
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixAdminRole() {
  const mobile = '9380245433';
  
  console.log(`\n🔍 Checking user: ${mobile}\n`);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { mobile_number: mobile },
    include: {
      role: true
    }
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log(`User ID: ${user.id}`);
  console.log(`Name: ${user.full_name}`);
  console.log(`Current Role: ${user.role.role_name}`);
  console.log(`Role ID: ${user.role_id}`);

  // Get ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { role_name: 'ADMIN' }
  });

  if (!adminRole) {
    console.log('\n❌ ADMIN role not found in database!');
    process.exit(1);
  }

  console.log(`\n✅ ADMIN Role ID: ${adminRole.id}`);

  // Update if needed
  if (user.role.role_name !== 'ADMIN') {
    console.log(`\n🔄 Updating user role from ${user.role.role_name} to ADMIN...\n`);
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role_id: adminRole.id
      },
      include: {
        role: true
      }
    });

    console.log(`✅ SUCCESS! User role updated to: ${updated.role.role_name}`);
  } else {
    console.log(`\n✅ User already has ADMIN role!`);
  }

  await prisma.$disconnect();
}

fixAdminRole().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
