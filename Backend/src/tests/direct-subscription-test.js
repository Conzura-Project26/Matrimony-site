/**
 * Simple Test: Verify Subscription Database Logging
 * Direct database test - no API calls
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

async function testSubscriptionCreation() {
  let testUserId;
  const testMobile = `+9199${Date.now().toString().slice(-8)}`;

  try {
    logger.info('🧪 Starting Direct Database Subscription Test');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Step 1: Find FREE plan
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: {
        code: 'FREE_MONTHLY',
        is_active: true,
      },
    });

    if (!freePlan) {
      throw new Error('FREE_MONTHLY plan not found! Did you seed the database?');
    }

    logger.info('✅ Step 1: FREE plan found', {
      id: freePlan.id,
      code: freePlan.code,
      display_name: freePlan.display_name,
      price: freePlan.price_amount,
    });

    // Step 2: Create user and assign FREE plan (simulating signup)
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          role_id: 1, // USER role
          mobile_number: testMobile,
          password_hash: await bcrypt.hash('Test@1234', 10),
          full_name: 'Test Subscription User',
          gender: 'Male',
          date_of_birth: new Date('1995-05-15'),
          profile_created_by: 'Self',
          is_mobile_verified: true,
        },
      });

      // Assign FREE plan
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + freePlan.duration_days);

      const subscription = await tx.subscription.create({
        data: {
          user_id: user.id,
          plan_id: freePlan.id,
          plan_name: freePlan.display_name,
          start_date: startDate,
          end_date: endDate,
          status: 'ACTIVE',
          auto_renew: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { user, subscription };
    });

    testUserId = result.user.id;

    logger.info('✅ Step 2: User created', {
      id: result.user.id,
      mobile: result.user.mobile_number,
      name: result.user.full_name,
    });

    logger.info('✅ Step 3: Subscription created in database', {
      subscriptionId: result.subscription.id,
      userId: result.subscription.user_id,
      planId: result.subscription.plan_id,
      planName: result.subscription.plan_name,
      status: result.subscription.status,
      startDate: result.subscription.start_date,
      endDate: result.subscription.end_date,
      autoRenew: result.subscription.auto_renew,
    });

    // Step 3: Verify in database with JOIN
    const verifySubscription = await prisma.subscription.findFirst({
      where: {
        user_id: testUserId,
        status: 'ACTIVE',
      },
      include: {
        plan: {
          include: {
            plan_features: {
              include: {
                feature: true,
              },
            },
          },
        },
      },
    });

    logger.info('✅ Step 4: Verified subscription with plan details:', {
      subscriptionId: verifySubscription.id,
      planCode: verifySubscription.plan.code,
      planDisplayName: verifySubscription.plan.display_name,
      planPrice: `₹${verifySubscription.plan.price_amount / 100}`,
      featureCount: verifySubscription.plan.plan_features.length,
      status: verifySubscription.status,
    });

    // Step 4: Check total subscriptions count
    const totalCount = await prisma.subscription.count();
    logger.info(`✅ Step 5: Total subscriptions in database: ${totalCount}`);

    // Step 5: Check subscriptions table data
    const allSubscriptions = await prisma.subscription.findMany({
      take: 5,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        plan: {
          select: {
            code: true,
            display_name: true,
          },
        },
      },
    });

    logger.info(`✅ Step 6: Recent subscriptions (showing ${allSubscriptions.length}):`);
    allSubscriptions.forEach((sub, idx) => {
      logger.info(`   ${idx + 1}. User: ${sub.user_id.slice(0, 8)}... | Plan: ${sub.plan.code} | Status: ${sub.status} | Created: ${sub.created_at.toISOString()}`);
    });

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎉 TEST PASSED: Subscription system is working!');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return true;
  } catch (error) {
    logger.error('❌ TEST FAILED:', error.message);
    logger.error(error.stack);
    return false;
  } finally {
    // Cleanup
    if (testUserId) {
      await prisma.subscription.deleteMany({
        where: { user_id: testUserId },
      });
      await prisma.user.delete({
        where: { id: testUserId },
      });
      logger.info('🧹 Test data cleaned up');
    }
    await prisma.$disconnect();
  }
}

// Run the test
testSubscriptionCreation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
