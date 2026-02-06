import prisma from '../src/config/prisma.js';

async function resetFeatureUsage() {
  console.log('\n🔄 Resetting all feature usage counts...\n');

  try {
    // Delete all feature usage records
    const result = await prisma.featureUsage.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} feature usage records`);
    console.log('✅ All users can now use features from scratch\n');
    
  } catch (error) {
    console.error('❌ Error resetting feature usage:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetFeatureUsage();
