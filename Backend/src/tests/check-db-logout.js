import prisma from '../src/config/prisma.js';

async function checkLogoutLogs() {
  console.log('=== CHECKING LOGOUT LOGS ===\n');
  
  // Check for LOGOUT action
  const logoutLogs = await prisma.auditLog.findMany({
    where: { action: 'LOGOUT' },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { 
      id: true, 
      action: true, 
      action_type: true, 
      actor_id: true, 
      metadata: true, 
      created_at: true 
    }
  });
  
  console.log('LOGOUT logs found:', logoutLogs.length);
  if (logoutLogs.length > 0) {
    console.log(JSON.stringify(logoutLogs, null, 2));
  }
  
  // Check recent AUTH_EVENT logs
  console.log('\n=== RECENT AUTH_EVENT LOGS ===\n');
  const recentAuthLogs = await prisma.auditLog.findMany({
    where: { action_type: 'AUTH_EVENT' },
    orderBy: { created_at: 'desc' },
    take: 10,
    select: { 
      id: true, 
      action: true, 
      action_type: true, 
      created_at: true 
    }
  });
  
  console.log('Recent AUTH_EVENT logs:');
  console.log(JSON.stringify(recentAuthLogs, null, 2));
  
  // Count all action types
  console.log('\n=== ACTION COUNTS ===\n');
  const allLogs = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: true,
    orderBy: {
      _count: {
        action: 'desc'
      }
    }
  });
  
  console.log('Action counts:');
  allLogs.forEach(log => {
    console.log(`  ${log.action}: ${log._count}`);
  });
  
  await prisma.$disconnect();
}

checkLogoutLogs().catch(console.error);
