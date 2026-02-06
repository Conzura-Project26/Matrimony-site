import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSubscriptionPlanNames() {
  console.log('🔄 Updating subscription plan_name fields...\n');
  
  try {
    // Get all subscriptions with NULL plan_name but valid plan_id
    const subscriptionsToUpdate = await prisma.subscription.findMany({
      where: {
        AND: [
          { plan_name: null },
          { plan_id: { not: null } }
        ]
      },
      include: {
        plan: true
      }
    });
    
    if (subscriptionsToUpdate.length === 0) {
      console.log('✅ All subscriptions already have plan_name populated!');
      return;
    }
    
    console.log(`Found ${subscriptionsToUpdate.length} subscriptions to update`);
    
    let updated = 0;
    for (const subscription of subscriptionsToUpdate) {
      if (subscription.plan && subscription.plan.name) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { plan_name: subscription.plan.name }
        });
        
        updated++;
        console.log(`  ✅ Updated subscription #${subscription.id}: ${subscription.plan.name}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} subscriptions!`);
    
  } catch (error) {
    console.error('❌ Error updating subscriptions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscriptionPlanNames();
