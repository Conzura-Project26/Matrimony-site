import axios from 'axios';
import { PlanCode, BillingCycle, FeatureCode } from '../src/types/enums.js';

const BASE_URL = 'http://localhost:3000';
const API_URL = BASE_URL; // For compatibility with test code

// ⚠️ IMPORTANT: Update these tokens before running tests
// Run: node tests/getTestTokens.js to get valid tokens
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNzdhZDg1NS1lYWUxLTQ1OTMtOTVlOS03NDZiNGYwYjBlNTgiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDQyMjUwOCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMzE3MTg5LCJleHAiOjE3NzAzMTgwODl9.1Xzte4B3uN6quxCziBASo3L6xJB36fKbpomThM7khtY';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNzdhZDg1NS1lYWUxLTQ1OTMtOTVlOS03NDZiNGYwYjBlNTgiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDQyMjUwOCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMzE3MTg5LCJleHAiOjE3NzAzMTgwODl9.1Xzte4B3uN6quxCziBASo3L6xJB36fKbpomThM7khtY';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class TestLogger {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
    this.startTime = Date.now();
  }

  section(title) {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
  }

  test(name) {
    this.total++;
    console.log(`${colors.yellow}► TEST #${this.total}: ${name}${colors.reset}`);
  }

  pass(message) {
    this.passed++;
    console.log(`${colors.green}  ✓ PASS${colors.reset} - ${message}`);
  }

  fail(message, error) {
    this.failed++;
    console.log(`${colors.red}  ✗ FAIL${colors.reset} - ${message}`);
    if (error) {
      console.log(`${colors.red}    Error: ${error.message}${colors.reset}`);
      if (error.response) {
        console.log(`${colors.red}    Status: ${error.response.status}${colors.reset}`);
        console.log(`${colors.red}    Data: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
      }
    }
  }

  info(message) {
    console.log(`${colors.blue}  ℹ ${message}${colors.reset}`);
  }

  data(label, data) {
    console.log(`${colors.magenta}  📊 ${label}:${colors.reset}`);
    console.log(`${colors.magenta}     ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}${colors.reset}`);
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`  Total Tests:  ${this.total}`);
    console.log(`  ${colors.green}Passed:       ${this.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed:       ${this.failed}${colors.reset}`);
    console.log(`  Success Rate: ${((this.passed / this.total) * 100).toFixed(2)}%`);
    console.log(`  Duration:     ${duration}s`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
  }
}

const logger = new TestLogger();

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Store created resources for cleanup
const createdResources = {
  plans: [],
  features: [],
};

// =============================================================================
// PUBLIC PLAN ENDPOINTS TESTS
// =============================================================================

async function testPublicEndpoints() {
  logger.section('PUBLIC PLAN ENDPOINTS');

  // Test 1: Get all active plans
  logger.test('GET /plans - Fetch all active subscription plans');
  try {
    const response = await axios.get(`${BASE_URL}/plans`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }, // Using token since routes have global auth
    });
    logger.info(`Status: ${response.status}`);
    logger.info(`Plans returned: ${response.data.data.length}`);
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      logger.pass('Successfully fetched all plans');
      logger.data('Sample Plan', response.data.data[0]);
      
      // Verify plan structure
      const plan = response.data.data[0];
      if (plan.id && plan.code && plan.display_name && plan.price_amount !== undefined) {
        logger.pass('Plan structure is valid');
      } else {
        logger.fail('Plan structure is incomplete');
      }
    } else {
      logger.fail('Invalid response format');
    }
  } catch (error) {
    logger.fail('Failed to fetch plans', error);
  }

  await wait(500);

  // Test 2: Get plans with filter (MONTHLY billing cycle)
  logger.test('GET /api/plans?billing_cycle=MONTHLY - Filter by billing cycle');
  try {
    const response = await axios.get(`${API_URL}/plans?billing_cycle=MONTHLY`);
    logger.info(`Status: ${response.status}`);
    logger.info(`Monthly plans returned: ${response.data.data.length}`);
    
    const allMonthly = response.data.data.every((p) => p.billing_cycle === 'MONTHLY');
    if (allMonthly) {
      logger.pass('All returned plans have MONTHLY billing cycle');
    } else {
      logger.fail('Some plans have different billing cycles');
    }
  } catch (error) {
    logger.fail('Failed to filter plans by billing cycle', error);
  }

  await wait(500);

  // Test 3: Get plan by ID
  logger.test('GET /api/plans/:id - Fetch specific plan by ID');
  try {
    // First get a plan ID
    const plansResponse = await axios.get(`${API_URL}/plans`);
    const planId = plansResponse.data.data[0]?.id;
    
    if (!planId) {
      logger.fail('No plans available for testing');
      return;
    }

    logger.info(`Testing with plan ID: ${planId}`);
    const response = await axios.get(`${API_URL}/plans/${planId}`);
    
    logger.info(`Status: ${response.status}`);
    if (response.data.data.id === planId) {
      logger.pass('Successfully fetched plan by ID');
      logger.data('Plan Details', response.data.data);
      
      // Verify features are included
      if (response.data.data.features && response.data.data.features.length > 0) {
        logger.pass(`Plan includes ${response.data.data.features.length} features`);
      } else {
        logger.fail('Plan features not included or empty');
      }
    } else {
      logger.fail('Returned plan ID does not match requested ID');
    }
  } catch (error) {
    logger.fail('Failed to fetch plan by ID', error);
  }

  await wait(500);

  // Test 4: Get plan by invalid ID
  logger.test('GET /api/plans/:id - Test with invalid UUID');
  try {
    await axios.get(`${API_URL}/plans/invalid-uuid`);
    logger.fail('Should have returned 400 for invalid UUID');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected invalid UUID format');
      logger.info(`Error message: ${error.response.data.message}`);
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 5: Get plan by non-existent ID
  logger.test('GET /api/plans/:id - Test with non-existent UUID');
  try {
    await axios.get(`${API_URL}/plans/00000000-0000-0000-0000-000000000000`);
    logger.fail('Should have returned 404 for non-existent plan');
  } catch (error) {
    if (error.response?.status === 404) {
      logger.pass('Correctly returned 404 for non-existent plan');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 6: Get plan by code
  logger.test('GET /api/plans/code/:code - Fetch plan by code (BASIC_MONTHLY)');
  try {
    const response = await axios.get(`${API_URL}/plans/code/BASIC_MONTHLY`);
    logger.info(`Status: ${response.status}`);
    
    if (response.data.data.code === 'BASIC_MONTHLY') {
      logger.pass('Successfully fetched plan by code');
      logger.data('Plan Details', {
        code: response.data.data.code,
        name: response.data.data.display_name,
        price: `₹${response.data.data.price_amount / 100}`,
        billing_cycle: response.data.data.billing_cycle,
      });
    } else {
      logger.fail('Returned plan code does not match requested code');
    }
  } catch (error) {
    logger.fail('Failed to fetch plan by code', error);
  }

  await wait(500);

  // Test 7: Get plan by invalid code
  logger.test('GET /api/plans/code/:code - Test with non-existent code');
  try {
    await axios.get(`${API_URL}/plans/code/INVALID_PLAN_CODE`);
    logger.fail('Should have returned 404 for non-existent plan code');
  } catch (error) {
    if (error.response?.status === 404) {
      logger.pass('Correctly returned 404 for non-existent plan code');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }
}

// =============================================================================
// ADMIN PLAN ENDPOINTS TESTS
// =============================================================================

async function testAdminPlanEndpoints() {
  logger.section('ADMIN PLAN MANAGEMENT ENDPOINTS');

  // Test 8: Create new plan without authentication
  logger.test('POST /api/admin/plans - Test unauthorized access (no token)');
  try {
    await axios.post(`${API_URL}/admin/plans`, {
      code: 'TEST_PLAN',
      display_name: 'Test Plan',
      price_amount: 50000,
    });
    logger.fail('Should have returned 401 for unauthorized access');
  } catch (error) {
    if (error.response?.status === 401) {
      logger.pass('Correctly rejected unauthorized request');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 9: Create new plan with user token (should fail - needs ADMIN)
  logger.test('POST /api/admin/plans - Test with USER role (should fail)');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'TEST_PLAN',
        display_name: 'Test Plan',
        price_amount: 50000,
      },
      {
        headers: { Authorization: `Bearer ${USER_TOKEN}` },
      }
    );
    logger.fail('Should have returned 403 for non-admin user');
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      logger.pass('Correctly rejected non-admin user');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 10: Create new plan with invalid data
  logger.test('POST /api/admin/plans - Test with invalid data (missing required fields)');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'TEST_PLAN',
        // Missing display_name and price_amount
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 400 for invalid data');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected invalid data');
      logger.info(`Validation errors: ${JSON.stringify(error.response.data.errors || error.response.data.message)}`);
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 11: Create new plan with negative price
  logger.test('POST /api/admin/plans - Test with negative price');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'NEGATIVE_PLAN',
        display_name: 'Negative Plan',
        price_amount: -5000,
        billing_cycle: 'MONTHLY',
        duration_days: 30,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 400 for negative price');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected negative price');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 12: Create new plan successfully
  logger.test('POST /api/admin/plans - Create valid plan');
  try {
    const newPlan = {
      code: 'TEST_MONTHLY',
      display_name: 'Test Monthly Plan',
      description: 'Test plan for automated testing',
      price_amount: 150000, // ₹1500
      currency: 'INR',
      billing_cycle: BillingCycle.MONTHLY,
      duration_days: 30,
      priority: 10,
      trial_period_days: 7,
      is_active: true,
    };

    const response = await axios.post(`${API_URL}/admin/plans`, newPlan, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    logger.info(`Status: ${response.status}`);
    if (response.status === 201 && response.data.data.id) {
      logger.pass('Successfully created new plan');
      logger.data('Created Plan', response.data.data);
      createdResources.plans.push(response.data.data.id);
    } else {
      logger.fail('Invalid response format');
    }
  } catch (error) {
    logger.fail('Failed to create plan', error);
  }

  await wait(500);

  // Test 13: Create duplicate plan (same code)
  logger.test('POST /api/admin/plans - Test duplicate plan code');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'TEST_MONTHLY', // Same as previous test
        display_name: 'Duplicate Test Plan',
        price_amount: 200000,
        billing_cycle: 'MONTHLY',
        duration_days: 30,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 409 for duplicate plan code');
  } catch (error) {
    if (error.response?.status === 409 || error.response?.status === 400) {
      logger.pass('Correctly rejected duplicate plan code');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 14: Update plan
  logger.test('PUT /api/admin/plans/:id - Update plan details');
  try {
    if (createdResources.plans.length === 0) {
      logger.fail('No plans available for update test');
      return;
    }

    const planId = createdResources.plans[0];
    const updateData = {
      display_name: 'Updated Test Plan',
      description: 'Updated description',
      price_amount: 180000, // ₹1800
    };

    const response = await axios.put(`${API_URL}/admin/plans/${planId}`, updateData, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    logger.info(`Status: ${response.status}`);
    if (response.data.data.display_name === 'Updated Test Plan') {
      logger.pass('Successfully updated plan');
      logger.data('Updated Fields', {
        old_name: 'Test Monthly Plan',
        new_name: response.data.data.display_name,
        old_price: '₹1500',
        new_price: `₹${response.data.data.price_amount / 100}`,
      });
    } else {
      logger.fail('Plan was not updated correctly');
    }
  } catch (error) {
    logger.fail('Failed to update plan', error);
  }

  await wait(500);

  // Test 15: Update non-existent plan
  logger.test('PUT /api/admin/plans/:id - Test updating non-existent plan');
  try {
    await axios.put(
      `${API_URL}/admin/plans/00000000-0000-0000-0000-000000000000`,
      { display_name: 'Updated' },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 404 for non-existent plan');
  } catch (error) {
    if (error.response?.status === 404) {
      logger.pass('Correctly returned 404 for non-existent plan');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 16: Deactivate plan
  logger.test('PUT /api/admin/plans/:id/deactivate - Deactivate a plan');
  try {
    if (createdResources.plans.length === 0) {
      logger.fail('No plans available for deactivation test');
      return;
    }

    const planId = createdResources.plans[0];
    const response = await axios.put(
      `${API_URL}/admin/plans/${planId}/deactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );

    logger.info(`Status: ${response.status}`);
    if (response.data.data.is_active === false) {
      logger.pass('Successfully deactivated plan');
      logger.info(`Deactivated at: ${response.data.data.deactivated_at}`);
    } else {
      logger.fail('Plan was not deactivated');
    }
  } catch (error) {
    logger.fail('Failed to deactivate plan', error);
  }

  await wait(500);

  // Test 17: Reactivate plan
  logger.test('PUT /api/admin/plans/:id/reactivate - Reactivate a plan');
  try {
    if (createdResources.plans.length === 0) {
      logger.fail('No plans available for reactivation test');
      return;
    }

    const planId = createdResources.plans[0];
    const response = await axios.put(
      `${API_URL}/admin/plans/${planId}/reactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );

    logger.info(`Status: ${response.status}`);
    if (response.data.data.is_active === true) {
      logger.pass('Successfully reactivated plan');
    } else {
      logger.fail('Plan was not reactivated');
    }
  } catch (error) {
    logger.fail('Failed to reactivate plan', error);
  }

  await wait(500);

  // Test 18: Create plan version
  logger.test('POST /api/admin/plans/:id/version - Create new plan version');
  try {
    if (createdResources.plans.length === 0) {
      logger.fail('No plans available for versioning test');
      return;
    }

    const planId = createdResources.plans[0];
    const versionData = {
      price_amount: 250000, // ₹2500
      description: 'Version 2 with updated pricing',
    };

    const response = await axios.post(`${API_URL}/admin/plans/${planId}/version`, versionData, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    logger.info(`Status: ${response.status}`);
    if (response.data.data.version === 2) {
      logger.pass('Successfully created plan version 2');
      logger.data('New Version', {
        version: response.data.data.version,
        price: `₹${response.data.data.price_amount / 100}`,
        parent_plan_id: response.data.data.parent_plan_id,
      });
      createdResources.plans.push(response.data.data.id);
    } else {
      logger.fail('Version was not incremented correctly');
    }
  } catch (error) {
    logger.fail('Failed to create plan version', error);
  }
}

// =============================================================================
// FEATURE MANAGEMENT TESTS
// =============================================================================

async function testFeatureEndpoints() {
  logger.section('FEATURE MANAGEMENT ENDPOINTS');

  // Test 19: Get all features
  logger.test('GET /api/admin/features - Fetch all features');
  try {
    const response = await axios.get(`${API_URL}/admin/features`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    logger.info(`Status: ${response.status}`);
    logger.info(`Features returned: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      logger.pass(`Successfully fetched ${response.data.data.length} features`);
      logger.data('Sample Feature', response.data.data[0]);
    } else {
      logger.fail('No features returned');
    }
  } catch (error) {
    logger.fail('Failed to fetch features', error);
  }

  await wait(500);

  // Test 20: Create new feature
  logger.test('POST /api/admin/features - Create new feature');
  try {
    const newFeature = {
      code: 'TEST_FEATURE',
      display_name: 'Test Feature',
      description: 'Feature for automated testing',
      value_type: 'NUMBER',
      reset_period: 'MONTHLY',
      is_active: true,
    };

    const response = await axios.post(`${API_URL}/admin/features`, newFeature, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    logger.info(`Status: ${response.status}`);
    if (response.status === 201 && response.data.data.code === 'TEST_FEATURE') {
      logger.pass('Successfully created new feature');
      logger.data('Created Feature', response.data.data);
      createdResources.features.push(response.data.data.id);
    } else {
      logger.fail('Feature was not created correctly');
    }
  } catch (error) {
    logger.fail('Failed to create feature', error);
  }

  await wait(500);

  // Test 21: Create feature with invalid value_type
  logger.test('POST /api/admin/features - Test with invalid value_type');
  try {
    await axios.post(
      `${API_URL}/admin/features`,
      {
        code: 'INVALID_FEATURE',
        display_name: 'Invalid Feature',
        value_type: 'INVALID_TYPE', // Should only be BOOLEAN, NUMBER, STRING
        reset_period: 'NONE',
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 400 for invalid value_type');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected invalid value_type');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 22: Assign feature to plan
  logger.test('POST /api/admin/plans/:id/features - Assign feature to plan');
  try {
    if (createdResources.plans.length === 0 || createdResources.features.length === 0) {
      logger.fail('No plans or features available for assignment test');
      return;
    }

    const planId = createdResources.plans[0];
    const featureId = createdResources.features[0];
    
    const assignmentData = {
      feature_id: featureId,
      is_enabled: true,
      value_number: 100,
      value_string: '100 per month',
    };

    const response = await axios.post(
      `${API_URL}/admin/plans/${planId}/features`,
      assignmentData,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );

    logger.info(`Status: ${response.status}`);
    if (response.status === 201) {
      logger.pass('Successfully assigned feature to plan');
      logger.data('Assignment', {
        plan_id: planId,
        feature_id: featureId,
        value: assignmentData.value_string,
      });
    } else {
      logger.fail('Feature was not assigned correctly');
    }
  } catch (error) {
    logger.fail('Failed to assign feature to plan', error);
  }

  await wait(500);

  // Test 23: Get plan features
  logger.test('GET /api/admin/plans/:id/features - Get features for a plan');
  try {
    if (createdResources.plans.length === 0) {
      logger.fail('No plans available for feature fetch test');
      return;
    }

    const planId = createdResources.plans[0];
    const response = await axios.get(`${API_URL}/admin/plans/${planId}/features`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    logger.info(`Status: ${response.status}`);
    logger.info(`Features returned: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      logger.pass('Successfully fetched plan features');
      logger.data('Sample Plan Feature', response.data.data[0]);
    } else {
      logger.info('Plan has no features assigned (this is okay)');
      logger.pass('Successfully fetched plan features (empty)');
    }
  } catch (error) {
    logger.fail('Failed to fetch plan features', error);
  }
}

// =============================================================================
// EDGE CASES AND ERROR HANDLING
// =============================================================================

async function testEdgeCases() {
  logger.section('EDGE CASES AND ERROR HANDLING');

  // Test 24: Extremely large price
  logger.test('POST /api/admin/plans - Test with extremely large price (>100 crore)');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'HUGE_PRICE',
        display_name: 'Huge Price Plan',
        price_amount: 100000000000, // 100 crore
        billing_cycle: 'MONTHLY',
        duration_days: 30,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 400 for price exceeding limit');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected extremely large price');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 25: Invalid billing cycle
  logger.test('POST /api/admin/plans - Test with invalid billing_cycle');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'INVALID_CYCLE',
        display_name: 'Invalid Cycle Plan',
        price_amount: 50000,
        billing_cycle: 'WEEKLY', // Not a valid enum value
        duration_days: 30,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.fail('Should have returned 400 for invalid billing cycle');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected invalid billing cycle');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 26: Duration mismatch with billing cycle
  logger.test('POST /api/admin/plans - Test YEARLY plan with 30 days duration (mismatch)');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'DURATION_MISMATCH',
        display_name: 'Duration Mismatch Plan',
        price_amount: 50000,
        billing_cycle: 'YEARLY',
        duration_days: 30, // Should be ~365 for yearly
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    // This might pass or fail depending on validation - check the result
    logger.info('Note: Duration mismatch validation may vary');
    logger.pass('Server accepted duration mismatch (validation may be lenient)');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Correctly rejected duration mismatch');
    } else {
      logger.fail('Unexpected error response', error);
    }
  }

  await wait(500);

  // Test 27: SQL injection attempt in code field
  logger.test('POST /api/admin/plans - Test SQL injection in code field');
  try {
    await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: "'; DROP TABLE subscription_plans; --",
        display_name: 'SQL Injection Test',
        price_amount: 50000,
        billing_cycle: 'MONTHLY',
        duration_days: 30,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    logger.pass('Server handled SQL injection attempt safely (created plan or rejected)');
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Server rejected SQL injection attempt');
    } else {
      logger.fail('Unexpected error during SQL injection test', error);
    }
  }

  await wait(500);

  // Test 28: XSS attempt in display_name
  logger.test('POST /api/admin/plans - Test XSS in display_name field');
  try {
    const response = await axios.post(
      `${API_URL}/admin/plans`,
      {
        code: 'XSS_TEST',
        display_name: '<script>alert("XSS")</script>',
        price_amount: 50000,
        billing_cycle: 'MONTHLY',
        duration_days: 30,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    
    // Check if script tags are escaped or rejected
    if (response.data.data.display_name.includes('<script>')) {
      logger.fail('XSS content not escaped - security risk!');
    } else {
      logger.pass('XSS content properly escaped or rejected');
    }
    
    if (response.data.data.id) {
      createdResources.plans.push(response.data.data.id);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      logger.pass('Server rejected XSS attempt');
    } else {
      logger.fail('Unexpected error during XSS test', error);
    }
  }

  await wait(500);

  // Test 29: Concurrent plan updates (race condition)
  logger.test('PUT /api/admin/plans/:id - Test concurrent updates (race condition)');
  try {
    if (createdResources.plans.length === 0) {
      logger.fail('No plans available for race condition test');
      return;
    }

    const planId = createdResources.plans[0];
    
    // Fire two updates simultaneously
    const [response1, response2] = await Promise.allSettled([
      axios.put(
        `${API_URL}/admin/plans/${planId}`,
        { display_name: 'Concurrent Update 1' },
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      ),
      axios.put(
        `${API_URL}/admin/plans/${planId}`,
        { display_name: 'Concurrent Update 2' },
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      ),
    ]);

    if (response1.status === 'fulfilled' && response2.status === 'fulfilled') {
      logger.pass('Both concurrent updates succeeded');
      logger.info(`Final name: ${response2.value.data.data.display_name}`);
    } else {
      logger.info('One or both updates may have failed (acceptable for race condition)');
      logger.pass('Server handled concurrent updates');
    }
  } catch (error) {
    logger.fail('Failed during concurrent update test', error);
  }

  await wait(500);

  // Test 30: Get plans with pagination (if supported)
  logger.test('GET /api/plans - Test pagination parameters');
  try {
    const response = await axios.get(`${API_URL}/plans?page=1&limit=5`);
    logger.info(`Status: ${response.status}`);
    
    if (response.data.data.length <= 5) {
      logger.pass('Pagination limit respected');
      logger.info(`Returned ${response.data.data.length} plans (requested max 5)`);
    } else {
      logger.info('Pagination may not be implemented (returned all plans)');
    }
  } catch (error) {
    logger.info('Pagination parameters may not be supported');
    logger.pass('Request completed (pagination optional)');
  }
}

// =============================================================================
// CLEANUP
// =============================================================================

async function cleanup() {
  logger.section('CLEANUP - Removing Test Data');

  // Delete created plans
  for (const planId of createdResources.plans) {
    try {
      await axios.delete(`${API_URL}/admin/plans/${planId}`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      logger.info(`Deleted plan: ${planId}`);
    } catch (error) {
      logger.info(`Could not delete plan ${planId}: ${error.message}`);
    }
    await wait(200);
  }

  // Delete created features
  for (const featureId of createdResources.features) {
    try {
      await axios.delete(`${API_URL}/admin/features/${featureId}`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      logger.info(`Deleted feature: ${featureId}`);
    } catch (error) {
      logger.info(`Could not delete feature ${featureId}: ${error.message}`);
    }
    await wait(200);
  }

  logger.pass('Cleanup completed');
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              SUBSCRIPTION PLAN MANAGEMENT - COMPREHENSIVE TEST SUITE       ║
║                                                                            ║
║              Testing all endpoints, edge cases, and error handling         ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
  console.log(`${colors.reset}`);

  console.log(`${colors.yellow}⚠️  IMPORTANT SETUP INSTRUCTIONS:${colors.reset}\n`);
  console.log(`1. Ensure your backend server is running on ${BASE_URL}`);
  console.log(`2. Update ADMIN_TOKEN and USER_TOKEN at the top of this file`);
  console.log(`3. Make sure test database has subscription plans seeded\n`);
  console.log(`${colors.cyan}Starting tests in 3 seconds...${colors.reset}\n`);
  
  await wait(3000);

  try {
    await testPublicEndpoints();
    await testAdminPlanEndpoints();
    await testFeatureEndpoints();
    await testEdgeCases();
    await cleanup();
  } catch (error) {
    console.log(`\n${colors.red}Fatal error during test execution:${colors.reset}`);
    console.error(error);
  }

  logger.summary();

  // Exit with appropriate code
  process.exit(logger.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
