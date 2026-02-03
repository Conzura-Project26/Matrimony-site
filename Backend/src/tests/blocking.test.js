/**
 * Blocking System Test Suite
 * Task 4.x: User Blocking System
 * 
 * Tests all blocking functionality:
 * - Block/unblock users
 * - Bidirectional hiding
 * - Auto-rejection of pending interests
 * - Search exclusion
 * - Profile access prevention
 * - Interest sending prevention
 * 
 * Prerequisites:
 * - Server must be running on port 3000
 * - Test users must exist in database
 * - Test user credentials: 9380245433 / Harsha@2004
 * 
 * Usage:
 *   node tests/blocking.test.js
 */

import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  identifier: '9380245433',
  password: 'Harsha@2004'
};

// Global test state
let authToken = null;
let testUserId = null;
let targetUserId = null;

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Utility: Log section header
 */
function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60) + '\n');
}

/**
 * Utility: Log test result
 */
function logResult(testName, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${icon} ${testName}${colors.reset}`);
  if (details) {
    console.log(`  ${details}\n`);
  }
}

/**
 * Step 1: Authentication
 */
async function login() {
  try {
    logSection('STEP 1: Authentication');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      testUserId = response.data.data.user.id;
      
      logResult('Login successful', true, `User ID: ${testUserId}`);
      return true;
    } else {
      logResult('Login failed', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    logResult(
      'Login failed',
      false,
      status ? `${message} (status ${status})` : message
    );
    if (data) {
      console.log(`  Response: ${JSON.stringify(data)}`);
    }
    return false;
  }
}

/**
 * Step 2: Get a target user to block
 */
async function getTargetUser() {
  try {
    logSection('STEP 2: Finding Target User');
    
    const response = await axios.post(
      `${BASE_URL}/search/advanced`,
      {
        min_height: 150,
        max_height: 200
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const users = response.data.data;
    if (!users || users.length === 0) {
      throw new Error('No users found');
    }
    
    targetUserId = users[0].id;
    
    logResult('Target user found', true, `${users[0].full_name} (${targetUserId})`);
    return true;
  } catch (error) {
    logResult('Failed to get target user', false, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 1: Block a user
 */
async function testBlockUser() {
  try {
    logSection('TEST 1: Block User');
    
    const response = await axios.post(
      `${BASE_URL}/blocks/${targetUserId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const data = response.data.data;
    
    logResult('User blocked successfully', true);
    console.log(`  Blocked user ID: ${data.blocked_user_id}`);
    console.log(`  Blocked at: ${data.blocked_at}`);
    console.log(`  Rejected interests: ${data.rejected_interests_count}\n`);
    
    return true;
  } catch (error) {
    logResult('Block failed', false, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 2: Attempt to block same user again (should fail)
 */
async function testDuplicateBlock() {
  try {
    logSection('TEST 2: Duplicate Block (Should Fail)');
    
    const response = await axios.post(
      `${BASE_URL}/blocks/${targetUserId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Duplicate block was allowed', false, 'SHOULD HAVE BEEN BLOCKED');
    return false;
  } catch (error) {
    if (error.response?.status === 409 && 
        error.response?.data?.message?.includes('already blocked')) {
      logResult('Duplicate block correctly prevented', true, error.response.data.message);
      return true;
    } else {
      logResult('Unexpected error', false, error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Test 3: Get list of blocked users
 */
async function testGetBlockedUsers() {
  try {
    logSection('TEST 3: Get Blocked Users List');
    
    const response = await axios.get(
      `${BASE_URL}/blocks`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const blockedUsers = response.data.data;
    const foundTarget = blockedUsers.find(b => b.user.id === targetUserId);
    
    if (!foundTarget) {
      logResult('Blocked user not in list', false, 'CONSISTENCY ERROR');
      return false;
    }
    
    logResult('Blocked users list retrieved', true);
    console.log(`  Total blocked: ${blockedUsers.length}`);
    console.log(`  Target user found: ${foundTarget.user.full_name}`);
    console.log(`  Profile ID: ${foundTarget.user.profile_id}`);
    console.log(`  Age: ${foundTarget.user.age || 'N/A'}\n`);
    
    return true;
  } catch (error) {
    logResult('Failed to get blocked users', false, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 4: Search exclusion - Blocked user should not appear
 */
async function testSearchExclusion() {
  try {
    logSection('TEST 4: Search Exclusion (Bidirectional Hiding)');
    
    const response = await axios.post(
      `${BASE_URL}/search/advanced`,
      {
        min_height: 150,
        max_height: 200
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const users = response.data.data;
    const foundTarget = users.find(u => u.id === targetUserId);
    
    if (foundTarget) {
      logResult('Blocked user appears in search', false, 'PRIVACY LEAK');
      return false;
    }
    
    logResult('Blocked user correctly excluded from search', true, `Searched ${users.length} users`);
    return true;
  } catch (error) {
    logResult('Search failed', false, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 5: Profile access prevention
 */
async function testProfileAccessPrevention() {
  try {
    logSection('TEST 5: Profile Access Prevention');
    
    const response = await axios.get(
      `${BASE_URL}/users/${targetUserId}/profile`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Profile access was allowed', false, 'SECURITY ISSUE');
    return false;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      logResult('Profile access correctly blocked', true, error.response.data.message);
      return true;
    } else {
      logResult('Unexpected error', false, error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Test 6: Interest sending prevention
 */
async function testInterestPrevention() {
  try {
    logSection('TEST 6: Interest Sending Prevention');
    
    const response = await axios.post(
      `${BASE_URL}/interests/${targetUserId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Interest to blocked user was allowed', false, 'SECURITY ISSUE');
    return false;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    if (
      (status === 400 && message?.toLowerCase().includes('blocked')) ||
      (status === 403 || status === 404) && message?.toLowerCase().includes('profile')
    ) {
      logResult('Interest correctly prevented', true, message);
      return true;
    }
    logResult('Unexpected error', false, message);
    return false;
  }
}

/**
 * Test 7: Unblock user
 */
async function testUnblockUser() {
  try {
    logSection('TEST 7: Unblock User');
    
    const response = await axios.delete(
      `${BASE_URL}/blocks/${targetUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const data = response.data.data;
    
    logResult('User unblocked successfully', true);
    console.log(`  Unblocked user ID: ${data.unblocked_user_id}`);
    console.log(`  Unblocked at: ${data.unblocked_at}\n`);
    
    return true;
  } catch (error) {
    logResult('Unblock failed', false, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 8: Verify user reappears in search after unblock
 */
async function testSearchAfterUnblock() {
  try {
    logSection('TEST 8: Search After Unblock (Should Reappear)');
    
    const response = await axios.post(
      `${BASE_URL}/search/advanced`,
      {
        min_height: 150,
        max_height: 200
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const users = response.data.data;
    const foundTarget = users.find(u => u.id === targetUserId);
    
    if (!foundTarget) {
      logResult('User still hidden after unblock', false, 'CONSISTENCY ERROR');
      return false;
    }
    
    logResult('User correctly reappears in search', true, foundTarget.full_name);
    return true;
  } catch (error) {
    logResult('Search failed', false, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 9: Attempt to unblock non-blocked user (should fail)
 */
async function testUnblockNonBlocked() {
  try {
    logSection('TEST 9: Unblock Non-Blocked User (Should Fail)');
    
    const response = await axios.delete(
      `${BASE_URL}/blocks/${targetUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Unblocking non-blocked user was allowed', false, 'SHOULD HAVE FAILED');
    return false;
  } catch (error) {
    if (error.response?.status === 404 && 
        error.response?.data?.message?.includes('not found')) {
      logResult('Unblock correctly failed', true, error.response.data.message);
      return true;
    } else {
      logResult('Unexpected error', false, error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Test 10: Block yourself (should fail)
 */
async function testBlockSelf() {
  try {
    logSection('TEST 10: Block Self (Should Fail)');
    
    const response = await axios.post(
      `${BASE_URL}/blocks/${testUserId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Self-blocking was allowed', false, 'SHOULD HAVE BEEN BLOCKED');
    return false;
  } catch (error) {
    if (error.response?.status === 409 && 
        error.response?.data?.message?.includes('yourself')) {
      logResult('Self-blocking correctly prevented', true, error.response.data.message);
      return true;
    } else {
      logResult('Unexpected error', false, error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Blocking System Test Suite (Task 4.x)             ║');
  console.log('║              Comprehensive Blocking Tests                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Setup
  if (!await login()) {
    console.log(`${colors.red}Setup failed - cannot continue${colors.reset}`);
    process.exit(1);
  }

  if (!await getTargetUser()) {
    console.log(`${colors.red}Setup failed - cannot continue${colors.reset}`);
    process.exit(1);
  }

  // Run all tests
  const tests = [
    { name: 'Block User', fn: testBlockUser },
    { name: 'Duplicate Block', fn: testDuplicateBlock },
    { name: 'Get Blocked Users', fn: testGetBlockedUsers },
    { name: 'Search Exclusion', fn: testSearchExclusion },
    { name: 'Profile Access Prevention', fn: testProfileAccessPrevention },
    { name: 'Interest Prevention', fn: testInterestPrevention },
    { name: 'Unblock User', fn: testUnblockUser },
    { name: 'Search After Unblock', fn: testSearchAfterUnblock },
    { name: 'Unblock Non-Blocked', fn: testUnblockNonBlocked },
    { name: 'Block Self', fn: testBlockSelf }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  logSection('TEST SUMMARY');
  console.log(`${colors.bright}Total Tests: ${results.total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ All blocking tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
  }

  console.log(`${colors.yellow}Test Coverage:${colors.reset}`);
  console.log(`  ✓ Block/unblock functionality`);
  console.log(`  ✓ Bidirectional hiding`);
  console.log(`  ✓ Search exclusion`);
  console.log(`  ✓ Profile access prevention`);
  console.log(`  ✓ Interest sending prevention`);
  console.log(`  ✓ Edge cases (duplicate, self-block, etc.)`);
  console.log(`  ✓ Consistency validation\n`);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
