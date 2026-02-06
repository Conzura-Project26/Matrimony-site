/**
 * Seed Script: Feature Gating System
 * Phase 6 - Task 6.2: Feature Gating
 * 
 * This script seeds:
 * 1. Features with types and reset periods
 * 2. Subscription plans (FREE, BASIC, PREMIUM, GOLD)
 * 3. Plan-Feature mappings with limits
 * 
 * Run: node scripts/seedFeatureGating.js
 */

import { PrismaClient } from '@prisma/client';
import { features } from '../prisma/seeds/featureData.js';
import { planFeatureMapping } from '../prisma/seeds/planFeatureData.js';

const prisma = new PrismaClient();

// ============================================
// SUBSCRIPTION PLAN DEFINITIONS
// ============================================
const subscriptionPlans = [
  {
    code: 'FREE',
    display_name: 'Free Plan',
    description: 'Basic features to get started with matrimony search',
    price_amount: 0,  // ₹0
    currency: 'INR',
    billing_cycle: 'MONTHLY',
    duration_days: 30,
    priority: 0,
    trial_period_days: null,
    is_active: true,
    version: 1
  },
  {
    code: 'BASIC',
    display_name: 'Basic Plan',
    description: 'Essential features for active matrimony search',
    price_amount: 99900,  // ₹999
    currency: 'INR',
    billing_cycle: 'MONTHLY',
    duration_days: 30,
    priority: 1,
    trial_period_days: 7,
    is_active: true,
    version: 1
  },
  {
    code: 'PREMIUM',
    display_name: 'Premium Plan',
    description: 'Advanced features with priority matching and photo access',
    price_amount: 299900,  // ₹2,999
    currency: 'INR',
    billing_cycle: 'MONTHLY',
    duration_days: 30,
    priority: 2,
    trial_period_days: 14,
    is_active: true,
    version: 1
  },
  {
    code: 'GOLD',
    display_name: 'Gold Plan',
    description: 'Unlimited access with dedicated relationship manager',
    price_amount: 499900,  // ₹4,999
    currency: 'INR',
    billing_cycle: 'MONTHLY',
    duration_days: 30,
    priority: 3,
    trial_period_days: 30,
    is_active: true,
    version: 1
  }
];

// ============================================
// SEED FEATURES
// ============================================
async function seedFeatures() {
  console.log('\n🎯 Seeding features...');
  
  for (const feature of features) {
    const result = await prisma.feature.upsert({
      where: { code: feature.code },
      update: {
        display_name: feature.display_name,
        description: feature.description,
        value_type: feature.value_type,
        reset_period: feature.reset_period,
        is_active: feature.is_active
      },
      create: feature
    });
    
    console.log(`   ✅ ${result.code} (${result.value_type})`);
  }
  
  console.log('✅ Features seeded successfully');
}

// ============================================
// SEED SUBSCRIPTION PLANS
// ============================================
async function seedSubscriptionPlans() {
  console.log('\n📦 Seeding subscription plans...');
  
  const createdPlans = {};
  
  for (const plan of subscriptionPlans) {
    const result = await prisma.subscriptionPlan.upsert({
      where: {
        code_version: {
          code: plan.code,
          version: plan.version
        }
      },
      update: {
        display_name: plan.display_name,
        description: plan.description,
        price_amount: plan.price_amount,
        currency: plan.currency,
        billing_cycle: plan.billing_cycle,
        duration_days: plan.duration_days,
        priority: plan.priority,
        trial_period_days: plan.trial_period_days,
        is_active: plan.is_active
      },
      create: plan
    });
    
    createdPlans[plan.code] = result;
    
    const priceInr = (result.price_amount / 100).toFixed(2);
    console.log(`   ✅ ${result.display_name} (₹${priceInr}) - Priority ${result.priority}`);
  }
  
  console.log('✅ Subscription plans seeded successfully');
  
  return createdPlans;
}

