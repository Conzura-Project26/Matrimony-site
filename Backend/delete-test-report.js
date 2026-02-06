import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestReport() {
  const reporterId = '4ee61de1-7075-49a1-9cc7-a86b7c5a8ce6'; // TEST_USER (Amogh)
  const reportedUserId = '6be3a9da-541e-40c8-ab27-d8b07ad38216'; // TEST_USER_2
  
  console.log('Checking for existing reports...\n');
  
  // Find existing reports
  const existingReports = await prisma.userReport.findMany({
    where: {
      reported_by: reporterId,
      reported_user: reportedUserId
    },
    select: {
      id: true,
      category: true,
      status: true,
      created_at: true
    }
  });
  
  console.log(`Found ${existingReports.length} report(s):`);
  console.log(JSON.stringify(existingReports, null, 2));
  
  if (existingReports.length > 0) {
    console.log('\nDeleting reports...');
    
    const result = await prisma.userReport.deleteMany({
      where: {
        reported_by: reporterId,
        reported_user: reportedUserId
      }
    });
    
    console.log(`✅ Deleted ${result.count} report(s)`);
  } else {
    console.log('\n✅ No reports to delete');
  }
  
  await prisma.$disconnect();
}

deleteTestReport().catch(console.error);
