/**
 * Partner Preferences API Test Suite
 * Tests for Task 2.7: Partner Preferences CRUD
 * 
 * Test Coverage:
 * - Create partner preferences (POST)
 * - Update partner preferences (PUT)
 * - Get partner preferences (GET)
 * - Preference matching algorithm
 * - Validation and error handling
 * - Authorization checks
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

// ============================================
// TEST CONFIGURATION
// ============================================

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let userId = '';
let targetUserId = '';

// Test credentials
const TEST_USER = {
  mobile_number: '9876543210',
  full_name: 'Test Partner Pref User',
  gender: 'Male',
  date_of_birth: '1995-01-15',
  password: 'Test@1234',
  profile_created_by: 'Self'
};

const TARGET_USER = {
  mobile_number: '9876543211',
  full_name: 'Target Match User',
  gender: 'Female',
  date_of_birth: '1997-05-20',
  password: 'Test@1234',
  profile_created_by: 'Self'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Helper: Make HTTP request
 */
const makeRequest = async (method, endpoint, data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData,
  };
};

/**
 * Helper: Send OTP and verify
 */
const sendAndVerifyOtp = async (mobileNumber) => {
  // Send OTP
  await makeRequest('POST', '/auth/send-otp', { mobile_number: mobileNumber });
  
  // For testing, we use a fixed OTP (you may need to retrieve from logs in production)
  const otpCode = '123456'; // Replace with actual OTP retrieval logic
  
  // Verify OTP
  const verifyResponse = await makeRequest('POST', '/auth/verify-otp', {
    mobile_number: mobileNumber,
    otp_code: otpCode,
  });
  
  return verifyResponse;
};

/**
 * Helper: Register a test user
 */
const registerUser = async (userData) => {
  const response = await makeRequest('POST', '/auth/signup', userData);
  return response;
};

/**
 * Helper: Login user
 */
const loginUser = async (identifier, password) => {
  const response = await makeRequest('POST', '/auth/login', {
    identifier,
    password,
  });
  return response;
};

// ============================================
// SETUP AND TEARDOWN
// ============================================

beforeAll(async () => {
  console.log('🚀 Setting up Partner Preferences tests...\n');
  
  // Register and login main test user
  try {
    await registerUser(TEST_USER);
    const loginResponse = await loginUser(TEST_USER.mobile_number, TEST_USER.password);
    authToken = loginResponse.data.data.access_token;
    userId = loginResponse.data.data.user.id;
    console.log(`✅ Main test user logged in: ${userId}\n`);
  } catch (error) {
    console.error('❌ Failed to setup main test user:', error.message);
  }
  
  // Register target user for matching tests
  try {
    await registerUser(TARGET_USER);
    const targetLoginResponse = await loginUser(TARGET_USER.mobile_number, TARGET_USER.password);
    targetUserId = targetLoginResponse.data.data.user.id;
    console.log(`✅ Target user created: ${targetUserId}\n`);
  } catch (error) {
    console.error('❌ Failed to setup target user:', error.message);
  }
});

// ============================================
// TEST SUITE: CREATE PARTNER PREFERENCES
// ============================================

describe('POST /users/:userId/preferences - Create Partner Preferences', () => {
  
  it('T2.7.1 - Should create partner preferences with valid age range', async () => {
    const preferencesData = {
      min_age: 24,
      max_age: 30,
      min_height: 155,
      max_height: 170
    };
    
    const response = await makeRequest(
      'POST',
      `/users/${userId}/preferences`,
      preferencesData,
      authToken
    );
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.partner_preferences.min_age).toBe(24);
    expect(response.data.data.partner_preferences.max_age).toBe(30);
    console.log('✅ T2.7.1 passed - Created preferences with age range');
  });
  
  it('T2.7.2 - Should return 409 when preferences already exist', async () => {
    const preferencesData = {
      min_age: 25,
      max_age: 32
    };
    
    const response = await makeRequest(
      'POST',
      `/users/${userId}/preferences`,
      preferencesData,
      authToken
    );
    
    expect(response.status).toBe(409);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toContain('already exist');
    console.log('✅ T2.7.2 passed - Conflict detected for duplicate preferences');
  });
  
  it('T2.7.3 - Should reject invalid age range (min >= max)', async () => {
    const invalidData = {
      min_age: 35,
      max_age: 30
    };
    
    const response = await makeRequest(
      'POST',
      `/users/${targetUserId}/preferences`,
      invalidData,
      authToken
    );
    
    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
    console.log('✅ T2.7.3 passed - Invalid age range rejected');
  });
  
  it('T2.7.4 - Should create preferences with multiple religion IDs', async () => {
    const preferencesData = {
      min_age: 23,
      max_age: 29,
      religion_preference: [1, 2], // Hindu, Islam
      education_preference: ["Bachelor's Degree", "Master's Degree"],
      location_preference: ["Mumbai", "Pune", "Delhi"]
    };
    
    const response = await makeRequest(
      'POST',
      `/users/${targetUserId}/preferences`,
      preferencesData,
      authToken
    );
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.partner_preferences.religion_preference).toHaveLength(2);
    expect(response.data.data.partner_preferences.location_preference).toHaveLength(3);
    console.log('✅ T2.7.4 passed - Created preferences with arrays');
  });
  
  it('T2.7.5 - Should reject invalid religion ID', async () => {
    const adminUserId = 'test-admin-id'; // Replace with actual admin user
    const invalidData = {
      religion_preference: [999, 1000] // Non-existent IDs
    };
    
    const response = await makeRequest(
      'POST',
      `/users/${adminUserId}/preferences`,
      invalidData,
      authToken
    );
    
    expect(response.status).toBe(400);
    expect(response.data.message).toContain('religion IDs are invalid');
    console.log('✅ T2.7.5 passed - Invalid religion ID rejected');
  });
});

