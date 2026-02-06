import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAndUpdate() {
  console.log('🔍 Debugging subscription data...\n');
  
  try {
    // First, check what we have
    const subs = await prisma.subscription.findMany({
      where: {
        plan_name: null
      },
      include: {
        plan: true
      },
      take: 5
    });
    
    console.log('Sample subscriptions with NULL plan_name:');
    subs.forEach(sub => {
      console.log(`\nSubscription ID: ${sub.id}`);
      console.log(`  user_id: ${sub.user_id}`);
      console.log(`  plan_id: ${sub.plan_id}`);
      console.log(`  plan object:`, sub.plan ? {
        id: sub.plan.id,
        name: sub.plan.name,
        code: sub.plan.code
      } : 'NULL');
    });
    
    // Now try a direct SQL-style update using Prisma raw query
    console.log('\n\n🔄 Performing raw SQL update...\n');
    
    const result = await prisma.$executeRaw`
      UPDATE subscriptions s
      SET plan_name = sp.display_name
      FROM subscription_plans sp
      WHERE s.plan_id = sp.id
        AND s.plan_name IS NULL
    `;
    
    console.log(`✅ Updated ${result} subscription records!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugAndUpdate();
