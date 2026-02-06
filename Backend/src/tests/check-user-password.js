import pkg from '@prisma/client';
import bcrypt from 'bcrypt';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { mobile_number: '9380245433' }
    });
    
    if (!user) {
      console.log('❌ User not found with mobile_number 9380245433');
      return;
    }
    
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.full_name);
    console.log('   Mobile:', user.mobile_number);
    console.log('   Email:', user.email);
    console.log('   Is Active:', user.is_active);
    console.log('   Password Hash:', user.password_hash);
    console.log('   Hash length:', user.password_hash?.length);
    
    // Test password from test file
    const testPassword = 'Harsha@2004';
    
    console.log('\n🔍 Testing password: ' + testPassword);
    
    if (user.password_hash) {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log('   Password match result:', isValid ? '✅ VALID' : '❌ INVALID');
      
      if (!isValid) {
        console.log('\n⚠️  The password "Harsha@2004" does NOT match the stored hash!');
        console.log('   Possible reasons:');
        console.log('   1. Password was changed in database');
        console.log('   2. Test file has wrong password');
        console.log('   3. Password hash was corrupted');
        
        // Try to generate a new hash for this password
        console.log('\n🔧 Generating new hash for "Harsha@2004":');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('   New hash:', newHash);
      } else {
        console.log('\n✅ Password is correct! Something else is wrong.');
      }
    } else {
      console.log('❌ User has no password set!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPassword();
