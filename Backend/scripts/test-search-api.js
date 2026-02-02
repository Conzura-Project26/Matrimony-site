/**
 * Comprehensive Search API Test Suite
 * Tests all search endpoints with main and edge cases
 * 
 * Usage: node scripts/test-search-api.js
 * 
 * Prerequisites:
 * 1. Server must be running on PORT (default: 3000)
 * 2. Test data must be seeded (run seed-search-test-data.js first)
 * 3. You need a valid JWT token
 */

import axios from 'axios';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_MOBILE = process.env.TEST_MOBILE || '9380422508'; // Mobile from seeded data
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Nishanth@2005';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

let authToken = null;

// Utility Functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(80), colors.cyan);
  log(`  ${message}`, colors.bright + colors.cyan);
  log('='.repeat(80), colors.cyan);
}

function logSubHeader(message) {
  log(`\n${colors.blue}${colors.bright}${message}${colors.reset}`);
  log('-'.repeat(80), colors.gray);
}

function logTest(testName, passed, expectedStatus, actualStatus, responseData = null, errorDetails = null) {
  testResults.total++;
  
  if (passed) {
    testResults.passed++;
    log(`✅ PASS: ${testName}`, colors.green);
    log(`   Expected: ${expectedStatus} | Got: ${actualStatus}`, colors.gray);
  } else {
    testResults.failed++;
    log(`❌ FAIL: ${testName}`, colors.red);
    log(`   Expected: ${expectedStatus} | Got: ${actualStatus}`, colors.red);
    if (errorDetails) {
      log(`   Error: ${errorDetails}`, colors.yellow);
    }
  }
  
  if (responseData && passed) {
    log(`   Response: ${JSON.stringify(responseData).substring(0, 100)}...`, colors.gray);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    expectedStatus,
    actualStatus,
    error: errorDetails,
  });
}

function logSummary() {
  logHeader('TEST SUMMARY');
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  
  log(`\nTotal Tests:    ${testResults.total}`, colors.bright);
  log(`✅ Passed:      ${testResults.passed}`, colors.green);
  log(`❌ Failed:      ${testResults.failed}`, colors.red);
  log(`⏭️  Skipped:     ${testResults.skipped}`, colors.yellow);
  log(`📊 Pass Rate:   ${passRate}%`, passRate >= 90 ? colors.green : colors.yellow);
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', colors.red + colors.bright);
    testResults.tests
      .filter(t => !t.passed)
      .forEach((test, idx) => {
        log(`   ${idx + 1}. ${test.name}`, colors.red);
        log(`      Expected: ${test.expectedStatus} | Got: ${test.actualStatus}`, colors.gray);
        if (test.error) {
          log(`      Error: ${test.error}`, colors.yellow);
        }
      });
  }
  
  log('\n' + '='.repeat(80), colors.cyan);
  
  if (testResults.failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉', colors.green + colors.bright);
  } else {
    log('⚠️  SOME TESTS FAILED - REVIEW ABOVE', colors.yellow + colors.bright);
  }
  log('='.repeat(80) + '\n', colors.cyan);
}

