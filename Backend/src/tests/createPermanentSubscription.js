/**
 * Create Permanent Subscription for Testing
 * Creates a user and subscription that stays in database
 */

import request from 'supertest';
import app from '../../index.js';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

const TEST_USER = {
  mobile: '+919876512340',
  password: 'Test@1234',
  name: 'Demo User',
  gender: 'Male',
  dob: '1995-08-20',
};

async function createPermanentSubscription() {
  try {
    logger.info('🎯 Creating Permanent Subscription');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if user exists, if not create
    logger.info('👤 Checking for user...');
    let user = await prisma.user.findUnique({
      where: { mobile_number: TEST_USER.mobile },
    });

    if (!user) {
      logger.info('📝 Creating new user...');
      
      const roleUser = await prisma.role.findUnique({
        where: { role_name: 'USER' },
      });

      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { code: 'FREE_MONTHLY', is_active: true },
      });

      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
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

        await tx.subscription.create({
          data: {
            user_id: newUser.id,
            plan_id: freePlan.id,
            plan_name: freePlan.display_name,
            start_date: startDate,
            end_date: endDate,
            status: 'ACTIVE',
            auto_renew: true,
          },
        });

        return newUser;
      });

      user = result;
      logger.info(`✅ User created: ${user.full_name}\n`);
    } else {
      logger.info(`✅ User exists: ${user.full_name}\n`);
    }

    // Login
    logger.info('🔐 Logging in...');
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        identifier: TEST_USER.mobile,
        password: TEST_USER.password,
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }

    const authToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;

    logger.info(`✅ Logged in as: ${loginResponse.body.data.user.full_name}`);
    logger.info(`📱 User ID: ${userId}\n`);

    // Get plans
    logger.info('📋 Getting available plans...');
    const plansResponse = await request(app).get('/plans');

    if (plansResponse.status !== 200) {
      throw new Error(`Failed to get plans: ${JSON.stringify(plansResponse.body)}`);
    }

    const basicPlan = plansResponse.body.data.find((p) => p.code === 'BASIC_MONTHLY');
    
    if (!basicPlan) {
      throw new Error('BASIC_MONTHLY plan not found');
    }

    logger.info(`✅ Found plan: ${basicPlan.display_name}`);
    logger.info(`   Price: ₹${basicPlan.price_amount / 100}`);
    logger.info(`   Duration: ${basicPlan.duration_days} days\n`);

    // Subscribe to BASIC plan
    logger.info('💳 Subscribing to BASIC Monthly plan...');
    const subscribeResponse = await request(app)
      .post('/subscriptions/subscribe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        planId: basicPlan.id,
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

    const subscription = subscribeResponse.body.data;
    
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('✅ SUBSCRIPTION CREATED SUCCESSFULLY!');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`Subscription ID: ${subscription.id}`);
    logger.info(`User: ${loginResponse.body.data.user.full_name}`);
    logger.info(`Mobile: ${TEST_USER.mobile}`);
    logger.info(`Plan: ${subscription.planName}`);
    logger.info(`Status: ${subscription.status}`);
    logger.info(`Start Date: ${subscription.startDate}`);
    logger.info(`End Date: ${subscription.endDate}`);
    logger.info(`Auto-renew: ${subscription.autoRenew}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🔍 Check your Supabase subscriptions table now!');
    logger.info('📊 This subscription will remain in the database.');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    logger.error('❌ ERROR:', error.message);
    if (error.response) {
      logger.error('Response:', error.response.body);
    }
    throw error;
  } finally {
    process.exit(0);
  }
}

createPermanentSubscription();
