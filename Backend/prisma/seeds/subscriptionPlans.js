import prisma from '../../src/config/prisma.js';
import logger from '../../src/config/logger.js';
import {
  BillingCycle,
  FeatureType,
  ResetPeriod,
  PlanCode,
  FeatureCode,
} from '../../src/types/enums.js';

/**
 * Seed Features
 * Industry-standard features for matrimony platforms
 */
async function seedFeatures() {
  const features = [
    // Match & Discovery Features
    {
      code: FeatureCode.MATCH_LIMIT,
      display_name: 'Daily Match Limit',
      description: 'Number of matches that can be viewed per day',
      value_type: FeatureType.NUMBER,
      reset_period: ResetPeriod.DAILY,
    },
    {
      code: FeatureCode.INTEREST_LIMIT,
      display_name: 'Daily Interest Limit',
      description: 'Number of interests that can be sent per day',
      value_type: FeatureType.NUMBER,
      reset_period: ResetPeriod.DAILY,
    },
    {
      code: FeatureCode.MESSAGE_LIMIT,
      display_name: 'Daily Message Limit',
      description: 'Number of messages that can be sent per day',
      value_type: FeatureType.NUMBER,
      reset_period: ResetPeriod.DAILY,
    },
    {
      code: FeatureCode.CONTACT_VIEW_LIMIT,
      display_name: 'Monthly Contact View Limit',
      description: 'Number of contact details that can be viewed per month',
      value_type: FeatureType.NUMBER,
      reset_period: ResetPeriod.MONTHLY,
    },

    // Premium Features
    {
      code: FeatureCode.PRIORITY_SUPPORT,
      display_name: 'Priority Support',
      description: 'Access to priority customer support',
      value_type: FeatureType.STRING,
      reset_period: ResetPeriod.NONE,
    },
    {
      code: FeatureCode.PROFILE_BOOST,
      display_name: 'Profile Visibility Boost',
      description: 'Boost profile visibility in search results',
      value_type: FeatureType.BOOLEAN,
      reset_period: ResetPeriod.NONE,
    },
    {
      code: FeatureCode.ADVANCED_FILTERS,
      display_name: 'Advanced Search Filters',
      description: 'Access to advanced search filters',
      value_type: FeatureType.BOOLEAN,
      reset_period: ResetPeriod.NONE,
    },
    {
      code: FeatureCode.READ_RECEIPTS,
      display_name: 'Message Read Receipts',
      description: 'See when messages are read',
      value_type: FeatureType.BOOLEAN,
      reset_period: ResetPeriod.NONE,
    },
    {
      code: FeatureCode.VIP_BADGE,
      display_name: 'VIP Badge',
      description: 'Display VIP badge on profile',
      value_type: FeatureType.BOOLEAN,
      reset_period: ResetPeriod.NONE,
    },
    {
      code: FeatureCode.DEDICATED_MANAGER,
      display_name: 'Dedicated Relationship Manager',
      description: 'Personal relationship manager assistance',
      value_type: FeatureType.BOOLEAN,
      reset_period: ResetPeriod.NONE,
    },
    {
      code: FeatureCode.PRIORITY_MATCHING,
      display_name: 'Priority Matching Algorithm',
      description: 'Higher priority in match recommendations',
      value_type: FeatureType.BOOLEAN,
      reset_period: ResetPeriod.NONE,
    },
  ];

  logger.info('Seeding features...');

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { code: feature.code },
      update: feature,
      create: feature,
    });
  }

  logger.info(`✅ Seeded ${features.length} features successfully`);
}

/**
 * Seed Subscription Plans
 * Based on frontend specifications: Free, Basic (₹999), Premium (₹2499), Gold (₹4999)
 */