// Authentication
async function authenticate() {
  logSubHeader('🔐 Authentication');
  
  try {
    log('Attempting to login with mobile: ' + TEST_MOBILE, colors.cyan);
    
    // Try to login first
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: TEST_MOBILE,
      password: TEST_PASSWORD,
    }).catch(err => {
      log('❌ Login failed with error:', colors.red);
      log(`   Status: ${err.response?.status}`, colors.yellow);
      log(`   Message: ${err.response?.data?.message || err.message}`, colors.yellow);
      if (err.response?.data?.errors) {
        log(`   Errors: ${JSON.stringify(err.response.data.errors)}`, colors.yellow);
      }
      return { data: { success: false } };
    });
    
    if (loginResponse.data.success && loginResponse.data.data?.accessToken) {
      authToken = loginResponse.data.data.accessToken;
      log('✅ Authentication successful via login!', colors.green);
      log(`   Token: ${authToken.substring(0, 30)}...`, colors.gray);
      return true;
    }
    
    // If login fails, try to register a new test user
    log('Login failed. Attempting to register test user...', colors.yellow);
    
    // First, send OTP
    const otpResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
      mobile_number: TEST_MOBILE,
    });
    
    if (!otpResponse.data.success) {
      log('❌ Failed to send OTP', colors.red);
      return false;
    }
    
    log('✅ OTP sent (check your OTP logs or use a fixed OTP for testing)', colors.green);
    log('⚠️  For testing, you need to manually verify OTP and complete signup', colors.yellow);
    log('   Or seed test data first: node scripts/seed-search-test-data.js', colors.cyan);
    
    return false;
    
  } catch (error) {
    log('❌ Authentication failed:', colors.red);
    log(`   ${error.response?.data?.message || error.message}`, colors.yellow);
    if (error.response?.data?.errors) {
      log(`   Validation errors: ${JSON.stringify(error.response.data.errors, null, 2)}`, colors.yellow);
    }
    log('\n💡 SOLUTION:', colors.cyan + colors.bright);
    log('   1. Make sure server is running: npm run dev', colors.cyan);
    log('   2. Seed test data first: node scripts/seed-search-test-data.js', colors.cyan);
    log('   3. Then run tests again: node scripts/test-search-api.js', colors.cyan);
    return false;
  }
}

// Helper for API calls
async function makeRequest(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message },
      error: error.message,
    };
  }
}

// Test Suites

async function testSimpleSearch() {
  logSubHeader('1️⃣  SIMPLE SEARCH (GET /search/profiles)');
  
  // Test 1.1: Search by keyword
  const test1 = await makeRequest('GET', '/search/profiles', { keyword: 'engineer' });
  logTest(
    'Search by keyword "engineer"',
    test1.status === 200 && test1.data.success,
    200,
    test1.status,
    { resultCount: test1.data.data?.length, hasMore: test1.data.pagination?.has_more },
    test1.error
  );
  
  // Test 1.2: Search by mother tongue
  const test2 = await makeRequest('GET', '/search/profiles', { mother_tongue: 'Hindi' });
  logTest(
    'Search by mother tongue "Hindi"',
    test2.status === 200 && test2.data.success,
    200,
    test2.status,
    { resultCount: test2.data.data?.length },
    test2.error
  );
  
  // Test 1.3: Search by height range
  const test3 = await makeRequest('GET', '/search/profiles', { min_height: 165, max_height: 180 });
  logTest(
    'Search by height range (165-180cm)',
    test3.status === 200 && test3.data.success,
    200,
    test3.status,
    { resultCount: test3.data.data?.length },
    test3.error
  );
  
  // Test 1.4: Search by Rasi
  const test4 = await makeRequest('GET', '/search/profiles', { rasi: 'Mesha (Aries)' });
  logTest(
    'Search by Rasi "Mesha (Aries)"',
    test4.status === 200 && test4.data.success,
    200,
    test4.status,
    { resultCount: test4.data.data?.length },
    test4.error
  );
  
  // Test 1.5: Search by Nakshatra
  const test5 = await makeRequest('GET', '/search/profiles', { nakshatra: 'Ashwini' });
  logTest(
    'Search by Nakshatra "Ashwini"',
    test5.status === 200 && test5.data.success,
    200,
    test5.status,
    { resultCount: test5.data.data?.length },
    test5.error
  );
  
  // Test 1.6: Combined filters
  const test6 = await makeRequest('GET', '/search/profiles', {
    keyword: 'engineer',
    mother_tongue: 'Hindi',
    min_height: 165,
    max_height: 180,
    page: 1
  });
  logTest(
    'Combined filters (keyword + mother_tongue + height)',
    test6.status === 200 && test6.data.success,
    200,
    test6.status,
    { resultCount: test6.data.data?.length, filters: Object.keys(test6.data.filters || {}).length },
    test6.error
  );
  
  // Test 1.7: Pagination - Page 2
  const test7 = await makeRequest('GET', '/search/profiles', { keyword: 'engineer', page: 2 });
  logTest(
    'Pagination - Page 2',
    test7.status === 200 && test7.data.success,
    200,
    test7.status,
    { currentPage: test7.data.pagination?.current_page },
    test7.error
  );
  
  // EDGE CASES
  logSubHeader('1️⃣  SIMPLE SEARCH - EDGE CASES');
  
  // Test 1.8: No filters (should fail)
  const test8 = await makeRequest('GET', '/search/profiles', {});
  logTest(
    'No filters provided (should fail with 400)',
    test8.status === 400,
    400,
    test8.status,
    { message: test8.data.message },
    test8.error
  );
  
  // Test 1.9: Invalid height range (min > max)
  const test9 = await makeRequest('GET', '/search/profiles', { min_height: 180, max_height: 165 });
  logTest(
    'Invalid height range - min > max (should fail with 400)',
    test9.status === 400,
    400,
    test9.status,
    { message: test9.data.message },
    test9.error
  );
  
  // Test 1.10: Height out of bounds
  const test10 = await makeRequest('GET', '/search/profiles', { min_height: 50, max_height: 300 });
  logTest(
    'Height out of bounds (50-300cm, should fail with 400)',
    test10.status === 400,
    400,
    test10.status,
    { message: test10.data.message },
    test10.error
  );
  
  // Test 1.11: Invalid page number (negative)
  const test11 = await makeRequest('GET', '/search/profiles', { keyword: 'engineer', page: -1 });
  logTest(
    'Invalid page number (negative, should fail with 400)',
    test11.status === 400,
    400,
    test11.status,
    { message: test11.data.message },
    test11.error
  );
  
  // Test 1.12: Keyword too short
  const test12 = await makeRequest('GET', '/search/profiles', { keyword: 'a' });
  logTest(
    'Keyword too short (1 char, should fail with 400)',
    test12.status === 400,
    400,
    test12.status,
    { message: test12.data.message },
    test12.error
  );
  
  // Test 1.13: Non-existent keyword (should return empty)
  const test13 = await makeRequest('GET', '/search/profiles', { keyword: 'xyzabc123nonexistent' });
  logTest(
    'Non-existent keyword (should return 0 results)',
    test13.status === 200 && test13.data.data.length === 0,
    200,
    test13.status,
    { resultCount: test13.data.data?.length },
    test13.error
  );
}

