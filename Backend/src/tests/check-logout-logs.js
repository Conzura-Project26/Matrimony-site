import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const count = await prisma.auditLog.count({ 
  where: { action: 'LOGOUT' } 
});

console.log('Current LOGOUT audit logs:', count);
await prisma.$disconnect();