// ============================================
// TEST SUITE: UPDATE PARTNER PREFERENCES
// ============================================

describe('PUT /users/:userId/preferences - Update Partner Preferences', () => {
  
  it('T2.7.6 - Should update partner preferences with new values', async () => {
    const updatedData = {
      min_age: 25,
      max_age: 32,
      marital_status_preference: ["Never Married"],
      diet_preference: ["Vegetarian", "Eggetarian"]
    };
    
    const response = await makeRequest(
      'PUT',
      `/users/${userId}/preferences`,
      updatedData,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.partner_preferences.min_age).toBe(25);
    expect(response.data.data.partner_preferences.marital_status_preference).toHaveLength(1);
    console.log('✅ T2.7.6 passed - Updated preferences successfully');
  });
  
  it('T2.7.7 - Should support partial update (only some fields)', async () => {
    const partialUpdate = {
      employment_type_preference: ["Government Job", "Private Job", "Business"]
    };
    
    const response = await makeRequest(
      'PUT',
      `/users/${userId}/preferences`,
      partialUpdate,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.data.partner_preferences.employment_type_preference).toHaveLength(3);
    // Previous values should remain unchanged
    expect(response.data.data.partner_preferences.min_age).toBe(25);
    console.log('✅ T2.7.7 passed - Partial update successful');
  });
  
  it('T2.7.8 - Should return 404 for non-existent user', async () => {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const updateData = {
      min_age: 26
    };
    
    const response = await makeRequest(
      'PUT',
      `/users/${fakeUserId}/preferences`,
      updateData,
      authToken
    );
    
    expect(response.status).toBe(404);
    expect(response.data.message).toContain('not found');
    console.log('✅ T2.7.8 passed - 404 for non-existent user');
  });
  
  it('T2.7.9 - Should update height preferences', async () => {
    const heightUpdate = {
      min_height: 160,
      max_height: 175
    };
    
    const response = await makeRequest(
      'PUT',
      `/users/${userId}/preferences`,
      heightUpdate,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.data.partner_preferences.min_height).toBe(160);
    expect(response.data.data.partner_preferences.max_height).toBe(175);
    console.log('✅ T2.7.9 passed - Height preferences updated');
  });
});

// ============================================
// TEST SUITE: GET PARTNER PREFERENCES
// ============================================

