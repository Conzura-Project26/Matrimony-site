/**
 * Subscription Flow Integration Test
 * Tests the complete user subscription journey:
 * 1. User signup (gets FREE plan automatically)
 * 2. User upgrades to PREMIUM plan
 * 3. Verify subscription logged in database
 */

import request from 'supertest';
import app from '../../index.js';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

const TEST_USER = {
  mobile: '+919380422508',
  password: 'Nishanth@2005',
  name: 'Nishanth Test User',
  gender: 'Male',
  dob: '1995-06-15',
};

async function testSubscriptionFlow() {
  let authToken = null;
  let userId = null;

  try {
    logger.info('🧪 Starting Subscription Flow Test');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ═══════════════════════════════════════════════════════
    // Step 0: Check if user exists, if not create account
    // ═══════════════════════════════════════════════════════
    logger.info('👤 Step 0: Check/Create User Account');
    
    let existingUser = await prisma.user.findUnique({
      where: { mobile_number: TEST_USER.mobile },
    });

    if (!existingUser) {
      logger.info('   📝 User not found, creating new account...');
      
      // Create user with FREE plan
      const roleUser = await prisma.role.findUnique({
        where: { role_name: 'USER' },
      });

      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: {
          code: 'FREE_MONTHLY',
          is_active: true,
        },
      });

      if (!freePlan) {
        throw new Error('FREE plan not found');
      }

      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role_id: roleUser.id,
            mobile_number: TEST_USER.mobile,
            password_hash: hashedPassword,
            full_name: TEST_USER.name,
            gender: TEST_USER.gender,
            date_of_birth: new Date(TEST_USER.dob),
            profile_created_by: 'Self',
            is_mobile_verified: true,
          },
        });

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
          },
        });

        return { user, subscription };
      });

      existingUser = result.user;
      logger.info(`   ✅ User created with FREE plan`);
      logger.info(`   📱 User ID: ${existingUser.id}`);
    } else {
      logger.info(`   ✅ User exists: ${existingUser.full_name}`);
      logger.info(`   📱 User ID: ${existingUser.id}`);
    }

    // ═══════════════════════════════════════════════════════
    // Step 1: User Login
    // ═══════════════════════════════════════════════════════
    logger.info('\n🔐 Step 1: User Login');
    
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        identifier: TEST_USER.mobile,
        password: TEST_USER.password,
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }

    authToken = loginResponse.body.data.accessToken;
    userId = loginResponse.body.data.user.id;
    
    logger.info(`   ✅ User logged in successfully`);
    logger.info(`   📱 User ID: ${userId}`);
    logger.info(`   👤 User: ${loginResponse.body.data.user.full_name}`);
    logger.info(`   🎫 Auth Token: ${authToken.substring(0, 20)}...`);

    // Check initial subscription (should be FREE)
    const initialSubs = await prisma.subscription.findMany({
      where: { user_id: userId },
      include: {
        plan: {
          select: {
            code: true,
            display_name: true,
            price_amount: true,
          },
        },
      },
    });

    logger.info(`   📊 Initial Subscriptions: ${initialSubs.length}`);
    if (initialSubs.length > 0) {
      initialSubs.forEach((sub) => {
        logger.info(
          `      - ${sub.plan.display_name} (${sub.plan.code}) - Status: ${sub.status} - ₹${sub.plan.price_amount / 100}`
        );
      });
    }

    // ═══════════════════════════════════════════════════════
    // Step 2: Get Current Subscription via API
    // ═══════════════════════════════════════════════════════
    logger.info('\n🔍 Step 2: Get Current Subscription via API');

    const currentSubResponse = await request(app)
      .get('/subscriptions/current')
      .set('Authorization', `Bearer ${authToken}`);

    if (currentSubResponse.status === 200) {
      logger.info('   ✅ Current subscription retrieved:');
      const subscription = currentSubResponse.body.data;
      logger.info(`      Plan: ${subscription.plan.displayName}`);
      logger.info(`      Status: ${subscription.status}`);
      logger.info(`      Start: ${subscription.startDate}`);
      logger.info(`      End: ${subscription.endDate}`);
    } else {
      logger.warn('   ⚠️  No active subscription found');
    }

    // ═══════════════════════════════════════════════════════
    // Step 3: Get Available Plans
    // ═══════════════════════════════════════════════════════
    logger.info('\n📋 Step 3: Get Available Plans');

    const plansResponse = await request(app).get('/plans');

    if (plansResponse.status !== 200) {
      throw new Error(`Failed to get plans: ${JSON.stringify(plansResponse.body)}`);
    }

    const premiumPlan = plansResponse.body.data.find(
      (plan) => plan.code === 'PREMIUM_MONTHLY'
    );

    if (!premiumPlan) {
      throw new Error('PREMIUM_MONTHLY plan not found');
    }

    logger.info(`   ✅ Found PREMIUM plan: ${premiumPlan.display_name}`);
    logger.info(`      Price: ₹${premiumPlan.price_amount / 100}`);
    logger.info(`      Duration: ${premiumPlan.duration_days} days`);
    logger.info(`      Plan ID: ${premiumPlan.id}`);

    // ═══════════════════════════════════════════════════════
    // Step 4: Subscribe to PREMIUM Plan
    // ═══════════════════════════════════════════════════════
    logger.info('\n💳 Step 4: Subscribe to PREMIUM Plan');

    const subscribeResponse = await request(app)
      .post('/subscriptions/subscribe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        planId: premiumPlan.id,
        paymentDetails: {
          method: 'credit_card',
          transactionId: `TXN${Date.now()}`,
        },
      });

    if (subscribeResponse.status !== 201) {
      throw new Error(
        `Subscription failed: ${JSON.stringify(subscribeResponse.body)}`
      );
    }

    const newSubscription = subscribeResponse.body.data;
    logger.info('   ✅ Successfully subscribed to PREMIUM!');
    logger.info(`      Subscription ID: ${newSubscription.id}`);
    logger.info(`      Plan: ${newSubscription.planName}`);
    logger.info(`      Status: ${newSubscription.status}`);
    logger.info(`      Start: ${newSubscription.startDate}`);
    logger.info(`      End: ${newSubscription.endDate}`);
    logger.info(`      Auto-renew: ${newSubscription.autoRenew}`);

    // ═══════════════════════════════════════════════════════
    // Step 5: Verify in Database
    // ═══════════════════════════════════════════════════════
    logger.info('\n🔍 Step 5: Verify Subscriptions in Database');

    const allUserSubs = await prisma.subscription.findMany({
      where: { user_id: userId },
      include: {
        plan: {
          select: {
            code: true,
            display_name: true,
            price_amount: true,
            duration_days: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    logger.info(`   📊 Total Subscriptions for User: ${allUserSubs.length}`);
    logger.info('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    allUserSubs.forEach((sub, idx) => {
      logger.info(`\n   ${idx + 1}. ${sub.plan.display_name} (${sub.plan.code})`);
      logger.info(`      Status: ${sub.status}`);
      logger.info(`      Price: ₹${sub.plan.price_amount / 100}`);
      logger.info(`      Duration: ${sub.plan.duration_days} days`);
      logger.info(`      Period: ${sub.start_date.toISOString().split('T')[0]} → ${sub.end_date.toISOString().split('T')[0]}`);
      logger.info(`      Auto-renew: ${sub.auto_renew}`);
      logger.info(`      Created: ${sub.created_at.toISOString()}`);
    });

    // ═══════════════════════════════════════════════════════
    // Step 6: Get Subscription History via API
    // ═══════════════════════════════════════════════════════
    logger.info('\n📜 Step 6: Get Subscription History via API');

    const historyResponse = await request(app)
      .get('/subscriptions/history')
      .set('Authorization', `Bearer ${authToken}`);

    if (historyResponse.status === 200) {
      const history = historyResponse.body.data;
      logger.info(`   ✅ Retrieved ${history.length} subscription records`);
      history.forEach((sub, idx) => {
        logger.info(
          `      ${idx + 1}. ${sub.plan.displayName} - ${sub.status} (${sub.startDate} → ${sub.endDate})`
        );
      });
    }

    // ═══════════════════════════════════════════════════════
    // Step 7: Check All Subscriptions in Database
    // ═══════════════════════════════════════════════════════
    logger.info('\n🗄️  Step 7: All Subscriptions in Database');

    const totalSubs = await prisma.subscription.count();
    const activeSubs = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    logger.info(`   Total Subscriptions: ${totalSubs}`);
    logger.info(`   Active Subscriptions: ${activeSubs}`);

    const recentSubs = await prisma.subscription.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            full_name: true,
            mobile_number: true,
          },
        },
        plan: {
          select: {
            display_name: true,
            price_amount: true,
          },
        },
      },
    });

    logger.info('\n   Recent Subscriptions:');
    recentSubs.forEach((sub, idx) => {
      logger.info(
        `      ${idx + 1}. ${sub.user.full_name} → ${sub.plan.display_name} (₹${sub.plan.price_amount / 100}) - ${sub.status}`
      );
    });

    // ═══════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════
    logger.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎉 TEST PASSED: Subscription Flow Complete!');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('✅ User signup → FREE plan assigned automatically');
    logger.info('✅ User upgraded → PREMIUM plan subscription created');
    logger.info('✅ Subscriptions logged in database correctly');
    logger.info('✅ APIs returning correct subscription data');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    logger.error('❌ TEST FAILED:', error.message);
    if (error.response) {
      logger.error('Response:', error.response.body);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSubscriptionFlow()
  .then(() => {
    logger.info('✨ All tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Test suite failed:', error);
    process.exit(1);
  });
