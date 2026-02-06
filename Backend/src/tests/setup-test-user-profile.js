import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupUserProfile() {
  const userId = '4ee61de1-7075-49a1-9cc7-a86b7c5a8ce6'; // Amogh's user ID
  
  console.log('Setting up profile for D Amogha Hande...\n');
  
  try {
    // Create personal details
    const personalDetails = await prisma.userPersonalDetails.upsert({
      where: { user_id: userId },
      update: {
        marital_status: 'Never Married'
      },
      create: {
        user_id: userId,
        marital_status: 'Never Married'
      }
    });
    console.log('✅ Personal details created');
    
    // Create caste details
    const casteDetails = await prisma.userCasteDetails.upsert({
      where: { user_id: userId },
      update: {
        religion_id: 1,
        caste_id: 1
      },
      create: {
        user_id: userId,
        religion_id: 1,
        caste_id: 1
      }
    });
    console.log('✅ Caste details created');
    
    console.log('\n✅ Profile setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupUserProfile();
