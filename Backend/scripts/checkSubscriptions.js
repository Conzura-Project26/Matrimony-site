import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscriptions() {
  console.log('🔍 Checking subscription status...\n');
  
  try {
    // Count total subscriptions
    const total = await prisma.subscription.count();
    
    // Count subscriptions with NULL plan_name
    const nullPlanName = await prisma.subscription.count({
      where: { plan_name: null }
    });
    
    // Count subscriptions with NULL plan_id
    const nullPlanId = await prisma.subscription.count({
      where: { plan_id: null }
    });
    
    console.log(`📊 Subscription Statistics:`);
    console.log(`   Total subscriptions: ${total}`);
    console.log(`   With NULL plan_name: ${nullPlanName}`);
    console.log(`   With NULL plan_id: ${nullPlanId}`);
    
    // Show sample of NULL plan_name subscriptions
    if (nullPlanName > 0) {
      console.log(`\n❌ Found ${nullPlanName} subscriptions with NULL plan_name:`);
      const samples = await prisma.subscription.findMany({
        where: { plan_name: null },
        select: {
          id: true,
          user_id: true,
          plan_id: true,
          plan_name: true,
          status: true,
          created_at: true
        },
        take: 10
      });
      
      samples.forEach(sub => {
        console.log(`   ID ${sub.id}: plan_id=${sub.plan_id}, plan_name=${sub.plan_name}`);
      });
    } else {
      console.log(`\n✅ All subscriptions have plan_name populated!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptions();
