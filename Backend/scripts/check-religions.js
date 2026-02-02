import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReligions() {
  const religions = await prisma.religion.findMany({ take: 5 });
  console.log('Religions:', religions);
  
  const castes = await prisma.caste.findMany({ take: 5 });
  console.log('Castes:', castes);
  
  await prisma.$disconnect();
}

checkReligions();