async function testAdvancedSearch() {
  logSubHeader('2️⃣  ADVANCED SEARCH (POST /search/advanced)');
  
  // Test 2.1: Search with keyword only
  const test1 = await makeRequest('POST', '/search/advanced', { keyword: 'engineer' });
  logTest(
    'Search with keyword only',
    test1.status === 200 && test1.data.success,
    200,
    test1.status,
    { resultCount: test1.data.data?.length },
    test1.error
  );
  
  // Test 2.2: Multiple mother tongues
  const test2 = await makeRequest('POST', '/search/advanced', {
    mother_tongue: ['Hindi', 'English', 'Tamil']
  });
  logTest(
    'Search with multiple mother tongues',
    test2.status === 200 && test2.data.success,
    200,
    test2.status,
    { resultCount: test2.data.data?.length, tongues: test2.data.filters?.mother_tongue?.length },
    test2.error
  );
  
  // Test 2.3: Height range
  const test3 = await makeRequest('POST', '/search/advanced', {
    min_height: 160,
    max_height: 180
  });
  logTest(
    'Search with height range',
    test3.status === 200 && test3.data.success,
    200,
    test3.status,
    { resultCount: test3.data.data?.length },
    test3.error
  );
  
  // Test 2.4: Multiple Rasis
  const test4 = await makeRequest('POST', '/search/advanced', {
    rasi: ['Mesha (Aries)', 'Simha (Leo)', 'Dhanu (Sagittarius)']
  });
  logTest(
    'Search with multiple Rasis',
    test4.status === 200 && test4.data.success,
    200,
    test4.status,
    { resultCount: test4.data.data?.length, rasis: test4.data.filters?.rasi?.length },
    test4.error
  );
  
  // Test 2.5: Multiple Nakshatras
  const test5 = await makeRequest('POST', '/search/advanced', {
    nakshatra: ['Ashwini', 'Bharani', 'Krittika']
  });
  logTest(
    'Search with multiple Nakshatras',
    test5.status === 200 && test5.data.success,
    200,
    test5.status,
    { resultCount: test5.data.data?.length, nakshatras: test5.data.filters?.nakshatra?.length },
    test5.error
  );
  
  // Test 2.6: All filters combined
  const test6 = await makeRequest('POST', '/search/advanced', {
    page: 1,
    keyword: 'engineer',
    mother_tongue: ['Hindi', 'English'],
    min_height: 165,
    max_height: 180,
    rasi: ['Mesha (Aries)', 'Simha (Leo)'],
    nakshatra: ['Ashwini', 'Bharani']
  });
  logTest(
    'All filters combined',
    test6.status === 200 && test6.data.success,
    200,
    test6.status,
    { resultCount: test6.data.data?.length, filterCount: Object.keys(test6.data.filters || {}).length },
    test6.error
  );
  
  // Test 2.7: Pagination - Page 2
  const test7 = await makeRequest('POST', '/search/advanced', {
    keyword: 'engineer',
    page: 2
  });
  logTest(
    'Pagination - Page 2',
    test7.status === 200 && test7.data.success,
    200,
    test7.status,
    { currentPage: test7.data.pagination?.current_page },
    test7.error
  );
  
  // EDGE CASES
  logSubHeader('2️⃣  ADVANCED SEARCH - EDGE CASES');
  
  // Test 2.8: Empty body (should fail)
  const test8 = await makeRequest('POST', '/search/advanced', {});
  logTest(
    'Empty request body (should fail with 400)',
    test8.status === 400,
    400,
    test8.status,
    { message: test8.data.message },
    test8.error
  );
  
  // Test 2.9: Invalid height range
  const test9 = await makeRequest('POST', '/search/advanced', {
    min_height: 200,
    max_height: 150
  });
  logTest(
    'Invalid height range (should fail with 400)',
    test9.status === 400,
    400,
    test9.status,
    { message: test9.data.message },
    test9.error
  );
  
  // Test 2.10: Invalid page number
  const test10 = await makeRequest('POST', '/search/advanced', {
    keyword: 'engineer',
    page: 0
  });
  logTest(
    'Invalid page number (0, should fail with 400)',
    test10.status === 400,
    400,
    test10.status,
    { message: test10.data.message },
    test10.error
  );
  
  // Test 2.11: Too many mother tongues (>10)
  const test11 = await makeRequest('POST', '/search/advanced', {
    mother_tongue: ['Hindi', 'English', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi', 'Odia']
  });
  logTest(
    'Too many mother tongues (>10, should fail with 400)',
    test11.status === 400,
    400,
    test11.status,
    { message: test11.data.message },
    test11.error
  );
  
  // Test 2.12: Keyword too short
  const test12 = await makeRequest('POST', '/search/advanced', { keyword: 'x' });
  logTest(
    'Keyword too short (1 char, should fail with 400)',
    test12.status === 400,
    400,
    test12.status,
    { message: test12.data.message },
    test12.error
  );
  
  // Test 2.13: Invalid data type for arrays
  const test13 = await makeRequest('POST', '/search/advanced', {
    mother_tongue: 'Hindi' // Should be array
  });
  logTest(
    'Invalid data type - string instead of array (should fail with 400)',
    test13.status === 400,
    400,
    test13.status,
    { message: test13.data.message },
    test13.error
  );
  
  // Test 2.14: Empty arrays (should fail)
  const test14 = await makeRequest('POST', '/search/advanced', {
    mother_tongue: []
  });
  logTest(
    'Empty array (should fail with 400)',
    test14.status === 400,
    400,
    test14.status,
    { message: test14.data.message },
    test14.error
  );
}

async function testProfileIdSearch() {
  logSubHeader('3️⃣  PROFILE ID SEARCH (GET /search/profile/:profileId)');
  
  // Test 3.1: Valid profile ID
  const test1 = await makeRequest('GET', '/search/profile/MAT00000001');
  logTest(
    'Search by valid profile ID (MAT00000001)',
    test1.status === 200 && test1.data.success,
    200,
    test1.status,
    { profileId: test1.data.data?.profile_id, name: test1.data.data?.full_name },
    test1.error
  );
  
  // Test 3.2: Another valid profile ID
  const test2 = await makeRequest('GET', '/search/profile/MAT00000011');
  logTest(
    'Search by valid profile ID (MAT00000011)',
    test2.status === 200 && test2.data.success,
    200,
    test2.status,
    { profileId: test2.data.data?.profile_id, name: test2.data.data?.full_name },
    test2.error
  );
  
  // EDGE CASES
  logSubHeader('3️⃣  PROFILE ID SEARCH - EDGE CASES');
  
  // Test 3.3: Non-existent profile ID
  const test3 = await makeRequest('GET', '/search/profile/MAT99999999');
  logTest(
    'Non-existent profile ID (should fail with 400/404)',
    test3.status === 400 || test3.status === 404,
    '400/404',
    test3.status,
    { message: test3.data.message },
    test3.error
  );
  
  // Test 3.4: Invalid profile ID - too short
  const test4 = await makeRequest('GET', '/search/profile/MAT1');
  logTest(
    'Invalid profile ID - too short (should fail with 400)',
    test4.status === 400,
    400,
    test4.status,
    { message: test4.data.message },
    test4.error
  );
  
  // Test 3.5: Invalid profile ID - special characters
  const test5 = await makeRequest('GET', '/search/profile/MAT@@@12345');
  logTest(
    'Invalid profile ID - special characters (should fail with 400)',
    test5.status === 400,
    400,
    test5.status,
    { message: test5.data.message },
    test5.error
  );
  
  // Test 3.6: Invalid profile ID - wrong format
  const test6 = await makeRequest('GET', '/search/profile/INVALID12345');
  logTest(
    'Invalid profile ID - wrong format (should return 400/404)',
    test6.status === 400 || test6.status === 404,
    '400/404',
    test6.status,
    { message: test6.data.message },
    test6.error
  );
  
  // Test 3.7: Empty profile ID
  const test7 = await makeRequest('GET', '/search/profile/');
  logTest(
    'Empty profile ID (should fail with 404)',
    test7.status === 404,
    404,
    test7.status,
    { message: test7.data.message },
    test7.error
  );
}

async function testAuthentication() {
  logSubHeader('4️⃣  AUTHENTICATION & AUTHORIZATION TESTS');
  
  // Test 4.1: Request without token (simple search)
  const tempToken = authToken;
  authToken = null;
  const test1 = await makeRequest('GET', '/search/profiles', { keyword: 'engineer' });
  logTest(
    'Simple search without token (should fail with 401)',
    test1.status === 401,
    401,
    test1.status,
    { message: test1.data.message },
    test1.error
  );
  
  // Test 4.2: Request without token (advanced search)
  const test2 = await makeRequest('POST', '/search/advanced', { keyword: 'engineer' });
  logTest(
    'Advanced search without token (should fail with 401)',
    test2.status === 401,
    401,
    test2.status,
    { message: test2.data.message },
    test2.error
  );
  
  // Test 4.3: Request without token (profile ID search)
  const test3 = await makeRequest('GET', '/search/profile/MAT00000001');
  logTest(
    'Profile ID search without token (should fail with 401)',
    test3.status === 401,
    401,
    test3.status,
    { message: test3.data.message },
    test3.error
  );
  
  // Restore token
  authToken = tempToken;
  
  // Test 4.4: Request with invalid token
  authToken = 'invalid.token.here';
  const test4 = await makeRequest('GET', '/search/profiles', { keyword: 'engineer' });
  logTest(
    'Request with invalid token (should fail with 401)',
    test4.status === 401,
    401,
    test4.status,
    { message: test4.data.message },
    test4.error
  );
  
  // Restore valid token
  authToken = tempToken;
}

// Main test runner
async function runAllTests() {
  logHeader('🧪 SEARCH API COMPREHENSIVE TEST SUITE');
  log(`Base URL: ${BASE_URL}`, colors.cyan);
  log(`Test Mobile: ${TEST_MOBILE}`, colors.cyan);
  log(`Time: ${new Date().toISOString()}`, colors.cyan);
  
  // Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    log('\n❌ Cannot proceed without authentication. Exiting...', colors.red);
    process.exit(1);
  }
  
  // Run all test suites
  await testSimpleSearch();
  await testAdvancedSearch();
  await testProfileIdSearch();
  await testAuthentication();
  
  // Display summary
  logSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log('\n❌ FATAL ERROR:', colors.red + colors.bright);
  log(error.message, colors.red);
  log(error.stack, colors.gray);
  process.exit(1);
});
