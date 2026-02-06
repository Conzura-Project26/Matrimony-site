import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function investigatePassword() {
  const userId = '1a89ca75-de89-43f6-80c9-85f2628f3df7';
  
  console.log('=== PASSWORD INVESTIGATION ===\n');
  
  // Get current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      mobile_number: true,
      password_hash: true,
      updated_at: true
    }
  });
  
  console.log('User:', user.full_name);
  console.log('Mobile:', user.mobile_number);
  console.log('Last Updated:', user.updated_at);
  console.log('\nCurrent password hash:', user.password_hash);
  console.log('Hash length:', user.password_hash.length);
  
  // Test against known passwords
  const testPasswords = [
    'Harsha@2004',
    'Test@123',
    'Test@1234'
  ];
  
  console.log('\n=== TESTING PASSWORDS ===\n');
  for (const pwd of testPasswords) {
    const matches = await bcrypt.compare(pwd, user.password_hash);
    console.log(`${pwd.padEnd(15)} : ${matches ? '✅ MATCH' : '❌ No match'}`);
  }
  
  // Check recent password changes in audit logs
  console.log('\n=== RECENT PASSWORD CHANGES ===\n');
  const passwordChanges = await prisma.auditLog.findMany({
    where: {
      actor_id: userId,
      action: {
        in: ['PASSWORD_CHANGED', 'PASSWORD_RESET_SUCCESS']
      }
    },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      id: true,
      action: true,
      created_at: true,
      metadata: true
    }
  });
  
  if (passwordChanges.length > 0) {
    console.log('Recent password changes:');
    console.log(JSON.stringify(passwordChanges, null, 2));
  } else {
    console.log('No password changes found in audit logs');
  }
  
  await prisma.$disconnect();
}

investigatePassword().catch(console.error);
