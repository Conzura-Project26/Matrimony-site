/**
 * Comprehensive Test Suite for Task 4.3: Message Service
 * Tests all endpoints and edge cases
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';
let testResults = [];

// Test result tracker
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ testName, passed, details });
}

// Helper: Login and get token
async function login(identifier, password = 'Test@123') {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: identifier,
      password: password
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error(`Login failed for ${identifier}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Helper: Make authenticated request
async function makeRequest(method, endpoint, token, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {},
      validateStatus: () => true // Don't throw on any status
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { 
      success: response.status >= 200 && response.status < 300, 
      status: response.status, 
      data: response.data 
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message }
    };
  }
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('\n🧪 Starting Comprehensive Message Service Tests\n');
  console.log('='.repeat(60));

  // Get test users with accepted interests
  const interests = await prisma.interest.findMany({
    where: { status: 'ACCEPTED' },
    include: {
      sender: { select: { id: true, full_name: true, mobile_number: true } },
      receiver: { select: { id: true, full_name: true, mobile_number: true } }
    },
    take: 1
  });

  if (interests.length === 0) {
    console.error('❌ Need at least 1 accepted interest to run tests');
    return;
  }

  const user1 = interests[0].sender;
  const user2 = interests[0].receiver;

  console.log(`\n📋 Test Users:`);
  console.log(`User 1: ${user1.full_name} (${user1.mobile_number})`);
  console.log(`User 2: ${user2.full_name} (${user2.mobile_number})`);

  // Login users
  console.log(`\n🔐 Logging in test users...`);
  const token1 = await login(user1.mobile_number, 'Harsha@2004');
  const token2 = await login(user2.mobile_number, 'Test@123');

  if (!token1) {
    console.log('Trying alternate password for user 1...');
    const altToken1 = await login(user1.mobile_number, 'Test@123');
    if (altToken1) {
      console.log('✅ User 1 logged in with alternate password');
    }
  }
  
  if (!token2) {
    console.log('Trying alternate password for user 2...');
    const altToken2 = await login(user2.mobile_number, 'Harsha@2004');
    if (altToken2) {
      console.log('✅ User 2 logged in with alternate password');
    }
  }

  if (!token1 || !token2) {
    console.error('❌ Failed to login test users');
    console.error('User 1 token:', token1 ? 'SUCCESS' : 'FAILED');
    console.error('User 2 token:', token2 ? 'SUCCESS' : 'FAILED');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Users logged in successfully\n');
  console.log('='.repeat(60));

  // ========================================
  // TEST 1: GET CONVERSATIONS (INBOX)
  // ========================================
  console.log('\n📥 TEST 1: GET /messages/conversations (Inbox)\n');

  const inbox1 = await makeRequest('GET', '/messages/conversations?page=1&limit=20', token1);
  logTest(
    'GET conversations - valid request',
    inbox1.success && inbox1.status === 200,
    inbox1.success ? `Found ${inbox1.data.data?.length || 0} conversations` : inbox1.data.message
  );

  // ========================================
  // TEST 2: SEND MESSAGE - HAPPY PATH
  // ========================================
  console.log('\n📤 TEST 2: POST /messages/:userId (Send Message)\n');

  const sendMsg1 = await makeRequest(
    'POST',
    `/messages/${user2.id}`,
    token1,
    { content: 'Test message: Hello from automated test!' }
  );
  logTest(
    'Send message - valid request',
    sendMsg1.success && sendMsg1.status === 201,
    sendMsg1.success ? `Message ID: ${sendMsg1.data.data?.id}` : sendMsg1.data.message
  );

  let messageId1 = sendMsg1.data?.data?.id;

  // ========================================
  // TEST 3: VALIDATION ERRORS
  // ========================================
  console.log('\n❌ TEST 3: Validation Errors\n');

  // 3.1 Self-message
  const selfMsg = await makeRequest(
    'POST',
    `/messages/${user1.id}`,
    token1,
    { content: 'Trying to message myself' }
  );
  logTest(
    'Send message - self message (should fail)',
    !selfMsg.success && selfMsg.status === 400,
    selfMsg.data.message
  );

  // 3.2 Empty content
  const emptyMsg = await makeRequest(
    'POST',
    `/messages/${user2.id}`,
    token1,
    { content: '   ' }
  );
  logTest(
    'Send message - empty content (should fail)',
    !emptyMsg.success && emptyMsg.status === 400,
    emptyMsg.data.message
  );

  // 3.3 Content too long
  const longContent = 'a'.repeat(1001);
  const longMsg = await makeRequest(
    'POST',
    `/messages/${user2.id}`,
    token1,
    { content: longContent }
  );
  logTest(
    'Send message - content too long (should fail)',
    !longMsg.success && longMsg.status === 400,
    longMsg.data.message
  );

  // 3.4 Invalid UUID
  const invalidUUID = await makeRequest(
    'POST',
    `/messages/invalid-uuid-format`,
    token1,
    { content: 'Test' }
  );
  logTest(
    'Send message - invalid UUID (should fail)',
    !invalidUUID.success && invalidUUID.status === 400,
    invalidUUID.data.message
  );

  // 3.5 Non-existent user
  const nonExistentUser = await makeRequest(
    'POST',
    `/messages/00000000-0000-0000-0000-000000000000`,
    token1,
    { content: 'Test' }
  );
  logTest(
    'Send message - non-existent user (should fail)',
    !nonExistentUser.success && nonExistentUser.status === 404,
    nonExistentUser.data.message
  );

  // ========================================
  // TEST 4: GET CONVERSATION
  // ========================================
  console.log('\n💬 TEST 4: GET /messages/:userId (Get Conversation)\n');

  const conv1 = await makeRequest('GET', `/messages/${user2.id}?limit=20`, token1);
  logTest(
    'Get conversation - valid request',
    conv1.success && conv1.status === 200,
    conv1.success ? `Found ${conv1.data.data?.messages?.length || 0} messages` : conv1.data.message
  );

  if (conv1.success) {
    const hasUserInfo = conv1.data.data?.user?.user_id && conv1.data.data?.user?.full_name;
    logTest(
      'Get conversation - includes user profile info',
      hasUserInfo,
      hasUserInfo ? 'User info present' : 'Missing user info'
    );

    const hasPagination = conv1.data.data?.pagination;
    logTest(
      'Get conversation - includes pagination',
      hasPagination,
      hasPagination ? `has_more: ${conv1.data.data.pagination.has_more}` : 'Missing pagination'
    );
  }

  // 4.1 Invalid UUID
  const convInvalidUUID = await makeRequest('GET', `/messages/invalid-uuid`, token1);
  logTest(
    'Get conversation - invalid UUID (should fail)',
    !convInvalidUUID.success && convInvalidUUID.status === 400,
    convInvalidUUID.data.message
  );

  // ========================================
  // TEST 5: READ RECEIPTS
  // ========================================
  console.log('\n📖 TEST 5: Read Receipts\n');

  // User 2 fetches conversation (should mark message as read)
  const conv2 = await makeRequest('GET', `/messages/${user1.id}`, token2);
  logTest(
    'Read receipt - fetch conversation as receiver',
    conv2.success && conv2.status === 200,
    'Conversation fetched by receiver'
  );

  if (messageId1) {
    await sleep(2000); // Wait longer for database update
    const message = await prisma.message.findUnique({
      where: { id: messageId1 },
      select: { read_at: true }
    });

    logTest(
      'Read receipt - message marked as read',
      message && message.read_at !== null,
      message?.read_at ? `Read at: ${new Date(message.read_at).toISOString()}` : 'Still unread'
    );
  }

  // ========================================
  // TEST 6: CURSOR PAGINATION
  // ========================================
  console.log('\n📄 TEST 6: Cursor Pagination\n');

  // Send multiple messages for pagination test
  console.log('Sending 5 messages for pagination test...');
  for (let i = 1; i <= 5; i++) {
    await makeRequest(
      'POST',
      `/messages/${user2.id}`,
      token1,
      { content: `Pagination test message ${i}` }
    );
    await sleep(200); // Small delay
  }

  // Fetch first page
  const page1 = await makeRequest('GET', `/messages/${user2.id}?limit=3`, token1);
  logTest(
    'Pagination - first page (limit 3)',
    page1.success && page1.data.data?.messages?.length === 3,
    page1.success ? `Got ${page1.data.data.messages.length} messages` : page1.data.message
  );

  if (page1.success && page1.data.data?.pagination?.next_cursor) {
    const cursor = page1.data.data.pagination.next_cursor;
    const page2 = await makeRequest('GET', `/messages/${user2.id}?cursor=${cursor}&limit=3`, token1);
    logTest(
      'Pagination - second page with cursor',
      page2.success && page2.data.data?.messages?.length > 0,
      page2.success ? `Got ${page2.data.data.messages.length} messages` : page2.data.message
    );

    // Check no duplicates
    if (page1.success && page2.success) {
      const page1Ids = page1.data.data.messages.map(m => m.id);
      const page2Ids = page2.data.data.messages.map(m => m.id);
      const hasDuplicates = page1Ids.some(id => page2Ids.includes(id));
      logTest(
        'Pagination - no duplicate messages',
        !hasDuplicates,
        hasDuplicates ? 'Found duplicates!' : 'No duplicates found'
      );
    }
  }

  // ========================================
  // TEST 7: RATE LIMITING
  // ========================================
  console.log('\n⏱️  TEST 7: Rate Limiting (Per-Minute)\n');
  console.log('Sending 31 messages rapidly...');

  let rateLimitHit = false;
  let successCount = 0;

  for (let i = 1; i <= 31; i++) {
    const result = await makeRequest(
      'POST',
      `/messages/${user2.id}`,
      token1,
      { content: `Rate limit test ${i}` }
    );
    
    if (result.success) {
      successCount++;
    } else if (result.status === 429) {
      rateLimitHit = true;
      logTest(
        'Rate limiting - per-minute limit enforced',
        true,
        `Hit rate limit after ${successCount} messages`
      );
      break;
    }
    await sleep(50); // Small delay between requests
  }

  if (!rateLimitHit) {
    logTest(
      'Rate limiting - per-minute limit',
      false,
      `Expected 429 after 30 messages, but sent ${successCount} successfully`
    );
  }

  // ========================================
  // TEST 8: NO ACCEPTED INTEREST
  // ========================================
  console.log('\n🚫 TEST 8: No Accepted Interest\n');

  // Find a user without accepted interest
  const strangerUser = await prisma.user.findFirst({
    where: {
      is_active: true,
      id: { notIn: [user1.id, user2.id] },
      NOT: {
        OR: [
          { interests_sent: { some: { receiver_id: user1.id, status: 'ACCEPTED' } } },
          { interests_received: { some: { sender_id: user1.id, status: 'ACCEPTED' } } }
        ]
      }
    },
    select: { id: true, full_name: true }
  });

  if (strangerUser) {
    const noInterestMsg = await makeRequest(
      'POST',
      `/messages/${strangerUser.id}`,
      token1,
      { content: 'Should fail - no interest' }
    );
    logTest(
      'Send message - no accepted interest (should fail)',
      !noInterestMsg.success && noInterestMsg.status === 403,
      noInterestMsg.data.message
    );
  } else {
    logTest('Send message - no accepted interest', false, 'Could not find stranger user for test');
  }

  // ========================================
  // TEST 9: UNAUTHORIZED ACCESS
  // ========================================
  console.log('\n🔐 TEST 9: Unauthorized Access\n');

  const noToken = await makeRequest('GET', '/messages/conversations');
  logTest(
    'Access without token (should fail)',
    !noToken.success && noToken.status === 401,
    noToken.data.message
  );

  const invalidToken = await makeRequest('GET', '/messages/conversations', 'invalid-token-123');
  logTest(
    'Access with invalid token (should fail)',
    !invalidToken.success && invalidToken.status === 401,
    invalidToken.data.message
  );

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');

  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  const total = testResults.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.testName}`);
      if (t.details) console.log(`     ${t.details}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(passed === total ? '🎉 ALL TESTS PASSED! 🎉' : '⚠️  SOME TESTS FAILED');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