async function seedPlans() {
  logger.info('Seeding subscription plans...');

  // Get all features
  const features = await prisma.feature.findMany();
  const featureMap = {};
  features.forEach((f) => {
    featureMap[f.code] = f.id;
  });

  // Base feature configurations for each plan tier
  const basePlanFeatures = {
    FREE: [
      { feature_id: () => featureMap.MATCH_LIMIT, is_enabled: true, value_number: 5, value_string: '5 per day' },
      { feature_id: () => featureMap.INTEREST_LIMIT, is_enabled: true, value_number: 3, value_string: '3 per day' },
      { feature_id: () => featureMap.MESSAGE_LIMIT, is_enabled: true, value_number: 0, value_string: 'disabled' },
      { feature_id: () => featureMap.CONTACT_VIEW_LIMIT, is_enabled: true, value_number: 0, value_string: 'disabled' },
      { feature_id: () => featureMap.PRIORITY_SUPPORT, is_enabled: false, value_string: 'standard' },
      { feature_id: () => featureMap.PROFILE_BOOST, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.ADVANCED_FILTERS, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.READ_RECEIPTS, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.VIP_BADGE, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.DEDICATED_MANAGER, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.PRIORITY_MATCHING, is_enabled: false, value_boolean: false },
    ],
    BASIC: [
      { feature_id: () => featureMap.MATCH_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.INTEREST_LIMIT, is_enabled: true, value_number: 20, value_string: '20 per day' },
      { feature_id: () => featureMap.MESSAGE_LIMIT, is_enabled: true, value_number: 10, value_string: '10 per day' },
      { feature_id: () => featureMap.CONTACT_VIEW_LIMIT, is_enabled: true, value_number: 5, value_string: '5 per month' },
      { feature_id: () => featureMap.PRIORITY_SUPPORT, is_enabled: true, value_string: 'priority' },
      { feature_id: () => featureMap.PROFILE_BOOST, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.ADVANCED_FILTERS, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.READ_RECEIPTS, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.VIP_BADGE, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.DEDICATED_MANAGER, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.PRIORITY_MATCHING, is_enabled: false, value_boolean: false },
    ],
    PREMIUM: [
      { feature_id: () => featureMap.MATCH_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.INTEREST_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.MESSAGE_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.CONTACT_VIEW_LIMIT, is_enabled: true, value_number: 15, value_string: '15 per month' },
      { feature_id: () => featureMap.PRIORITY_SUPPORT, is_enabled: true, value_string: 'priority' },
      { feature_id: () => featureMap.PROFILE_BOOST, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.ADVANCED_FILTERS, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.READ_RECEIPTS, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.VIP_BADGE, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.DEDICATED_MANAGER, is_enabled: false, value_boolean: false },
      { feature_id: () => featureMap.PRIORITY_MATCHING, is_enabled: false, value_boolean: false },
    ],
    GOLD: [
      { feature_id: () => featureMap.MATCH_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.INTEREST_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.MESSAGE_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.CONTACT_VIEW_LIMIT, is_enabled: true, value_number: -1, value_string: 'unlimited' },
      { feature_id: () => featureMap.PRIORITY_SUPPORT, is_enabled: true, value_string: 'dedicated' },
      { feature_id: () => featureMap.PROFILE_BOOST, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.ADVANCED_FILTERS, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.READ_RECEIPTS, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.VIP_BADGE, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.DEDICATED_MANAGER, is_enabled: true, value_boolean: true },
      { feature_id: () => featureMap.PRIORITY_MATCHING, is_enabled: true, value_boolean: true },
    ],
  };

  const plans = [
    // ==========================================
    // FREE PLAN (Priority 0) - Always Monthly, Always Free
    // ==========================================
    {
      code: `${PlanCode.FREE}_MONTHLY`,
      display_name: 'Free',
      description: 'Basic profile with limited matches',
      price_amount: 0,
      currency: 'INR',
      billing_cycle: BillingCycle.MONTHLY,
      duration_days: 30,
      priority: 0,
      trial_period_days: null,
      is_active: true,
      version: 1,
      features: basePlanFeatures.FREE,
    },

    // ==========================================
    // BASIC PLANS - Monthly, Quarterly, Yearly
    // ==========================================
    {
      code: `${PlanCode.BASIC}_MONTHLY`,
      display_name: 'Basic Monthly',
      description: 'Unlimited matches with priority support - Monthly billing',
      price_amount: 99900, // ₹999
      currency: 'INR',
      billing_cycle: BillingCycle.MONTHLY,
      duration_days: 30,
      priority: 1,
      trial_period_days: 7,
      is_active: true,
      version: 1,
      features: basePlanFeatures.BASIC,
    },
    {
      code: `${PlanCode.BASIC}_QUARTERLY`,
      display_name: 'Basic Quarterly',
      description: 'Unlimited matches with priority support - Quarterly billing (10% off)',
      price_amount: 269700, // ₹2697 (₹899/month × 3)
      currency: 'INR',
      billing_cycle: BillingCycle.QUARTERLY,
      duration_days: 90,
      priority: 1,
      trial_period_days: 7,
      is_active: true,
      version: 1,
      features: basePlanFeatures.BASIC,
    },
    {
      code: `${PlanCode.BASIC}_YEARLY`,
      display_name: 'Basic Yearly',
      description: 'Unlimited matches with priority support - Yearly billing (20% off)',
      price_amount: 959040, // ₹9590.40 (₹799.20/month × 12)
      currency: 'INR',
      billing_cycle: BillingCycle.YEARLY,
      duration_days: 365,
      priority: 1,
      trial_period_days: 7,
      is_active: true,
      version: 1,
      features: basePlanFeatures.BASIC,
    },

    // ==========================================
    // PREMIUM PLANS - Monthly, Quarterly, Yearly
    // ==========================================
    {
      code: `${PlanCode.PREMIUM}_MONTHLY`,
      display_name: 'Premium Monthly',
      description: 'All Basic features plus advanced filters and read receipts - Monthly billing',
      price_amount: 249900, // ₹2499
      currency: 'INR',
      billing_cycle: BillingCycle.MONTHLY,
      duration_days: 30,
      priority: 2,
      trial_period_days: 14,
      is_active: true,
      version: 1,
      features: basePlanFeatures.PREMIUM,
    },
    {
      code: `${PlanCode.PREMIUM}_QUARTERLY`,
      display_name: 'Premium Quarterly',
      description: 'All Basic features plus advanced filters and read receipts - Quarterly billing (10% off)',
      price_amount: 674730, // ₹6747.30 (₹2249.10/month × 3)
      currency: 'INR',
      billing_cycle: BillingCycle.QUARTERLY,
      duration_days: 90,
      priority: 2,
      trial_period_days: 14,
      is_active: true,
      version: 1,
      features: basePlanFeatures.PREMIUM,
    },
    {
      code: `${PlanCode.PREMIUM}_YEARLY`,
      display_name: 'Premium Yearly',
      description: 'All Basic features plus advanced filters and read receipts - Yearly billing (20% off)',
      price_amount: 2399040, // ₹23990.40 (₹1999.20/month × 12)
      currency: 'INR',
      billing_cycle: BillingCycle.YEARLY,
      duration_days: 365,
      priority: 2,
      trial_period_days: 14,
      is_active: true,
      version: 1,
      features: basePlanFeatures.PREMIUM,
    },

    // ==========================================
    // GOLD PLANS - Monthly, Quarterly, Yearly
    // ==========================================
    {
      code: `${PlanCode.GOLD}_MONTHLY`,
      display_name: 'Gold Monthly',
      description: 'All Premium features plus VIP badge, dedicated manager, and priority matching - Monthly billing',
      price_amount: 499900, // ₹4999
      currency: 'INR',
      billing_cycle: BillingCycle.MONTHLY,
      duration_days: 30,
      priority: 3,
      trial_period_days: 30,
      is_active: true,
      version: 1,
      features: basePlanFeatures.GOLD,
    },
    {
      code: `${PlanCode.GOLD}_QUARTERLY`,
      display_name: 'Gold Quarterly',
      description: 'All Premium features plus VIP badge, dedicated manager, and priority matching - Quarterly billing (10% off)',
      price_amount: 1349730, // ₹13497.30 (₹4499.10/month × 3)
      currency: 'INR',
      billing_cycle: BillingCycle.QUARTERLY,
      duration_days: 90,
      priority: 3,
      trial_period_days: 30,
      is_active: true,
      version: 1,
      features: basePlanFeatures.GOLD,
    },
    {
      code: `${PlanCode.GOLD}_YEARLY`,
      display_name: 'Gold Yearly',
      description: 'All Premium features plus VIP badge, dedicated manager, and priority matching - Yearly billing (20% off)',
      price_amount: 4799040, // ₹47990.40 (₹3999.20/month × 12)
      currency: 'INR',
      billing_cycle: BillingCycle.YEARLY,
      duration_days: 365,
      priority: 3,
      trial_period_days: 30,
      is_active: true,
      version: 1,
      features: basePlanFeatures.GOLD,
    },
  ];

  for (const planData of plans) {
    const { features: planFeatures, ...planInfo } = planData;

    // Check if plan already exists
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        code: planInfo.code,
        version: planInfo.version,
      },
    });

    if (existingPlan) {
      logger.info(`Plan ${planInfo.code} already exists, skipping...`);
      continue;
    }

    // Create plan with features in transaction
    await prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.create({
        data: planInfo,
      });

      // Create plan features - resolve feature_id functions
      for (const pf of planFeatures) {
        const featureData = {
          plan_id: plan.id,
          is_enabled: pf.is_enabled,
          value_number: pf.value_number,
          value_string: pf.value_string,
          value_boolean: pf.value_boolean,
          feature_id: typeof pf.feature_id === 'function' ? pf.feature_id() : pf.feature_id,
        };
        
        await tx.planFeature.create({
          data: featureData,
        });
      }

      logger.info(`✅ Created plan: ${plan.code} (${plan.display_name}) - ₹${plan.price_amount / 100}`);
    });
  }

  logger.info(`✅ Seeded ${plans.length} subscription plans successfully`);
}

/**
 * Main seed function
 */
async function main() {
  try {
    logger.info('🌱 Starting subscription plan seeding...');

    await seedFeatures();
    await seedPlans();

    logger.info('🎉 Subscription plan seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
