/**
 * Conversation Management Test Suite
 * Task 4.4: Conversation Management (Phase 4 - Developer 2)
 * 
 * Tests all conversation management functionality:
 * - Delete conversation (soft delete, one-sided)
 * - Delete single message (soft delete, one-sided)
 * - Archive/unarchive conversation (WhatsApp-style)
 * - Global unread count (for badge notifications)
 * - Updated conversations list with archive support
 * 
 * Prerequisites:
 * - Server must be running on port 3000
 * - Test users must exist in database
 * - At least 2 test users with existing conversation
 * - Test user credentials: 9380245433 / Harsha@2004
 * 
 * Usage:
 *   node src/tests/conversation-management.test.js
 */

import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  identifier: '9380245433',
  password: 'Harsha@2004'
};

// Global test state
let authToken = null;
let testUserId = null;
let targetUserId = null;
let testMessageId = null;
let secondTargetUserId = null;

// Test statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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

// ============================================
// UTILITY FUNCTIONS
// ============================================

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(70)}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

function logTest(testName) {
  console.log(`${colors.yellow}► ${testName}${colors.reset}`);
  totalTests++;
}

function logResult(passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  const status = passed ? 'PASS' : 'FAIL';
  
  if (passed) passedTests++;
  else failedTests++;
  
  console.log(`${color}  ${icon} ${status}${colors.reset}`);
  if (details) {
    console.log(`  ${colors.blue}${details}${colors.reset}`);
  }
  console.log();
}

function logInfo(message) {
  console.log(`${colors.magenta}ℹ ${message}${colors.reset}`);
}

function logError(error) {
  console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
  if (error.response?.data) {
    console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
  }
}

