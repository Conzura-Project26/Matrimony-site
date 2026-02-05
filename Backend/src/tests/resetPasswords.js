import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    console.log('🔄 Resetting passwords for test users...\n');
    
    // Hash the passwords
    const adminHash = await bcrypt.hash('Kshitij@2004', 10);
    const moderatorHash = await bcrypt.hash('Rahul@2004', 10);
    const userHash = await bcrypt.hash('Harsha@2004', 10);
    
    // Update ADMIN user
    const admin = await prisma.user.update({
      where: { mobile_number: '8073550468' },
      data: { password_hash: adminHash },
      select: { mobile_number: true, full_name: true, role: { select: { role_name: true } } }
    });
    console.log(`✓ ADMIN updated: ${admin.full_name} (${admin.mobile_number})`);
    
    // Update MODERATOR user
    const moderator = await prisma.user.update({
      where: { mobile_number: '9902964782' },
      data: { password_hash: moderatorHash },
      select: { mobile_number: true, full_name: true, role: { select: { role_name: true } } }
    });
    console.log(`✓ MODERATOR updated: ${moderator.full_name} (${moderator.mobile_number})`);
    
    // Update USER
    const user = await prisma.user.update({
      where: { mobile_number: '9380245433' },
      data: { password_hash: userHash },
      select: { mobile_number: true, full_name: true, role: { select: { role_name: true } } }
    });
    console.log(`✓ USER updated: ${user.full_name} (${user.mobile_number})`);
    
    console.log('\n✅ All passwords reset successfully!');
    console.log('\nCredentials:');
    console.log('ADMIN:     8073550468 / Kshitij@2004');
    console.log('MODERATOR: 9902964782 / Rahul@2004');
    console.log('USER:      9380245433 / Harsha@2004');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();
