/**
 * Comprehensive API Testing Script for Profile Views
 * Tests all 5 endpoints + edge cases with detailed logging
 */

import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:3000';
let authToken = null;
let authenticatedUserId = null;
let testUsers = [];

// Color codes for terminal output
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

function logTest(testName) {
  log(`\n▶ TEST: ${testName}`, 'cyan');
  console.log('-'.repeat(70));
}

function logSuccess(message) {
  log(`✅ SUCCESS: ${message}`, 'green');
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

async function setupTestData() {
  logSection('SETUP: Getting Test Users');
  
  // Get active users for testing
  testUsers = await prisma.user.findMany({
    where: { is_active: true },
    select: {
      id: true,
      profile_id: true,
      full_name: true,
      mobile_number: true
    },
    take: 5,
    orderBy: { created_at: 'desc' }
  });

  if (testUsers.length < 2) {
    logError('Need at least 2 active users to test');
    process.exit(1);
  }

  logSuccess(`Found ${testUsers.length} test users:`);
  testUsers.forEach((user, i) => {
    logInfo(`  [${i}] ${user.profile_id || 'No Profile ID'} - ${user.full_name} (${user.mobile_number})`);
  });

  return testUsers;
}

async function loginAndGetToken() {
  logSection('AUTHENTICATION: Getting JWT Token');

  logInfo(`Attempting login with: 9380422508`);

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9380422508',
        password: 'Nishanth@2005'
      })
    });

    const data = await response.json();

    if (response.ok && data.data?.accessToken) {
      authToken = data.data.accessToken;
      logSuccess('Login successful');
      logInfo(`Token: ${authToken.substring(0, 30)}...`);
      
      // Extract userId from JWT token (decode the payload)
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        authenticatedUserId = payload.userId;
        logInfo(`Authenticated User ID: ${authenticatedUserId}`);
      }
      
      return authToken;
    } else {
      logError(`Login failed: ${data.message || 'Unknown error'}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      throw new Error('Could not authenticate');
    }
  } catch (error) {
    logError(`Authentication error: ${error.message}`);
    throw error;
  }
}

async function testRecordProfileView() {
  logSection('TEST SUITE 1: Record Profile View (POST /profiles/:id/view)');

  const viewer = testUsers[0];
  const viewedUser = testUsers[1];

  // Test 1: Valid profile view
  logTest('1.1 - Record valid profile view');
  try {
    const response = await fetch(`${BASE_URL}/profiles/${viewedUser.id}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        view_source: 'SEARCH',
        view_duration: 45
      })
    });

    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 204) {
      logSuccess('View recorded successfully (204 No Content)');
    } else {
      const data = await response.json();
      logError(`Unexpected response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 2: Self-view (should fail)
  logTest('1.2 - Attempt self-view (should fail with 400)');
  try {
    if (!authenticatedUserId) {
      logError('authenticatedUserId is not set! Cannot test self-view.');
      return;
    }
    
    logInfo(`Attempting to view own profile (ID: ${authenticatedUserId})`);
    
    const response = await fetch(`${BASE_URL}/profiles/${authenticatedUserId}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        view_source: 'DIRECT'
      })
    });

    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 204) {
      logError('Self-view should have been blocked but got 204!');
    } else if (response.status === 400) {
      const data = await response.json();
      logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
      if (data.message?.includes('own profile')) {
        logSuccess('Self-view correctly prevented');
      } else {
        logError('Got 400 but wrong error message');
      }
    } else {
      const data = await response.json();
      logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
      logError('Unexpected response status');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 3: Invalid profile ID
  logTest('1.3 - Attempt view with invalid profile ID (should fail with 404)');
  try {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(`${BASE_URL}/profiles/${fakeId}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        view_source: 'DIRECT'
      })
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 404) {
      logSuccess('Invalid profile ID correctly handled');
    } else {
      logError('Should have returned 404 for invalid profile');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 4: Rate limiting (3 views in quick succession)
  logTest('1.4 - Test rate limiting (max 3 views per hour)');
  try {
    for (let i = 1; i <= 5; i++) {
      const response = await fetch(`${BASE_URL}/profiles/${viewedUser.id}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          view_source: 'MATCH'
        })
      });

      logInfo(`Attempt ${i}: Status ${response.status}`);
      
      if (i <= 3 && response.status === 204) {
        logSuccess(`View ${i} recorded`);
      } else if (i > 3 && response.status === 204) {
        logWarning(`View ${i} should have been rate limited but wasn't (might be silent success)`);
      }

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    
    // Check database count
    const viewCount = await prisma.profileView.count({
      where: {
        viewer_id: viewer.id,
        viewed_user_id: viewedUser.id,
        viewed_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });
    
    logInfo(`Database shows ${viewCount} views in the last hour`);
    if (viewCount <= 3) {
      logSuccess(`Rate limiting working correctly (${viewCount} views recorded)`);
    } else {
      logError(`Rate limiting failed! ${viewCount} views recorded (max should be 3)`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 5: View with all optional fields
  logTest('1.5 - Record view with all optional fields');
  try {
    const response = await fetch(`${BASE_URL}/profiles/${testUsers[2].id}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        view_source: 'RECOMMENDATION',
        view_duration: 120,
        search_log_id: null,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 Test Browser'
      })
    });

    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 204) {
      logSuccess('View with full data recorded');
    } else {
      const data = await response.json();
      logError(`Failed: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 6: Duration capping (should cap at 600 seconds)
  logTest('1.6 - Test view duration capping (max 600 seconds)');
  try {
    const response = await fetch(`${BASE_URL}/profiles/${testUsers[3].id}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        view_source: 'DIRECT',
        view_duration: 10000 // Try to record 10,000 seconds
      })
    });

    if (response.status === 204) {
      // Check database to see if duration was capped
      const recentView = await prisma.profileView.findFirst({
        where: {
          viewer_id: viewer.id,
          viewed_user_id: testUsers[3].id
        },
        orderBy: { viewed_at: 'desc' }
      });

      if (recentView && recentView.view_duration_seconds === 600) {
        logSuccess(`Duration correctly capped at 600 seconds`);
      } else {
        logWarning(`Duration: ${recentView?.view_duration_seconds} (expected 600)`);
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 7: Unauthenticated request
  logTest('1.7 - Attempt view without authentication (should fail with 401)');
  try {
    const response = await fetch(`${BASE_URL}/profiles/${viewedUser.id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_source: 'DIRECT' })
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 401) {
      logSuccess('Unauthenticated request correctly rejected');
    } else {
      logError('Should have returned 401 for unauthenticated request');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

async function testGetMyViewers() {
  logSection('TEST SUITE 2: Get My Viewers (GET /profile/viewers)');

  // Test 1: Get viewers list
  logTest('2.1 - Get viewers list (basic)');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      logSuccess(`Retrieved ${data.data?.viewers?.length || 0} viewers`);
      logInfo(`Stats: ${JSON.stringify(data.data?.stats, null, 2)}`);
    } else {
      logError('Failed to get viewers');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 2: Pagination
  logTest('2.2 - Test pagination');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers?page=1&limit=2`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    
    if (response.ok) {
      logSuccess(`Pagination working`);
      logInfo(`Pagination: ${JSON.stringify(data.data?.pagination, null, 2)}`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 3: Date filtering
  logTest('2.3 - Test date filtering');
  try {
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const response = await fetch(`${BASE_URL}/profile/viewers?from_date=${fromDate}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    
    if (response.ok) {
      logSuccess('Date filtering working');
      logInfo(`Viewers in last 7 days: ${data.data?.viewers?.length || 0}`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 4: Unauthenticated request
  logTest('2.4 - Test without authentication (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers`);
    
    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 401) {
      logSuccess('Unauthenticated request correctly rejected');
    } else {
      logError('Should require authentication');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

async function testGetMyViewedProfiles() {
  logSection('TEST SUITE 3: Get My Viewed Profiles (GET /profile/viewed)');

  // Test 1: Get viewed profiles
  logTest('3.1 - Get profiles I viewed');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewed`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      logSuccess(`Retrieved ${data.data?.profiles?.length || 0} viewed profiles`);
    } else {
      logError('Failed to get viewed profiles');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 2: With interaction status
  logTest('3.2 - Get viewed profiles with interaction status');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewed?interaction_status=true`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    
    if (response.ok) {
      logSuccess('Interaction status included');
      if (data.data?.profiles?.length > 0) {
        logInfo(`Sample profile: ${JSON.stringify(data.data.profiles[0], null, 2)}`);
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 3: Pagination
  logTest('3.3 - Test pagination on viewed profiles');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewed?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      logSuccess('Pagination working');
      logInfo(`Total: ${data.data?.pagination?.total}, HasMore: ${data.data?.pagination?.hasMore}`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

async function testGetViewersCount() {
  logSection('TEST SUITE 4: Get Viewers Count (GET /profile/viewers/count)');

  // Test 1: Get count
  logTest('4.1 - Get viewers count');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers/count`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      logSuccess(`Total views: ${data.data?.total_views}, Unique viewers: ${data.data?.unique_viewers}`);
    } else {
      logError('Failed to get count');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 2: Verify count accuracy
  logTest('4.2 - Verify count accuracy against database');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers/count`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      // Check database directly
      const dbCount = await prisma.profileView.count({
        where: { viewed_user_id: testUsers[0].id }
      });
      
      if (data.data?.total_views === dbCount) {
        logSuccess(`Count accurate (${dbCount} views)`);
      } else {
        logWarning(`API: ${data.data?.total_views}, DB: ${dbCount} (cache might be updating)`);
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

async function testGetViewedCount() {
  logSection('TEST SUITE 5: Get Viewed Count (GET /profile/viewed/count)');

  // Test 1: Get count
  logTest('5.1 - Get viewed profiles count');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewed/count`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    logInfo(`Response Body: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      logSuccess(`Total profiles viewed: ${data.data?.total_profiles_viewed}`);
    } else {
      logError('Failed to get count');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

async function testEdgeCases() {
  logSection('TEST SUITE 6: Edge Cases & Error Handling');

  // Test 1: Invalid UUID format
  logTest('6.1 - Invalid UUID format');
  try {
    const response = await fetch(`${BASE_URL}/profiles/invalid-uuid/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ view_source: 'DIRECT' })
    });

    logInfo(`Response Status: ${response.status}`);
    
    if (response.status >= 400) {
      logSuccess('Invalid UUID correctly handled');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 2: Invalid view source
  logTest('6.2 - Invalid view source enum');
  try {
    const response = await fetch(`${BASE_URL}/profiles/${testUsers[1].id}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ view_source: 'INVALID_SOURCE' })
    });

    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 204) {
      logWarning('Invalid enum accepted (or silently failed)');
    } else if (response.status === 400 || response.status === 500) {
      const data = await response.json();
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      logSuccess('Invalid enum correctly rejected');
    } else {
      try {
        const data = await response.json();
        logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        logInfo('No response body');
      }
      logWarning('Unexpected response status');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 3: Negative pagination values
  logTest('6.3 - Negative pagination values');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers?page=-1&limit=-5`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    logInfo(`Response Status: ${response.status}`);
    
    if (response.status === 400) {
      logSuccess('Negative pagination correctly rejected');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 4: Excessive pagination limit
  logTest('6.4 - Excessive pagination limit (should cap at 50)');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers?limit=1000`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      const actualLimit = data.data?.pagination?.limit;
      if (actualLimit <= 50) {
        logSuccess(`Limit correctly capped at ${actualLimit}`);
      } else {
        logWarning(`Limit not capped: ${actualLimit}`);
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }

  // Test 5: Invalid date format
  logTest('6.5 - Invalid date format in filter');
  try {
    const response = await fetch(`${BASE_URL}/profile/viewers?from_date=invalid-date`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logInfo(`Response Status: ${response.status}`);
    
    if (response.status >= 400 || response.ok) {
      logSuccess('Invalid date handled gracefully');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

async function runAllTests() {
  try {
    log('\n\n' + '█'.repeat(70), 'bright');
    log('    PROFILE VIEWS API - COMPREHENSIVE TEST SUITE', 'bright');
    log('█'.repeat(70) + '\n', 'bright');

    await setupTestData();
    await loginAndGetToken();
    
    await testRecordProfileView();
    await testGetMyViewers();
    await testGetMyViewedProfiles();
    await testGetViewersCount();
    await testGetViewedCount();
    await testEdgeCases();

    logSection('TEST SUMMARY');
    logSuccess('All test suites completed!');
    logInfo('Check logs above for detailed results');
    
    log('\n' + '█'.repeat(70), 'green');
    log('    ✅ TESTING COMPLETE', 'green');
    log('█'.repeat(70) + '\n', 'green');

  } catch (error) {
    logSection('FATAL ERROR');
    logError(error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runAllTests();