// ============================================
// SEED PLAN FEATURES
// ============================================
async function seedPlanFeatures(plans) {
  console.log('\n🔗 Seeding plan-feature mappings...');
  
  for (const [planCode, featureMap] of Object.entries(planFeatureMapping)) {
    const plan = plans[planCode];
    
    if (!plan) {
      console.warn(`   ⚠️  Plan ${planCode} not found, skipping...`);
      continue;
    }
    
    console.log(`\n   📋 Processing ${plan.display_name}...`);
    
    for (const [featureCode, values] of Object.entries(featureMap)) {
      const feature = await prisma.feature.findUnique({
        where: { code: featureCode }
      });
      
      if (!feature) {
        console.warn(`      ⚠️  Feature ${featureCode} not found, skipping...`);
        continue;
      }
      
      await prisma.planFeature.upsert({
        where: {
          plan_id_feature_id: {
            plan_id: plan.id,
            feature_id: feature.id
          }
        },
        update: {
          is_enabled: values.is_enabled,
          value_number: values.value_number !== undefined ? values.value_number : null,
          value_string: values.value_string !== undefined ? values.value_string : null,
          value_boolean: values.value_boolean !== undefined ? values.value_boolean : null
        },
        create: {
          plan_id: plan.id,
          feature_id: feature.id,
          is_enabled: values.is_enabled,
          value_number: values.value_number !== undefined ? values.value_number : null,
          value_string: values.value_string !== undefined ? values.value_string : null,
          value_boolean: values.value_boolean !== undefined ? values.value_boolean : null
        }
      });
      
      // Format display value
      let displayValue = '';
      if (values.value_number !== undefined) {
        displayValue = values.value_number === -1 ? 'Unlimited' : values.value_number;
      } else if (values.value_boolean !== undefined) {
        displayValue = values.value_boolean ? 'Yes' : 'No';
      } else if (values.value_string !== undefined) {
        displayValue = values.value_string;
      }
      
      console.log(`      ✅ ${featureCode}: ${displayValue}`);
    }
  }
  
  console.log('\n✅ Plan-feature mappings seeded successfully');
}

// ============================================
// ASSIGN FREE PLAN TO EXISTING USERS
// ============================================
async function assignFreePlanToExistingUsers(freePlan) {
  console.log('\n👥 Assigning FREE plan to existing users...');
  
  // Find users without an active subscription
  const usersWithoutSubscription = await prisma.user.findMany({
    where: {
      OR: [
        {
          subscriptions: {
            none: {}
          }
        },
        {
          subscriptions: {
            none: {
              status: 'ACTIVE'
            }
          }
        }
      ]
    },
    select: { id: true, full_name: true }
  });
  
  if (usersWithoutSubscription.length === 0) {
    console.log('   ℹ️  No users without subscriptions found');
    return;
  }
  
  console.log(`   Found ${usersWithoutSubscription.length} users without active subscriptions`);
  
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 10);  // 10 years for free plan
  
  for (const user of usersWithoutSubscription) {
    await prisma.subscription.create({
      data: {
        user_id: user.id,
        plan_id: freePlan.id,
        plan_name: freePlan.display_name,  // Populate legacy field for backward compatibility
        status: 'ACTIVE',
        start_date: now,
        end_date: endDate,
        is_active: true,
        auto_renew: false
      }
    });
    
    console.log(`   ✅ Assigned FREE plan to ${user.full_name}`);
  }
  
  console.log(`✅ Assigned FREE plan to ${usersWithoutSubscription.length} users`);
}

// ============================================
// MAIN FUNCTION
// ============================================
async function main() {
  console.log('🌱 Starting Feature Gating Seed...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Step 1: Seed Features
    await seedFeatures();
    
    // Step 2: Seed Subscription Plans
    const plans = await seedSubscriptionPlans();
    
    // Step 3: Map Features to Plans
    await seedPlanFeatures(plans);
    
    // Step 4: Assign FREE plan to existing users
    await assignFreePlanToExistingUsers(plans.FREE);
    
    // Print Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SEEDING SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const featureCount = await prisma.feature.count();
    const planCount = await prisma.subscriptionPlan.count({ where: { version: 1 } });
    const planFeatureCount = await prisma.planFeature.count();
    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
    
    console.log(`   Features: ${featureCount}`);
    console.log(`   Plans: ${planCount}`);
    console.log(`   Plan-Feature Mappings: ${planFeatureCount}`);
    console.log(`   Active Subscriptions: ${activeSubscriptions}`);
    
    console.log('\n🎉 Feature Gating System seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// ============================================
// EXECUTE
// ============================================
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
