import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzePasswordHistory() {
  const userId = '1a89ca75-de89-43f6-80c9-85f2628f3df7';
  
  console.log('=== ANALYZING PASSWORD CHANGE PATTERN ===\n');
  
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      mobile_number: true,
      password_hash: true,
      created_at: true,
      updated_at: true
    }
  });
  
  console.log('User Details:');
  console.log(`  Name: ${user.full_name}`);
  console.log(`  Mobile: ${user.mobile_number}`);
  console.log(`  Created: ${user.created_at}`);
  console.log(`  Last Updated: ${user.updated_at}`);
  console.log(`\nCurrent Hash: ${user.password_hash}`);
  
  // Check timestamps
  const now = new Date();
  const updated = new Date(user.updated_at);
  const minutesAgo = Math.floor((now - updated) / 1000 / 60);
  
  console.log(`\n  Updated ${minutesAgo} minutes ago (${user.updated_at})`);
  
  // Check audit logs for ANY changes to this user
  console.log('\n=== USER-RELATED AUDIT LOGS (Last 20) ===\n');
  const userAuditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { actor_id: userId },
        { target_user_id: userId }
      ]
    },
    orderBy: { created_at: 'desc' },
    take: 20,
    select: {
      id: true,
      action: true,
      action_type: true,
      created_at: true,
      metadata: true
    }
  });
  
  console.log(`Found ${userAuditLogs.length} audit logs related to this user:`);
  userAuditLogs.forEach(log => {
    console.log(`  ${log.created_at.toISOString()} - ${log.action} (${log.action_type})`);
  });
  
  // Check if password changed around the same time as any system events
  console.log('\n=== CHECKING FOR SYSTEM EVENTS NEAR PASSWORD CHANGE ===\n');
  const updatedTime = new Date(user.updated_at);
  const fiveMinBefore = new Date(updatedTime.getTime() - 5 * 60 * 1000);
  const fiveMinAfter = new Date(updatedTime.getTime() + 5 * 60 * 1000);
  
  const nearbyLogs = await prisma.auditLog.findMany({
    where: {
      created_at: {
        gte: fiveMinBefore,
        lte: fiveMinAfter
      }
    },
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      action: true,
      actor_id: true,
      created_at: true
    }
  });
  
  console.log(`Events within 5 minutes of password change (${updatedTime.toISOString()}):`);
  if (nearbyLogs.length > 0) {
    nearbyLogs.forEach(log => {
      console.log(`  ${log.created_at.toISOString()} - ${log.action} by ${log.actor_id}`);
    });
  } else {
    console.log('  No audit logs found in this time window');
  }
  
  await prisma.$disconnect();
}

analyzePasswordHistory().catch(console.error);
