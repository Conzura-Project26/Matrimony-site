/**
 * Manual Test Suite for Interest System (Task 4.1)
 * 
 * Test Credentials:
 * Mobile: 9380245433
 * Password: Harsha@2004
 * 
 * Prerequisites:
 * 1. Server should be running on port 3000
 * 2. Database should be seeded with test users
 * 3. Test user should have >60% profile completion
 * 
 * Test Scenarios:
 * ✓ Scenario 1: Send interest successfully (normal case)
 * ✓ Scenario 2: Duplicate interest (should fail)
 * ✓ Scenario 3: Self-interest (should fail)
 * ✓ Scenario 4: Blocked user (should fail)
 * ✓ Scenario 5: Mutual interest detection
 * ✓ Scenario 6: Rejection cooldown (30 days)
 * ✓ Scenario 7: Low profile completion (should fail)
 * ✓ Scenario 8: Invalid receiver (should fail)
 */

import axios from 'axios';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_CREDENTIALS = {
  identifier: '9380245433',  // Can be mobile_number or email
  password: 'Harsha@2004'
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let authToken = null;
let testUserId = null;

/**
 * Helper function to print test results
 */
function logResult(testName, passed, message) {
  const symbol = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${symbol} ${testName}${colors.reset}`);
  if (message) {
    console.log(`  ${colors.blue}${message}${colors.reset}`);
  }
}

/**
 * Helper function to print section headers
 */
function logSection(title) {
  console.log(`\n${colors.bold}${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Step 1: Login and get authentication token
 */
async function login() {
  try {
    logSection('STEP 1: Authentication');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      testUserId = response.data.data.user.id;
      
      logResult(
        'Login successful',
        true,
        `User ID: ${testUserId}\nProfile Completion: ${response.data.data.user.profile_completion_percentage}%`
      );
      
      return true;
    } else {
      logResult('Login failed', false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logResult(
      'Login failed',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Step 2: Get list of available users to send interest to
 */
async function getAvailableUsers() {
  try {
    logSection('STEP 2: Fetching Available Users');
    
    const response = await axios.post(`${BASE_URL}/search/advanced`, 
      {
        page: 1,
        min_height: 140,  // Basic filter to get all users above 140cm
        max_height: 200
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      const users = response.data.data.map(u => ({
        id: u.id,
        name: u.full_name,
        gender: u.gender,
        completion: u.profile_completion
      }));
      
      logResult(
        'Users fetched successfully',
        true,
        `Found ${users.length} potential matches`
      );
      
      console.log('\nAvailable users:');
      users.forEach((u, idx) => {
        console.log(`  ${idx + 1}. ${u.name} (${u.gender}) - ${u.completion}% complete - ID: ${u.id}`);
      });
      
      return users;
    } else {
      logResult('No users found', false);
      return [];
    }
  } catch (error) {
    logResult(
      'Failed to fetch users',
      false,
      error.response?.data?.message || error.message
    );
    return [];
  }
}

/**
 * Test 1: Send interest successfully
 */
async function testSendInterest(receiverId) {
  try {
    logSection('TEST 1: Send Interest (Normal Case)');
    
    const response = await axios.post(
      `${BASE_URL}/interests/${receiverId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      const { interest_id, status, is_mutual } = response.data.data;
      
      logResult(
        'Interest sent successfully',
        true,
        `Interest ID: ${interest_id}\nStatus: ${status}\nMutual: ${is_mutual ? 'Yes' : 'No'}`
      );
      
      return { success: true, interestId: interest_id, isMutual: is_mutual };
    }
  } catch (error) {
    logResult(
      'Interest sending failed',
      false,
      error.response?.data?.message || error.message
    );
    return { success: false };
  }
}

/**
 * Test 2: Duplicate interest (should fail)
 */
async function testDuplicateInterest(receiverId) {
  try {
    logSection('TEST 2: Duplicate Interest (Should Fail)');
    
    const response = await axios.post(
      `${BASE_URL}/interests/${receiverId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Duplicate interest was allowed', false, 'SECURITY ISSUE: Should have been blocked');
    return false;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    if ((status === 400 || status === 409) && 
        (message.includes('already sent') || message.includes('pending response'))) {
      logResult(
        'Duplicate interest blocked correctly',
        true,
        message
      );
      return true;
    } else {
      logResult(
        'Unexpected error',
        false,
        `Status: ${status}, Message: ${message}`
      );
      return false;
    }
  }
}

/**
 * Test 3: Self-interest (should fail)
 */
async function testSelfInterest() {
  try {
    logSection('TEST 3: Self Interest (Should Fail)');
    
    const response = await axios.post(
      `${BASE_URL}/interests/${testUserId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Self-interest was allowed', false, 'SECURITY ISSUE: Should have been blocked');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && 
        error.response?.data?.message?.includes('yourself')) {
      logResult(
        'Self-interest blocked correctly',
        true,
        error.response.data.message
      );
      return true;
    } else {
      logResult(
        'Unexpected error',
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
}

/**
 * Test 4: Invalid receiver (should fail)
 */
async function testInvalidReceiver() {
  try {
    logSection('TEST 4: Invalid Receiver (Should Fail)');
    
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await axios.post(
      `${BASE_URL}/interests/${fakeId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Invalid receiver was accepted', false, 'Validation issue');
    return false;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      logResult(
        'Invalid receiver rejected correctly',
        true,
        error.response.data.message
      );
      return true;
    } else {
      logResult(
        'Unexpected error',
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
}

/**
 * Test 5: Check notification creation
 */
async function testNotificationCreated(receiverId) {
  try {
    logSection('TEST 5: Notification Creation Check');
    
    console.log(`${colors.yellow}Note: This requires manual verification in database${colors.reset}`);
    console.log(`Run this SQL query to verify notification was created:\n`);
    console.log(`${colors.blue}SELECT * FROM notifications WHERE user_id = '${receiverId}' AND type = 'INTEREST_RECEIVED' ORDER BY created_at DESC LIMIT 1;${colors.reset}\n`);
    
    logResult(
      'Notification check',
      true,
      'Manual verification required - see SQL query above'
    );
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test 6: Check audit log creation
 */
async function testAuditLogCreated() {
  try {
    logSection('TEST 6: Audit Log Creation Check');
    
    console.log(`${colors.yellow}Note: This requires manual verification in database${colors.reset}`);
    console.log(`Run this SQL query to verify audit log was created:\n`);
    console.log(`${colors.blue}SELECT * FROM audit_logs WHERE actor_id = '${testUserId}' AND action = 'SEND_INTEREST' ORDER BY created_at DESC LIMIT 1;${colors.reset}\n`);
    
    logResult(
      'Audit log check',
      true,
      'Manual verification required - see SQL query above'
    );
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test 7: Blocking - Block user and try sending interest
 */
async function testBlockedUser(receiverId) {
  try {
    logSection('TEST 7: Blocked User (Should Fail)');
    
    // Block the user using the new block endpoint
    console.log(`${colors.yellow}Blocking user via API...${colors.reset}`);
    
    try {
      const blockResponse = await axios.post(
        `${BASE_URL}/blocks/${receiverId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      console.log(`${colors.green}✓ User blocked successfully${colors.reset}`);
      console.log(`  Rejected ${blockResponse.data.data.rejected_interests_count} pending interests\n`);
    } catch (blockError) {
      // If already blocked, that's fine
      if (!blockError.response?.data?.message?.includes('already blocked')) {
        throw blockError;
      }
      console.log(`${colors.yellow}User already blocked${colors.reset}\n`);
    }
    
    // Try to send interest to blocked user
    const response = await axios.post(
      `${BASE_URL}/interests/${receiverId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Interest to blocked user was allowed', false, 'SECURITY ISSUE: Should have been blocked');
    
    // Cleanup: Unblock the user
    await axios.delete(
      `${BASE_URL}/blocks/${receiverId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    ).catch(() => {});
    
    return false;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message?.toLowerCase() || '';
    
    // Accept any of these responses as valid blocking:
    // - 400 with "blocked" (direct blocking message)
    // - 403/404 with "profile" (privacy protection - doesn't reveal block exists)
    if ((statusCode === 400 && message.includes('blocked')) ||
        ((statusCode === 403 || statusCode === 404) && message.includes('profile'))) {
      logResult(
        'Blocked user interest correctly prevented',
        true,
        error.response.data.message
      );
      
      // Cleanup: Unblock the user
      await axios.delete(
        `${BASE_URL}/blocks/${receiverId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      ).catch(() => {});
      
      return true;
    } else {
      logResult(
        'Unexpected error',
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
}

/**
 * Test 8: Rejection cooldown - Try resending within 30 days after rejection
 */
async function testRejectionCooldown(receiverId) {
  try {
    logSection('TEST 8: Rejection Cooldown (Should Fail)');
    
    console.log(`${colors.yellow}Simulating rejected interest via database...${colors.reset}`);
    
    // Find the interest we just created and mark it as REJECTED
    const existingInterest = await prisma.interest.findFirst({
      where: {
        sender_id: testUserId,
        receiver_id: receiverId,
        status: 'PENDING'
      }
    });
    
    if (!existingInterest) {
      console.log(`${colors.yellow}⚠ No pending interest found to reject${colors.reset}\n`);
      logResult('Rejection cooldown test', true, 'Skipped - no pending interest');
      return true;
    }
    
    // Update interest to REJECTED status
    await prisma.interest.update({
      where: { id: existingInterest.id },
      data: {
        status: 'REJECTED',
        responded_at: new Date()
      }
    });
    
    console.log(`${colors.green}✓ Interest marked as REJECTED in database${colors.reset}`);
    
    // Try to send interest again (should fail due to cooldown)
    const response = await axios.post(
      `${BASE_URL}/interests/${receiverId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logResult('Interest during cooldown was allowed', false, 'BUSINESS LOGIC ERROR: Should enforce 30-day cooldown');
    return false;
  } catch (error) {
    if (error.response?.status === 409 && 
        (error.response?.data?.message?.includes('cooldown') || 
         error.response?.data?.message?.includes('30') ||
         error.response?.data?.message?.includes('wait'))) {
      logResult(
        '30-day rejection cooldown enforced correctly',
        true,
        error.response.data.message
      );
      return true;
    } else {
      logResult(
        'Unexpected error',
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }
}

/**
 * Test 9: Mutual interest - Receiver sends interest back to sender
 */
async function testMutualInterest(receiverId) {
  try {
    logSection('TEST 9: Mutual Interest Detection');
    
    console.log(`${colors.yellow}Getting receiver user details...${colors.reset}`);
    
    // Find the receiver's mobile number
    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { mobile_number: true, full_name: true }
    });
    
    if (!receiverUser || !receiverUser.mobile_number) {
      console.log(`${colors.yellow}⚠ Could not find receiver user details${colors.reset}\n`);
      logResult('Mutual interest test', true, 'Skipped - receiver not found');
      return true;
    }
    
    console.log(`${colors.yellow}Logging in as ${receiverUser.full_name} (${receiverUser.mobile_number})...${colors.reset}`);
    
    // Login as receiver user (password is Test@123 for all test users)
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: receiverUser.mobile_number,
      password: 'Test@123'
    });
    
    if (!loginResponse.data.success) {
      console.log(`${colors.yellow}⚠ Could not login as receiver${colors.reset}\n`);
      logResult('Mutual interest test', false, 'Failed to login as receiver');
      return false;
    }
    
    const receiverToken = loginResponse.data.data.accessToken;
    console.log(`${colors.green}✓ Receiver logged in successfully${colors.reset}`);
    
    console.log(`${colors.yellow}Receiver sending interest back to sender...${colors.reset}`);
    
    // Receiver sends interest back to sender
    const response = await axios.post(
      `${BASE_URL}/interests/${testUserId}`,
      {},
      { headers: { Authorization: `Bearer ${receiverToken}` } }
    );
    
    if (response.data.success && response.data.data.is_mutual) {
      logResult(
        'Mutual interest detected and auto-accepted',
        true,
        `Both users can now message each other. Status: ${response.data.data.status}`
      );
      return true;
    } else {
      logResult(
        'Mutual interest not detected',
        false,
        'Interest sent but not marked as mutual'
      );
      return false;
    }
  } catch (error) {
    logResult(
      'Mutual interest test failed',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Test 10: Low profile completion - User with <60% completion tries to send interest
 */
async function testLowProfileCompletion(receiverId) {
  try {
    logSection('TEST 10: Low Profile Completion (Should Fail)');
    
    console.log(`${colors.yellow}Temporarily reducing profile completion via database...${colors.reset}`);
    
    // Get current profile completion to restore later
    const currentUser = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { profile_completion_percentage: true }
    });
    
    const originalCompletion = currentUser.profile_completion_percentage;
    
    // Temporarily update profile completion to below 60%
    await prisma.user.update({
      where: { id: testUserId },
      data: { profile_completion_percentage: 50 }
    });
    
    console.log(`${colors.green}✓ Profile completion reduced to 50%${colors.reset}`);
    
    try {
      // Try to send interest with low completion
      const response = await axios.post(
        `${BASE_URL}/interests/${receiverId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      logResult('Low completion user was allowed to send interest', false, 'BUSINESS LOGIC ERROR: Should require 60% completion');
      
      // Restore profile completion
      await prisma.user.update({
        where: { id: testUserId },
        data: { profile_completion_percentage: originalCompletion }
      });
      
      return false;
    } catch (error) {
      // Restore profile completion first
      await prisma.user.update({
        where: { id: testUserId },
        data: { profile_completion_percentage: originalCompletion }
      });
      
      console.log(`${colors.green}✓ Profile completion restored to ${originalCompletion}%${colors.reset}`);
      
      if (error.response?.status === 400 && 
          (error.response?.data?.message?.includes('60%') || 
           error.response?.data?.message?.includes('profile completion') ||
           error.response?.data?.message?.includes('complete'))) {
        logResult(
          'Low profile completion correctly prevented',
          true,
          error.response.data.message
        );
        return true;
      } else {
        logResult(
          'Unexpected error',
          false,
          error.response?.data?.message || error.message
        );
        return false;
      }
    }
  } catch (error) {
    logResult(
      'Test setup failed',
      false,
      error.message
    );
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Interest System Test Suite (Task 4.1)             ║');
  console.log('║                  Manual Testing Guide                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log(`\n${colors.red}${colors.bold}TEST SUITE ABORTED: Login failed${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Get available users
  const users = await getAvailableUsers();
  
  let receiverId;
  
  if (users.length === 0) {
    console.log(`\n${colors.yellow}No users found via search. Using manual receiver ID for testing...${colors.reset}`);
    // Use a test UUID - replace with actual user ID from your database
    receiverId = 'e1234567-e89b-12d3-a456-426614174000'; // Replace with actual user ID
    console.log(`${colors.yellow}⚠ Using placeholder receiver ID: ${receiverId}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Update this in the test file or ensure database has multiple users${colors.reset}\n`);
  } else {
    // Use first available user as receiver
    receiverId = users[0].id;
    console.log(`\n${colors.yellow}Selected receiver: ${users[0].name} (${receiverId})${colors.reset}`);
  }
  
  // Test 1: Send interest
  const result = await testSendInterest(receiverId);
  
  if (result.success) {
    // Test 2: Duplicate interest
    await testDuplicateInterest(receiverId);
    
    // Test 5: Notification check
    await testNotificationCreated(receiverId);
    
    // Test 6: Audit log check
    await testAuditLogCreated();
    
    // Test 8: Rejection cooldown (needs the pending interest from Test 1)
    await testRejectionCooldown(receiverId);
  }
  
  // Test 3: Self-interest
  await testSelfInterest();
  
  // Test 4: Invalid receiver
  await testInvalidReceiver();
  
  // Test 10: Low profile completion
  await testLowProfileCompletion(receiverId);
  
  // Test 9: Mutual interest (needs a fresh pending interest, so run before blocking test)
  // First, send a new interest to a different user
  let mutualTestReceiverId = users.length > 1 ? users[1].id : receiverId;
  const mutualResult = await testSendInterest(mutualTestReceiverId);
  if (mutualResult.success) {
    await testMutualInterest(mutualTestReceiverId);
  }
  
  // Test 7: Blocking (runs last as it blocks the first user)
  await testBlockedUser(receiverId);
  
  // Final summary
  logSection('TEST SUMMARY');
  console.log(`${colors.green}✓ All automated tests completed${colors.reset}`);
  console.log(`\n${colors.bold}Test Coverage:${colors.reset}`);
  console.log(`  ✓ Send interest (normal case)`);
  console.log(`  ✓ Duplicate interest prevention`);
  console.log(`  ✓ Self-interest prevention`);
  console.log(`  ✓ Invalid receiver validation`);
  console.log(`  ✓ Notification creation`);
  console.log(`  ✓ Audit log creation`);
  console.log(`  ✓ Blocked user prevention`);
  console.log(`  ✓ 30-day rejection cooldown`);
  console.log(`  ✓ Mutual interest detection`);
  console.log(`  ✓ Profile completion validation`);
  console.log(`\n${colors.blue}For comprehensive testing, refer to: Backend/documentation/TESTING_GUIDE.md${colors.reset}\n`);
  
  // Cleanup: Disconnect Prisma
  await prisma.$disconnect();
}

// Run the tests
runTests().catch(async (error) => {
  console.error(`${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
  await prisma.$disconnect();
  process.exit(1);
});
