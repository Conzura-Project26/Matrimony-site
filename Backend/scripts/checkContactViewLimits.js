import prisma from '../src/config/prisma.js';

async function checkContactViewLimits() {
  console.log('\n🔍 Checking CONTACT_VIEW_LIMIT_MONTHLY settings for all plans...\n');

  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      code: { in: ['FREE', 'BASIC', 'PREMIUM', 'GOLD'] },
      is_active: true,
    },
    include: {
      plan_features: {
        where: {
          feature: {
            code: 'CONTACT_VIEW_LIMIT_MONTHLY',
          },
        },
        include: {
          feature: true,
        },
      },
    },
    orderBy: { priority: 'asc' },
  });

  for (const plan of plans) {
    console.log(`\n📦 ${plan.code} (${plan.display_name}):`);
    if (plan.plan_features.length === 0) {
      console.log('   ❌ NO CONTACT_VIEW_LIMIT_MONTHLY feature configured!');
    } else {
      for (const pf of plan.plan_features) {
        console.log(`   Feature: ${pf.feature.code}`);
        console.log(`   Enabled: ${pf.is_enabled}`);
        console.log(`   Limit: ${pf.value_number} (${pf.value_string || 'N/A'})`);
        console.log(`   Reset: ${pf.feature.reset_period}`);
      }
    }
  }

  // Check if feature gate is enabled
  const gateFlag = await prisma.featureGate.findUnique({
    where: { gate_key: 'GATE_CONTACT_VIEWS' },
  });

  console.log('\n🚪 Feature Gate Status:');
  if (gateFlag) {
    console.log(`   Key: ${gateFlag.gate_key}`);
    console.log(`   Enabled: ${gateFlag.is_enabled}`);
    console.log(`   Phase: ${gateFlag.phase}`);
  } else {
    console.log('   ❌ GATE_CONTACT_VIEWS not found!');
  }
}

checkContactViewLimits()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
