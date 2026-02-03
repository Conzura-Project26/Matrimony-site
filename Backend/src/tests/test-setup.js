import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getTestUsers() {
  const interests = await prisma.interest.findMany({
    where: { status: 'ACCEPTED' },
    include: {
      sender: { select: { id: true, full_name: true, mobile_number: true } },
      receiver: { select: { id: true, full_name: true, mobile_number: true } }
    },
    take: 2
  });

  console.log('=== TEST USERS WITH ACCEPTED INTERESTS ===\n');
  interests.forEach((i, idx) => {
    console.log(`${idx + 1}. Sender: ${i.sender.full_name}`);
    console.log(`   ID: ${i.sender.id}`);
    console.log(`   Mobile: ${i.sender.mobile_number}`);
    console.log(`   Receiver: ${i.receiver.full_name}`);
    console.log(`   ID: ${i.receiver.id}`);
    console.log(`   Mobile: ${i.receiver.mobile_number}\n`);
  });

  await prisma.$disconnect();
}

getTestUsers();
