import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReport() {
  const report = await prisma.userReport.findUnique({
    where: { id: 7 },
    select: {
      id: true,
      category: true,
      status: true,
      created_at: true,
      reported_by: true,
      reported_user: true
    }
  });
  
  console.log('Report 7 details:');
  console.log(JSON.stringify(report, null, 2));
  
  await prisma.$disconnect();
}

checkReport().catch(console.error);
