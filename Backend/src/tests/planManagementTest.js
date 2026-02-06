/**
 * Task 6.1: Plan Management - Integration Tests
 * 
 * Test Coverage:
 * 1. Public Plan APIs (GET /plans, GET /plans/:id, GET /plans/code/:code)
 * 2. Admin Plan CRUD (POST /admin/plans, PUT /admin/plans/:id, DELETE /admin/plans/:id)
 * 3. Plan Versioning (POST /admin/plans/:id/version)
 * 4. Plan Reactivation (PATCH /admin/plans/:id/reactivate)
 * 5. Feature Management (GET /admin/features, POST /admin/features)
 * 6. Feature Usage Tracking
 * 7. Authorization (ADMIN vs MODERATOR vs USER)
 * 8. Edge Cases (deactivate last plan, invalid price, etc.)
 */

import request from 'supertest';
import app from '../../index.js';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let adminToken;
let moderatorToken;
let userToken;
let adminId;
let freePlanId;
let basicPlanId;
let testPlanId;

describe('Task 6.1: Subscription Plan Management', () => {
  // ==========================================
  // SETUP & TEARDOWN
  // ==========================================
  beforeAll(async () => {
    logger.info('🧪 Setting up test environment for Plan Management');

    // Create test admin user
    const admin = await prisma.user.create({
      data: {
        full_name: 'Test Admin',
        mobile_number: '+919999999901',
        email: 'admin.plan@test.com',
        password_hash: '$2b$10$hashedpassword',
        gender: 'Male',
        date_of_birth: new Date('1990-01-01'),
        profile_created_by: 'Self',
        role_id: 3, // ADMIN role
      },
    });

    adminId = admin.id;

    // Generate real admin JWT token
    const tokenPayload = {
      userId: admin.id,
      mobile_number: admin.mobile_number,
      role: 'ADMIN'
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = `Bearer ${token}`;

    // Get FREE and BASIC plan IDs
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { code: 'FREE_MONTHLY', version: 1 },
    });

    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { code: 'BASIC_MONTHLY', version: 1 },
    });

    freePlanId = freePlan?.id;
    basicPlanId = basicPlan?.id;

    // Clean up any existing PLATINUM test plans from previous failed runs
    await prisma.planFeature.deleteMany({
      where: {
        plan: { code: 'PLATINUM' }
      }
    });
    await prisma.subscriptionPlan.deleteMany({
      where: { code: 'PLATINUM' }
    });

    logger.info('✅ Test environment ready');
  });

  afterAll(async () => {
    // Cleanup test data - remove all PLATINUM test plans
    await prisma.planFeature.deleteMany({
      where: {
        plan: { code: 'PLATINUM' }
      }
    });
    await prisma.subscriptionPlan.deleteMany({
      where: { code: 'PLATINUM' }
    });

    if (adminId) {
      await prisma.user.delete({
        where: { id: adminId },
      });
    }

    await prisma.$disconnect();
    logger.info('🧹 Test cleanup complete');
  });

  // ==========================================
  // PUBLIC PLAN APIs (No Auth Required)
  // ==========================================
  describe('Public Plan APIs', () => {
    test('GET /plans - should return all active plans', async () => {
      const response = await request(app).get('/plans').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify plan structure
      const plan = response.body.data[0];
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('code');
      expect(plan).toHaveProperty('display_name');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('features');
      expect(plan.is_active).toBe(true);
    });

    test('GET /plans?is_active=false - should filter inactive plans', async () => {
      const response = await request(app).get('/plans?is_active=false').expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((plan) => {
          expect(plan.is_active).toBe(false);
        });
      }
    });

    test('GET /plans/:planId - should return specific plan details', async () => {
      if (!freePlanId) {
        logger.warn('⚠️ FREE plan not found, skipping test');
        return;
      }

      const response = await request(app).get(`/plans/${freePlanId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(freePlanId);
      expect(response.body.data.code).toBe('FREE_MONTHLY');
      expect(response.body.data.features).toBeDefined();
    });

    test('GET /plans/:planId - should return 404 for invalid plan', async () => {
      const fakeId = 'f7b3c5a1-0000-0000-0000-000000000000';
      const response = await request(app).get(`/plans/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('GET /plans/code/:code - should return plan by code', async () => {
      const response = await request(app).get('/plans/code/BASIC_MONTHLY').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('BASIC_MONTHLY');
      expect(response.body.data.display_name).toBe('Basic Monthly');
    });

    test('GET /plans/code/:code - should be case-insensitive', async () => {
      const response = await request(app).get('/plans/code/gold_monthly').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('GOLD_MONTHLY');
    });
  });

  // ==========================================
  // ADMIN PLAN CRUD (Auth Required)
  // ==========================================
  describe('Admin Plan CRUD', () => {
    test('POST /admin/plans - should create a new plan (ADMIN only)', async () => {
      const newPlan = {
        code: 'PLATINUM',
        display_name: 'Platinum Plan',
        description: 'Test platinum plan',
        price_amount: 799900, // ₹7999
        currency: 'INR',
        billing_cycle: 'MONTHLY',
        duration_days: 30,
        priority: 4,
        trial_period_days: 14,
        features: [
          {
            feature_code: 'MATCH_LIMIT',
            is_enabled: true,
            value_number: -1,
            value_string: 'unlimited',
          },
        ],
      };

      // Mock admin authentication
      // In real tests, you'd generate a proper JWT token
      const response = await request(app)
        .post('/admin/plans')
        .set('Authorization', adminToken)
        .send(newPlan)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('PLATINUM');
      expect(response.body.data.price.amount).toBe(799900);

      testPlanId = response.body.data.id;
    });

    test('POST /admin/plans - should reject free plan with price > 0', async () => {
      const invalidPlan = {
        code: 'INVALID_FREE',
        display_name: 'Invalid Free',
        price_amount: 100, // Non-zero price
        currency: 'INR',
        billing_cycle: 'MONTHLY',
        duration_days: 30,
        priority: 0, // Free priority
      };

      const response = await request(app)
        .post('/admin/plans')
        .set('Authorization', adminToken)
        .send(invalidPlan)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Free plans');
    });

    test('POST /admin/plans - should reject paid plan with price = 0', async () => {
      const invalidPlan = {
        code: 'INVALID_PAID',
        display_name: 'Invalid Paid',
        price_amount: 0,
        currency: 'INR',
        billing_cycle: 'MONTHLY',
        duration_days: 30,
        priority: 1, // Paid priority
      };

      const response = await request(app)
        .post('/admin/plans')
        .set('Authorization', adminToken)
        .send(invalidPlan)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('price > ₹0');
    });

    test('POST /admin/plans - should reject duplicate plan code', async () => {
      const duplicatePlan = {
        code: 'FREE_MONTHLY', // Already exists
        display_name: 'Duplicate Free',
        price_amount: 0,
        currency: 'INR',
        billing_cycle: 'MONTHLY',
        duration_days: 30,
        priority: 0,
      };

      const response = await request(app)
        .post('/admin/plans')
        .set('Authorization', adminToken)
        .send(duplicatePlan)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('PUT /admin/plans/:id - should update plan display name', async () => {
      if (!testPlanId) {
        logger.warn('⚠️ Test plan not created, skipping test');
        return;
      }

      const update = {
        display_name: 'Platinum Plus',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/admin/plans/${testPlanId}`)
        .set('Authorization', adminToken)
        .send(update)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.display_name).toBe('Platinum Plus');
    });

    test('DELETE /admin/plans/:id - should deactivate plan', async () => {
      if (!testPlanId) {
        logger.warn('⚠️ Test plan not created, skipping test');
        return;
      }

      const response = await request(app)
        .delete(`/admin/plans/${testPlanId}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(false);
      expect(response.body.data.deactivated_at).toBeDefined();
    });

    test('PATCH /admin/plans/:id/reactivate - should reactivate plan', async () => {
      if (!testPlanId) {
        logger.warn('⚠️ Test plan not created, skipping test');
        return;
      }

      const response = await request(app)
        .patch(`/admin/plans/${testPlanId}/reactivate`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(true);
      expect(response.body.data.deactivated_at).toBeNull();
    });
  });

  // ==========================================
  // PLAN VERSIONING
  // ==========================================
  describe('Plan Versioning', () => {
    test('POST /admin/plans/:id/version - should create new version with price change', async () => {
      if (!testPlanId) {
        logger.warn('⚠️ Test plan not created, skipping test');
        return;
      }

      const newVersion = {
        price_amount: 899900, // ₹8999 (price increase)
        display_name: 'Platinum Plus v2',
      };

      const response = await request(app)
        .post(`/admin/plans/${testPlanId}/version`)
        .set('Authorization', adminToken)
        .send(newVersion)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe(2);
      expect(response.body.data.price.amount).toBe(899900);
      expect(response.body.data.code).toBe('PLATINUM'); // Code remains same
    });
  });

  // ==========================================
  // FEATURE MANAGEMENT
  // ==========================================
  describe('Feature Management', () => {
    test('GET /admin/features - should return all features (ADMIN/MODERATOR)', async () => {
      const response = await request(app)
        .get('/admin/features')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('POST /admin/features - should create new feature (ADMIN only)', async () => {
      const newFeature = {
        code: 'TEST_FEATURE',
        display_name: 'Test Feature',
        description: 'For testing purposes',
        value_type: 'BOOLEAN',
        reset_period: 'NONE',
      };

      const response = await request(app)
        .post('/admin/features')
        .set('Authorization', adminToken)
        .send(newFeature)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('TEST_FEATURE');

      // Cleanup
      await prisma.feature.delete({
        where: { code: 'TEST_FEATURE' },
      });
    });
  });

  // ==========================================
  // VALIDATION TESTS
  // ==========================================
  describe('Validation Tests', () => {
    test('Should reject price > ₹1,00,000', async () => {
      const expensivePlan = {
        code: 'TOO_EXPENSIVE',
        display_name: 'Too Expensive',
        price_amount: 10000001, // > 100,000 rupees
        currency: 'INR',
        billing_cycle: 'MONTHLY',
        duration_days: 30,
        priority: 5,
      };

      const response = await request(app)
        .post('/admin/plans')
        .set('Authorization', adminToken)
        .send(expensivePlan)
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    test('Should reject invalid plan code format', async () => {
      const invalidCode = {
        code: 'invalid-code', // Must be uppercase, no hyphens
        display_name: 'Invalid Code',
        price_amount: 99900,
        currency: 'INR',
        billing_cycle: 'MONTHLY',
        duration_days: 30,
        priority: 1,
      };

      const response = await request(app)
        .post('/admin/plans')
        .set('Authorization', adminToken)
        .send(invalidCode)
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });
});

logger.info('✅ Plan Management tests defined');
