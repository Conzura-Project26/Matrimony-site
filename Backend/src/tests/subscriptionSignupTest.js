/**
 * Test: User Signup with FREE Plan Assignment
 * Verify that subscriptions are created in database
 */

import request from 'supertest';
import app from '../../index.js';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

describe('Subscription System: Signup & Plan Assignment', () => {
  let testUserId;
  let testMobileNumber;

  beforeAll(async () => {
    testMobileNumber = `+9199${Date.now().toString().slice(-8)}`;
    logger.info('🧪 Testing subscription assignment on signup');
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.subscription.deleteMany({
        where: { user_id: testUserId },
      });
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
    logger.info('🧹 Cleanup complete');
  });

  test('Step 1: Request OTP for signup', async () => {
    const response = await request(app)
      .post('/auth/request-otp')
      .send({
        mobile_number: testMobileNumber,
        purpose: 'SIGNUP',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('OTP sent');
    logger.info('✅ OTP requested successfully');
  });

  test('Step 2: Verify OTP', async () => {
    // Get the OTP from database (for testing)
    const otpRecord = await prisma.otpLog.findFirst({
      where: {
        mobile_number: testMobileNumber,
        purpose: 'SIGNUP',
        is_verified: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    expect(otpRecord).toBeTruthy();
    const otpCode = otpRecord.otp_code;

    const response = await request(app)
      .post('/auth/verify-otp')
      .send({
        mobile_number: testMobileNumber,
        otp_code: otpCode,
        purpose: 'SIGNUP',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    logger.info('✅ OTP verified successfully');
  });

  test('Step 3: Complete signup - should create user AND assign FREE plan', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        mobile_number: testMobileNumber,
        password: 'Test@1234',
        full_name: 'Test Subscription User',
        gender: 'Male',
        date_of_birth: '1995-05-15',
        profile_created_by: 'Self',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    testUserId = response.body.data.user.id;

    logger.info(`✅ User created: ${testUserId}`);
  });

  test('Step 4: Verify FREE plan subscription was created in database', async () => {
    expect(testUserId).toBeTruthy();

    // Check subscriptions table
    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: testUserId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    expect(subscription).toBeTruthy();
    expect(subscription.plan.code).toBe('FREE_MONTHLY');
    expect(subscription.plan_name).toBe('Free');
    expect(subscription.status).toBe('ACTIVE');
    expect(subscription.auto_renew).toBe(true);
    expect(subscription.start_date).toBeDefined();
    expect(subscription.end_date).toBeDefined();

    logger.info('✅ FREE plan subscription found in database:', {
      subscriptionId: subscription.id,
      planCode: subscription.plan.code,
      planName: subscription.plan_name,
      status: subscription.status,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      autoRenew: subscription.auto_renew,
    });
  });

  test('Step 5: Get current subscription via API', async () => {
    // Login to get token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        mobile_number: testMobileNumber,
        password: 'Test@1234',
      })
      .expect(200);

    const token = loginResponse.body.data.accessToken;

    // Get current subscription
    const response = await request(app)
      .get('/subscriptions/current')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.plan.code).toBe('FREE_MONTHLY');
    expect(response.body.data.status).toBe('ACTIVE');
    expect(response.body.data.plan.price.amount).toBe(0);

    logger.info('✅ Subscription retrieved via API:', {
      planCode: response.body.data.plan.code,
      planName: response.body.data.plan.displayName,
      status: response.body.data.status,
    });
  });

  test('Step 6: Check subscriptions count in database', async () => {
    const count = await prisma.subscription.count({
      where: {
        user_id: testUserId,
      },
    });

    expect(count).toBe(1);
    logger.info(`✅ Total subscriptions for user: ${count}`);
  });
});

logger.info('✅ Subscription tests defined');