function printSummary() {
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${totalTests > 0 ? ((passedTests/totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

// ============================================
// SETUP FUNCTIONS
// ============================================

async function login() {
  try {
    logSection('SETUP: Authentication');
    logInfo('Logging in with test credentials...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      testUserId = response.data.data.user.id;
      
      logResult(true, `User ID: ${testUserId}`);
      logInfo(`Token: ${authToken.substring(0, 30)}...`);
      return true;
    } else {
      logResult(false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false);
    return false;
  }
}

async function setupTestData() {
  try {
    logSection('SETUP: Test Data Preparation');
    
    // Get conversations list to find existing conversation partners
    logInfo('Fetching existing conversations...');
    const convResponse = await axios.get(
      `${BASE_URL}/messages/conversations`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const conversations = convResponse.data.data || [];
    
    if (conversations.length > 0) {
      targetUserId = conversations[0].user.user_id;
      logInfo(`Found target user from conversation: ${conversations[0].user.full_name} (${targetUserId})`);
      
      if (conversations.length > 1) {
        secondTargetUserId = conversations[1].user.user_id;
        logInfo(`Found second target user: ${conversations[1].user.full_name} (${secondTargetUserId})`);
      }
      
      // Get conversation to find a message ID
      const msgResponse = await axios.get(
        `${BASE_URL}/messages/${targetUserId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const messages = msgResponse.data.data.messages || [];
      if (messages.length > 0) {
        testMessageId = messages[0].id;
        logInfo(`Found test message ID: ${testMessageId}`);
      } else {
        // Send a test message for message deletion tests
        try {
          logInfo('Creating test message for message deletion tests...');
          const sendResponse = await axios.post(
            `${BASE_URL}/messages/${targetUserId}`,
            { content: 'Test message for deletion tests' },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          testMessageId = sendResponse.data.data.id;
          logInfo(`Created test message ID: ${testMessageId}`);
        } catch (err) {
          logInfo('Could not create test message, message deletion tests will be skipped');
        }
      }
      
      logResult(true, 'Test data prepared successfully');
      return true;
    } else {
      logInfo('No existing conversations found. Please ensure test data exists.');
      logResult(false, 'No conversations available for testing');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false);
    return false;
  }
}

// ============================================
// TEST FUNCTIONS - TASK 4.4
// ============================================

// Test 1: GET /messages/unread-count
async function testGetGlobalUnreadCount() {
  logTest('GET /messages/unread-count - Global Unread Count');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/unread-count`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    // Verify response structure
    if (response.data.success &&
        response.data.data &&
        typeof response.data.data.unread_count === 'number') {
      logResult(true, `Unread count: ${response.data.data.unread_count}`);
      return true;
    } else {
      logResult(false, 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 2: GET /messages/unread-count - Unauthorized
async function testGetUnreadCountUnauthorized() {
  logTest('GET /messages/unread-count - Without Auth Token (should fail)');
  
  try {
    await axios.get(`${BASE_URL}/messages/unread-count`);
    logResult(false, 'Should have returned 401 Unauthorized');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logResult(true, 'Correctly rejected unauthorized request');
      return true;
    } else {
      logResult(false, `Expected 401, got ${error.response?.status}`);
      return false;
    }
  }
}

// Test 3: POST /messages/conversations/:userId/archive - Archive Conversation
async function testArchiveConversation() {
  if (!targetUserId) {
    logTest('POST /messages/conversations/:userId/archive - Archive Conversation');
    logResult(false, 'No target user available for testing');
    return false;
  }
  
  logTest(`POST /messages/conversations/${targetUserId}/archive - Archive Conversation`);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/messages/conversations/${targetUserId}/archive`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      logResult(true, response.data.message);
      return true;
    } else {
      logResult(false, 'Unexpected response structure');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 4: GET /messages/conversations - Verify archived excluded by default
async function testConversationsExcludesArchived() {
  logTest('GET /messages/conversations - Verify archived conversation hidden');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/conversations`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const conversations = response.data.data || [];
    const archivedConversation = conversations.find(c => c.user.user_id === targetUserId);
    
    if (!archivedConversation) {
      logResult(true, 'Archived conversation correctly hidden from default list');
      return true;
    } else {
      logResult(false, 'Archived conversation still visible in default list');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 5: GET /messages/conversations?includeArchived=true - Show archived
async function testConversationsIncludeArchived() {
  logTest('GET /messages/conversations?includeArchived=true - Show archived conversations');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/conversations?includeArchived=true`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const conversations = response.data.data || [];
    const archivedConversation = conversations.find(c => c.user.user_id === targetUserId);
    
    if (archivedConversation && archivedConversation.is_archived === true) {
      logResult(true, `Found archived conversation with ${archivedConversation.user.full_name}`);
      return true;
    } else {
      logResult(false, 'Archived conversation not found or not marked as archived');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 6: DELETE /messages/conversations/:userId/archive - Unarchive Conversation
async function testUnarchiveConversation() {
  if (!targetUserId) {
    logTest('DELETE /messages/conversations/:userId/archive - Unarchive Conversation');
    logResult(false, 'No target user available for testing');
    return false;
  }
  
  logTest(`DELETE /messages/conversations/${targetUserId}/archive - Unarchive Conversation`);
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/messages/conversations/${targetUserId}/archive`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      logResult(true, response.data.message);
      return true;
    } else {
      logResult(false, 'Unexpected response structure');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 7: GET /messages/conversations - Verify unarchived visible again
async function testConversationsAfterUnarchive() {
  logTest('GET /messages/conversations - Verify unarchived conversation visible');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/conversations`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const conversations = response.data.data || [];
    const unarchivedConversation = conversations.find(c => c.user.user_id === targetUserId);
    
    if (unarchivedConversation && !unarchivedConversation.is_archived) {
      logResult(true, 'Unarchived conversation correctly visible in default list');
      return true;
    } else {
      logResult(false, 'Unarchived conversation not found in default list');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 8: Archive with invalid UUID
async function testArchiveInvalidUUID() {
  logTest('POST /messages/conversations/invalid-uuid/archive - Invalid UUID (should fail)');
  
  try {
    await axios.post(
      `${BASE_URL}/messages/conversations/invalid-uuid/archive`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult(false, 'Should have returned 400 Bad Request');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logResult(true, 'Correctly rejected invalid UUID');
      return true;
    } else {
      logResult(false, `Expected 400, got ${error.response?.status}`);
      return false;
    }
  }
}

// Test 9: Archive conversation with self (should fail)
async function testArchiveSelf() {
  logTest('POST /messages/conversations/:self/archive - Archive with self (should fail)');
  
  try {
    await axios.post(
      `${BASE_URL}/messages/conversations/${testUserId}/archive`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult(false, 'Should have returned 400 Bad Request');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logResult(true, 'Correctly rejected self-archive attempt');
      return true;
    } else {
      logResult(false, `Expected 400, got ${error.response?.status}`);
      return false;
    }
  }
}

// Test 10: DELETE /messages/:messageId - Delete Single Message
async function testDeleteSingleMessage() {
  if (!testMessageId) {
    logTest('DELETE /messages/:messageId - Delete Single Message');
    logResult(false, 'No test message ID available');
    return false;
  }
  
  logTest(`DELETE /messages/${testMessageId} - Delete Single Message`);
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/messages/${testMessageId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      logResult(true, response.data.message);
      return true;
    } else {
      logResult(false, 'Unexpected response structure');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 11: DELETE /messages/:messageId - Delete already deleted message (should fail with 409)
async function testDeleteAlreadyDeletedMessage() {
  if (!testMessageId) {
    logTest('DELETE /messages/:messageId - Delete already deleted message (should fail)');
    logResult(false, 'No test message ID available');
    return false;
  }
  
  logTest(`DELETE /messages/${testMessageId} - Delete already deleted message (should fail)`);
  
  try {
    await axios.delete(
      `${BASE_URL}/messages/${testMessageId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult(false, 'Should have returned 409 Conflict');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      logResult(true, 'Correctly returned 409 Conflict for already deleted message');
      return true;
    } else {
      logError(error);
      logResult(false, `Expected 409, got ${error.response?.status}`);
      return false;
    }
  }
}

// Test 12: DELETE /messages/conversations/:userId - Delete Conversation
async function testDeleteConversation() {
  if (!targetUserId) {
    logTest('DELETE /messages/conversations/:userId - Delete Conversation');
    logResult(false, 'No target user available for testing');
    return false;
  }
  
  logTest(`DELETE /messages/conversations/${targetUserId} - Delete Conversation`);
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/messages/conversations/${targetUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success && response.data.data) {
      const deletedCount = response.data.data.deleted_count;
      logResult(true, `Deleted ${deletedCount} message(s)`);
      return true;
    } else {
      logResult(false, 'Unexpected response structure');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 13: GET /messages/:userId - Verify deleted conversation hidden
async function testConversationAfterDelete() {
  if (!targetUserId) {
    logTest('GET /messages/:userId - Verify deleted conversation messages hidden');
    logResult(false, 'No target user available for testing');
    return false;
  }
  
  logTest(`GET /messages/${targetUserId} - Verify deleted messages hidden`);
  
  try {
    const response = await axios.get(
      `${BASE_URL}/messages/${targetUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const data = response.data.data;
    const messages = data?.messages || [];
    
    if (messages.length === 0) {
      logResult(true, 'All messages correctly hidden after conversation delete');
      return true;
    } else {
      logResult(false, `Still seeing ${messages.length} message(s) after delete`);
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, error.response?.data?.message || 'Request failed');
    return false;
  }
}

// Test 14: DELETE /messages/conversations/:userId - Delete with invalid UUID
async function testDeleteConversationInvalidUUID() {
  logTest('DELETE /messages/conversations/invalid-uuid - Invalid UUID (should fail)');
  
  try {
    await axios.delete(
      `${BASE_URL}/messages/conversations/invalid-uuid`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult(false, 'Should have returned 400 Bad Request');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logResult(true, 'Correctly rejected invalid UUID');
      return true;
    } else {
      logResult(false, `Expected 400, got ${error.response?.status}`);
      return false;
    }
  }
}

// Test 15: DELETE /messages/conversations/:self - Delete with self (should fail)
async function testDeleteConversationSelf() {
  logTest('DELETE /messages/conversations/:self - Delete with self (should fail)');
  
  try {
    await axios.delete(
      `${BASE_URL}/messages/conversations/${testUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult(false, 'Should have returned 400 Bad Request');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logResult(true, 'Correctly rejected self-delete attempt');
      return true;
    } else {
      logResult(false, `Expected 400, got ${error.response?.status}`);
      return false;
    }
  }
}

// Test 16: Rate limiting test (optional - can be slow)
async function testRateLimiting() {
  logTest('Rate Limiting - GET /messages/unread-count (61 requests in 1 minute)');
  logInfo('Testing rate limit of 60 requests per minute...');
  
  try {
    let rateLimitHit = false;
    
    // Try to make 61 requests rapidly
    for (let i = 0; i < 61; i++) {
      try {
        await axios.get(
          `${BASE_URL}/messages/unread-count`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitHit = true;
          logResult(true, `Rate limit hit after ${i + 1} requests`);
          return true;
        }
      }
    }
    
    if (!rateLimitHit) {
      logResult(false, 'Rate limit not enforced (made 61 requests without 429)');
      return false;
    }
  } catch (error) {
    logError(error);
    logResult(false, 'Rate limiting test failed');
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║        TASK 4.4: CONVERSATION MANAGEMENT TEST SUITE               ║
║        Phase 4 - Developer 2                                      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
  console.log(colors.reset);
  
  // Setup
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log(`${colors.red}✗ Authentication failed. Cannot proceed with tests.${colors.reset}\n`);
    return;
  }
  
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log(`${colors.red}✗ Test data setup failed. Some tests may fail.${colors.reset}\n`);
  }
  
  // Run all tests
  logSection('FEATURE: Global Unread Count');
  await testGetGlobalUnreadCount();
  await testGetUnreadCountUnauthorized();
  
  logSection('FEATURE: Archive/Unarchive Conversation');
  await testArchiveConversation();
  await testConversationsExcludesArchived();
  await testConversationsIncludeArchived();
  await testUnarchiveConversation();
  await testConversationsAfterUnarchive();
  await testArchiveInvalidUUID();
  await testArchiveSelf();
  
  logSection('FEATURE: Delete Single Message');
  await testDeleteSingleMessage();
  await testDeleteAlreadyDeletedMessage();
  
  logSection('FEATURE: Delete Conversation');
  await testDeleteConversation();
  await testConversationAfterDelete();
  await testDeleteConversationInvalidUUID();
  await testDeleteConversationSelf();
  
  logSection('FEATURE: Rate Limiting (Optional - Can be slow)');
  logInfo('Skipping rate limiting test to save time. Run manually if needed.');
  // Uncomment to test rate limiting:
  // await testRateLimiting();
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the test suite
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
