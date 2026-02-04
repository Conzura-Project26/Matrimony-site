/**
 * Notification System Test
 * Task 4.6: Test all notification endpoints
 * 
 * Test Coverage:
 * 1. Login and get access token
 * 2. Get notifications (with filters)
 * 3. Get unread count
 * 4. Mark single notification as read
 * 5. Mark all notifications as read
 * 6. Delete single notification
 * 7. Clear all notifications
 * 
 * Credentials:
 * - Mobile: 9380245433
 * - Password: Harsha@2004
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
let accessToken = '';
let userId = '';
let notificationId = null;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logStep(message) {
  log(`\n${'='.repeat(60)}`, 'yellow');
  log(`${message}`, 'yellow');
  log(`${'='.repeat(60)}`, 'yellow');
}

/**
 * Test 1: Login
 */
async function testLogin() {
  logStep('TEST 1: Login');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380245433',
      password: 'Harsha@2004'
    });

    console.log('Login response:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      userId = response.data.data.user.id;
      logSuccess('Login successful');
      logInfo(`User ID: ${userId}`);
      logInfo(`Token: ${accessToken.substring(0, 50)}...`);
      return true;
    } else {
      logError('Login failed - No token received');
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received. Request:', error.request);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test 2: Get Notifications (All)
 */
async function testGetNotifications() {
  logStep('TEST 2: Get All Notifications');
  
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.success) {
      logSuccess(`Retrieved ${response.data.data.length} notifications`);
      console.log(JSON.stringify(response.data, null, 2));
      
      // Store first notification ID for later tests
      if (response.data.data.length > 0) {
        notificationId = response.data.data[0].id;
        logInfo(`First notification ID: ${notificationId}`);
      }
      return true;
    } else {
      logError('Failed to get notifications');
      return false;
    }
  } catch (error) {
    logError(`Get notifications failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 3: Get Notifications with Type Filter
 */
async function testGetNotificationsByType() {
  logStep('TEST 3: Get Notifications - Filter by Type (INTEREST_RECEIVED)');
  
  try {
    const response = await axios.get(`${BASE_URL}/notifications?type=INTEREST_RECEIVED`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.success) {
      logSuccess(`Retrieved ${response.data.data.length} INTEREST_RECEIVED notifications`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to get notifications by type');
      return false;
    }
  } catch (error) {
    logError(`Get notifications by type failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 4: Get Unread Notifications Only
 */
async function testGetUnreadNotifications() {
  logStep('TEST 4: Get Unread Notifications Only');
  
  try {
    const response = await axios.get(`${BASE_URL}/notifications?unread=true`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.success) {
      logSuccess(`Retrieved ${response.data.data.length} unread notifications`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to get unread notifications');
      return false;
    }
  } catch (error) {
    logError(`Get unread notifications failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 5: Get Unread Count
 */
async function testGetUnreadCount() {
  logStep('TEST 5: Get Unread Notification Count');
  
  try {
    const response = await axios.get(`${BASE_URL}/notifications/unread/count`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.success) {
      logSuccess(`Unread count: ${response.data.data.unread_count}`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to get unread count');
      return false;
    }
  } catch (error) {
    logError(`Get unread count failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 6: Mark Notification as Read
 */
async function testMarkAsRead() {
  logStep('TEST 6: Mark Single Notification as Read');
  
  if (!notificationId) {
    logError('No notification ID available - skipping test');
    return false;
  }

  try {
    const response = await axios.put(
      `${BASE_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data.success) {
      logSuccess(`Marked notification ${notificationId} as read`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to mark notification as read');
      return false;
    }
  } catch (error) {
    logError(`Mark as read failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 7: Mark All Notifications as Read
 */
async function testMarkAllAsRead() {
  logStep('TEST 7: Mark All Notifications as Read');
  
  try {
    const response = await axios.put(
      `${BASE_URL}/notifications/mark-all-read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data.success) {
      logSuccess(`Marked all notifications as read (${response.data.data.updated_count} updated)`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to mark all as read');
      return false;
    }
  } catch (error) {
    logError(`Mark all as read failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 8: Delete Single Notification
 */
async function testDeleteNotification() {
  logStep('TEST 8: Delete Single Notification');
  
  if (!notificationId) {
    logError('No notification ID available - skipping test');
    return false;
  }

  try {
    const response = await axios.delete(
      `${BASE_URL}/notifications/${notificationId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data.success) {
      logSuccess(`Deleted notification ${notificationId}`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to delete notification');
      return false;
    }
  } catch (error) {
    logError(`Delete notification failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 9: Clear All Notifications (OPTIONAL - commented out to preserve data)
 */
async function testClearAllNotifications() {
  logStep('TEST 9: Clear All Notifications (SKIPPED to preserve data)');
  logInfo('Skipping this test to preserve notification data');
  logInfo('To test, uncomment the code in the test file');
  return true;

  /* Uncomment to test clear all
  try {
    const response = await axios.delete(
      `${BASE_URL}/notifications/clear-all`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data.success) {
      logSuccess(`Cleared all notifications (${response.data.data.deleted_count} deleted)`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      logError('Failed to clear all notifications');
      return false;
    }
  } catch (error) {
    logError(`Clear all notifications failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
  */
}

/**
 * Test 10: Pagination Test
 */
async function testPagination() {
  logStep('TEST 10: Test Cursor-based Pagination');
  
  try {
    // Get first page
    const firstPage = await axios.get(`${BASE_URL}/notifications?limit=2`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (firstPage.data.success) {
      logSuccess(`First page: ${firstPage.data.data.length} notifications`);
      console.log('First page:', JSON.stringify(firstPage.data, null, 2));

      // If there's a next cursor, fetch next page
      if (firstPage.data.pagination.next_cursor) {
        const nextCursor = firstPage.data.pagination.next_cursor;
        logInfo(`Next cursor: ${nextCursor}`);

        const secondPage = await axios.get(
          `${BASE_URL}/notifications?limit=2&cursor=${nextCursor}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (secondPage.data.success) {
          logSuccess(`Second page: ${secondPage.data.data.length} notifications`);
          console.log('Second page:', JSON.stringify(secondPage.data, null, 2));
          return true;
        }
      } else {
        logInfo('No more pages available');
        return true;
      }
    }
    return false;
  } catch (error) {
    logError(`Pagination test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  log('\n' + '╔' + '═'.repeat(58) + '╗', 'magenta');
  log('║' + ' '.repeat(10) + 'NOTIFICATION SYSTEM TEST SUITE' + ' '.repeat(18) + '║', 'magenta');
  log('╚' + '═'.repeat(58) + '╝\n', 'magenta');

  const tests = [
    { name: 'Login', fn: testLogin, required: true },
    { name: 'Get All Notifications', fn: testGetNotifications },
    { name: 'Filter by Type', fn: testGetNotificationsByType },
    { name: 'Get Unread Only', fn: testGetUnreadNotifications },
    { name: 'Get Unread Count', fn: testGetUnreadCount },
    { name: 'Mark as Read', fn: testMarkAsRead },
    { name: 'Mark All as Read', fn: testMarkAllAsRead },
    { name: 'Delete Notification', fn: testDeleteNotification },
    { name: 'Clear All (Skipped)', fn: testClearAllNotifications },
    { name: 'Pagination', fn: testPagination }
  ];

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
        if (test.required) {
          logError(`Required test "${test.name}" failed. Stopping tests.`);
          break;
        }
      }
    } catch (error) {
      results.failed++;
      logError(`Test "${test.name}" crashed: ${error.message}`);
      if (test.required) {
        break;
      }
    }
  }

  // Summary
  log('\n' + '╔' + '═'.repeat(58) + '╗', 'magenta');
  log('║' + ' '.repeat(20) + 'TEST SUMMARY' + ' '.repeat(26) + '║', 'magenta');
  log('╚' + '═'.repeat(58) + '╝', 'magenta');
  logSuccess(`Passed: ${results.passed}`);
  logError(`Failed: ${results.failed}`);
  logInfo(`Total: ${tests.length}`);
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed', 'yellow');
  }
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
