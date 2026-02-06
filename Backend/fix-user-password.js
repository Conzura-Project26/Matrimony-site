import pkg from '@prisma/client';
import bcrypt from 'bcrypt';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function fixUserPassword() {
  try {
    const userId = '1a89ca75-de89-43f6-80c9-85f2628f3df7';
    const newPassword = 'Harsha@2004';
    
    console.log('🔧 Updating password for user:', userId);
    console.log('   New password:', newPassword);
    
    // Generate hash for the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('   Generated hash:', passwordHash);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password_hash: passwordHash }
    });
    
    console.log('\n✅ Password updated successfully!');
    console.log('   User:', updatedUser.full_name);
    console.log('   Mobile:', updatedUser.mobile_number);
    
    // Verify the password works
    const isValid = await bcrypt.compare(newPassword, updatedUser.password_hash);
    console.log('\n🔍 Verification:', isValid ? '✅ Password matches!' : '❌ Password still incorrect');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPassword();
