import prisma from './src/config/prisma.js';

const TEST_USER_ID = '7af0cc53-de82-48c7-8711-18e8dea6cb9c';

async function cleanup() {
  try {
    await prisma.userProfessionalDetails.delete({
      where: { user_id: TEST_USER_ID }
    });
    console.log('✅ Professional details deleted for user:', TEST_USER_ID);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('⚠️  No professional details found for user:', TEST_USER_ID);
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

cleanup();
