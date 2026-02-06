import prisma from '../src/config/prisma.js';

async function getTestUsers() {
  console.log('\n🔍 Finding users with different subscription plans...\n');

  // Get all active subscription plans
  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      code: { in: ['FREE', 'BASIC', 'PREMIUM', 'GOLD'] },
      is_active: true,
    },
    orderBy: { priority: 'asc' },
  });

  console.log(`✅ Found ${plans.length} plans:`, plans.map(p => p.code).join(', '));

  // Find users for each plan
  const testUsers = {};

  for (const plan of plans) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        plan_id: plan.id,
        status: 'ACTIVE',
        is_active: true,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (subscription) {
      testUsers[plan.code] = {
        userId: subscription.user.id,
        mobile: subscription.user.mobile_number,
        name: subscription.user.full_name,
        role: subscription.user.role.role_name,
        planCode: plan.code,
        planName: plan.display_name,
      };
      console.log(`✅ ${plan.code.padEnd(8)}: ${subscription.user.mobile_number} (${subscription.user.full_name})`);
    } else {
      console.log(`❌ ${plan.code.padEnd(8)}: No active user found`);
    }
  }

  // Also find one target user (any user we can interact with)
  const targetUser = await prisma.user.findFirst({
    where: {
      is_active: true,
      NOT: {
        id: { in: Object.values(testUsers).map(u => u.userId) },
      },
    },
    include: {
      subscriptions: {
        where: { is_active: true },
        include: { plan: true },
      },
    },
  });

  if (targetUser) {
    testUsers.TARGET = {
      userId: targetUser.id,
      mobile: targetUser.mobile_number,
      name: targetUser.full_name,
      planCode: targetUser.subscriptions[0]?.plan?.code || 'NONE',
    };
    console.log(`✅ TARGET  : ${targetUser.mobile_number} (${targetUser.full_name})`);
  }

  console.log('\n📋 Test Users Summary:');
  console.log(JSON.stringify(testUsers, null, 2));

  return testUsers;
}

getTestUsers()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
