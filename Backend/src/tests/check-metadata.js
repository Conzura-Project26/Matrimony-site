import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function checkMetadata() {
  try {
    const log = await prisma.auditLog.findFirst({
      where: {
        action: 'PERSONAL_DETAILS_UPDATED',
        actor_id: '1a89ca75-de89-43f6-80c9-85f2628f3df7'
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (log) {
      console.log('✅ Found log:');
      console.log('   ID:', log.id);
      console.log('   Action:', log.action);
      console.log('   Metadata type:', typeof log.metadata);
      console.log('   Metadata:', JSON.stringify(log.metadata, null, 2));
      
      if (log.metadata && log.metadata.fields_updated) {
        console.log('\n   fields_updated type:', typeof log.metadata.fields_updated);
        console.log('   Is array?:', Array.isArray(log.metadata.fields_updated));
        console.log('   Value:', log.metadata.fields_updated);
      }
    } else {
      console.log('❌ No PERSONAL_DETAILS_UPDATED log found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMetadata();