describe('GET /users/:userId/preferences - Get Partner Preferences', () => {
  
  it('T2.7.10 - Should retrieve existing partner preferences', async () => {
    const response = await makeRequest(
      'GET',
      `/users/${userId}/preferences`,
      null,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.partner_preferences).toBeDefined();
    expect(response.data.data.partner_preferences.min_age).toBeDefined();
    console.log('✅ T2.7.10 passed - Retrieved preferences successfully');
  });
  
  it('T2.7.11 - Should return empty object for user with no preferences', async () => {
    // Create a new user without preferences
    const newUser = {
      mobile_number: '9876543212',
      full_name: 'No Prefs User',
      gender: 'Male',
      date_of_birth: '1996-03-10',
      password: 'Test@1234',
      profile_created_by: 'Self'
    };
    
    await registerUser(newUser);
    const loginResponse = await loginUser(newUser.mobile_number, newUser.password);
    const newUserId = loginResponse.data.data.user.id;
    
    const response = await makeRequest(
      'GET',
      `/users/${newUserId}/preferences`,
      null,
      loginResponse.data.data.access_token
    );
    
    expect(response.status).toBe(200);
    expect(response.data.data.partner_preferences).toEqual({});
    expect(response.data.message).toContain('No partner preferences found');
    console.log('✅ T2.7.11 passed - Empty object returned for no preferences');
  });
  
  it('T2.7.12 - Should allow other users to view preferences (for matching)', async () => {
    // Login as target user and try to view main user's preferences
    const targetLoginResponse = await loginUser(TARGET_USER.mobile_number, TARGET_USER.password);
    const targetToken = targetLoginResponse.data.data.access_token;
    
    const response = await makeRequest(
      'GET',
      `/users/${userId}/preferences`,
      null,
      targetToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    console.log('✅ T2.7.12 passed - Other users can view preferences');
  });
});

// ============================================
// TEST SUITE: PREFERENCE MATCHING ALGORITHM
// ============================================

describe('POST /users/:userId/preferences/match/:targetUserId - Preference Matching', () => {
  
  it('T2.7.13 - Should calculate match score between users', async () => {
    const response = await makeRequest(
      'POST',
      `/users/${userId}/preferences/match/${targetUserId}`,
      null,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.match_result).toBeDefined();
    expect(response.data.data.match_result.matchPercentage).toBeGreaterThanOrEqual(0);
    expect(response.data.data.match_result.matchPercentage).toBeLessThanOrEqual(100);
    expect(response.data.data.match_result.breakdown).toBeDefined();
    console.log(`✅ T2.7.13 passed - Match score: ${response.data.data.match_result.matchPercentage}%`);
  });
  
  it('T2.7.14 - Should provide detailed breakdown by category', async () => {
    const response = await makeRequest(
      'POST',
      `/users/${userId}/preferences/match/${targetUserId}`,
      null,
      authToken
    );
    
    const breakdown = response.data.data.match_result.breakdown;
    
    expect(breakdown.age).toBeDefined();
    expect(breakdown.religion).toBeDefined();
    expect(breakdown.caste).toBeDefined();
    expect(breakdown.education).toBeDefined();
    expect(breakdown.profession).toBeDefined();
    expect(breakdown.location).toBeDefined();
    expect(breakdown.height).toBeDefined();
    
    // Check scoring weights
    expect(breakdown.religion.maxScore).toBe(18);
    expect(breakdown.caste.maxScore).toBe(12);
    expect(breakdown.education.maxScore).toBe(12);
    expect(breakdown.profession.maxScore).toBe(15);
    expect(breakdown.location.maxScore).toBe(18);
    expect(breakdown.height.maxScore).toBe(5);
    
    console.log('✅ T2.7.14 passed - Detailed breakdown provided with correct weights');
  });
  
  it('T2.7.15 - Should use enhanced scoring when requested', async () => {
    const response = await makeRequest(
      'POST',
      `/users/${userId}/preferences/match/${targetUserId}?enhanced=true`,
      null,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.data.match_result.bonusScore).toBeDefined();
    expect(response.data.data.match_result.bonusBreakdown).toBeDefined();
    console.log('✅ T2.7.15 passed - Enhanced scoring with bonus attributes');
  });
  
  it('T2.7.16 - Should fail hard filter if age does not match', async () => {
    // Update preferences to exclude target user's age
    await makeRequest(
      'PUT',
      `/users/${userId}/preferences`,
      { min_age: 40, max_age: 50 }, // Target user is ~27, outside this range
      authToken
    );
    
    const response = await makeRequest(
      'POST',
      `/users/${userId}/preferences/match/${targetUserId}`,
      null,
      authToken
    );
    
    expect(response.status).toBe(200);
    expect(response.data.data.match_result.match).toBe(false);
    expect(response.data.data.match_result.matchPercentage).toBe(0);
    expect(response.data.data.match_result.failReason).toContain('Age does not match');
    console.log('✅ T2.7.16 passed - Hard filter blocks non-matching age');
  });
});

// ============================================
// TEST SUITE: AUTHORIZATION & VALIDATION
// ============================================

describe('Authorization & Validation Tests', () => {
  
  it('T2.7.17 - Should reject request without authentication', async () => {
    const response = await makeRequest(
      'GET',
      `/users/${userId}/preferences`,
      null,
      null // No token
    );
    
    expect(response.status).toBe(401);
    console.log('✅ T2.7.17 passed - Unauthorized without token');
  });
  
  it('T2.7.18 - Should validate minimum field lengths', async () => {
    const invalidData = {
      education_preference: ["A"] // Too short
    };
    
    const response = await makeRequest(
      'PUT',
      `/users/${userId}/preferences`,
      invalidData,
      authToken
    );
    
    expect(response.status).toBe(400);
    console.log('✅ T2.7.18 passed - Validation enforced');
  });
  
  it('T2.7.19 - Should validate enum values for marital status', async () => {
    const invalidData = {
      marital_status_preference: ["Invalid Status"]
    };
    
    const response = await makeRequest(
      'PUT',
      `/users/${userId}/preferences`,
      invalidData,
      authToken
    );
    
    expect(response.status).toBe(400);
    console.log('✅ T2.7.19 passed - Invalid enum rejected');
  });
});

// ============================================
// RUN TESTS
// ============================================

console.log('\n🧪 Starting Partner Preferences Test Suite...\n');
console.log('=' .repeat(60));
console.log('Task 2.7: Partner Preferences CRUD & Matching Algorithm');
console.log('=' .repeat(60) + '\n');

// Note: In actual implementation, use a proper test runner like Jest
// This file demonstrates the test structure and expected behavior
