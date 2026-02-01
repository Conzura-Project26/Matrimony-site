/**
 * API Test Script for Location Fields Implementation
 * Tests all endpoints: states, cities, personal details with location validation
 * 
 * Usage:
 * 1. Start the backend server: npm run dev
 * 2. Set your JWT token and userId in the configuration below
 * 3. Run: node test-location-api.js
 */

import axios from 'axios';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY5OTQxOTM0LCJleHAiOjE3Njk5NDI4MzR9.yRW35qc-AMmFxjps5l6u99l6HYt0fd2hXoezhZraxDU',
  USER_ID: 'f6ab094e-2900-497f-bb0d-000cc93a25db',
};

// ============================================
// TEST UTILITIES
// ============================================
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

const logTest = (testName, passed, message, data = null) => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
    if (message) console.log(`   ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   ${message}`);
    if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
  console.log('');
  
  testResults.details.push({ testName, passed, message });
};

const makeRequest = async (method, endpoint, data = null, expectError = false) => {
  try {
    const config = {
      method,
      url: `${CONFIG.BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (expectError) {
      return { success: false, error: 'Expected error but got success', response: response.data };
    }
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (expectError) {
      return { 
        success: true, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      fullError: error.response?.data
    };
  }
};

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('🧪 Starting Location API Tests...\n');
  console.log('Configuration:');
  console.log(`- Base URL: ${CONFIG.BASE_URL}`);
  console.log(`- JWT Token: ${CONFIG.JWT_TOKEN.substring(0, 20)}...`);
  console.log(`- User ID: ${CONFIG.USER_ID}\n`);
  console.log('=' .repeat(80) + '\n');

  // ============================================
  // TEST 1: Get All States
  // ============================================
  console.log('TEST 1: Get All States');
  const statesResult = await makeRequest('GET', '/master/states');
  if (statesResult.success && statesResult.data.success) {
    const count = statesResult.data.count;
    const hasKarnataka = statesResult.data.data.includes('Karnataka');
    const hasMaharashtra = statesResult.data.data.includes('Maharashtra');
    
    if (count >= 28 && hasKarnataka && hasMaharashtra) {
      logTest(
        'Get All States',
        true,
        `Retrieved ${count} states including Karnataka and Maharashtra`,
        { firstFive: statesResult.data.data.slice(0, 5) }
      );
    } else {
      logTest('Get All States', false, `Expected at least 28 states with Karnataka and Maharashtra`, statesResult.data);
    }
  } else {
    logTest('Get All States', false, statesResult.error || 'Unexpected response', statesResult.fullError);
  }

  // ============================================
  // TEST 2: Get All Cities by State (Karnataka)
  // ============================================
  console.log('TEST 2: Get All Cities by State (Karnataka)');
  const citiesResult = await makeRequest('GET', '/master/cities?state=Karnataka');
  if (citiesResult.success && citiesResult.data.success) {
    const count = citiesResult.data.count;
    
    if (count > 0) {
      logTest(
        'Get Cities for Karnataka',
        true,
        `Retrieved ${count} cities for Karnataka`,
        { firstTen: citiesResult.data.data.slice(0, 10) }
      );
    } else {
      logTest('Get Cities for Karnataka', false, 'No cities returned', citiesResult.data);
    }
  } else {
    logTest('Get Cities for Karnataka', false, citiesResult.error || 'Unexpected response', citiesResult.fullError);
  }

  // ============================================
  // TEST 3: Search Cities with Query Parameter
  // ============================================
  console.log('TEST 3: Search Cities with Query Parameter');
  const searchResult = await makeRequest('GET', '/master/cities?state=Karnataka&search=Bang');
  if (searchResult.success && searchResult.data.success) {
    const count = searchResult.data.count;
    const cities = searchResult.data.data;
    
    if (count > 0 && cities.some(city => city.toLowerCase().includes('bang'))) {
      logTest(
        'Search Cities in Karnataka',
        true,
        `Found ${count} cities matching "Bang"`,
        { results: cities }
      );
    } else {
      logTest('Search Cities in Karnataka', false, 'Expected to find cities with "Bang"', searchResult.data);
    }
  } else {
    logTest('Search Cities in Karnataka', false, searchResult.error || 'Unexpected response', searchResult.fullError);
  }

  // ============================================
  // TEST 4: Get Cities - Missing State Parameter (Error)
  // ============================================
  console.log('TEST 4: Get Cities - Missing State Parameter (Should Fail)');
  const missingStateResult = await makeRequest('GET', '/master/cities', null, true);
  if (missingStateResult.success && missingStateResult.status === 400) {
    logTest(
      'Missing State Parameter',
      true,
      `Correctly rejected with 400: ${missingStateResult.error}`
    );
  } else {
    logTest('Missing State Parameter', false, 'Should have returned 400 error', missingStateResult);
  }

  // ============================================
  // TEST 5: Get Cities - Invalid State (Error)
  // ============================================
  console.log('TEST 5: Get Cities - Invalid State (Should Fail)');
  const invalidStateResult = await makeRequest('GET', '/master/cities?state=InvalidState123', null, true);
  if (invalidStateResult.success && invalidStateResult.status === 400) {
    logTest(
      'Invalid State Parameter',
      true,
      `Correctly rejected with 400: ${invalidStateResult.error}`
    );
  } else {
    logTest('Invalid State Parameter', false, 'Should have returned 400 error', invalidStateResult);
  }

  // ============================================
  // TEST 6: Update Personal Details - City Without State (Error)
  // ============================================
  console.log('TEST 6: Update Personal Details - City Without State (Should Fail)');
  const cityNoStateResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/personal`,
    { city: 'Bangalore Urban' },
    true
  );
  if (cityNoStateResult.success && cityNoStateResult.status === 400) {
    logTest(
      'City Without State',
      true,
      `Correctly rejected with 400: ${cityNoStateResult.error}`
    );
  } else {
    logTest('City Without State', false, 'Should have returned 400 error', cityNoStateResult);
  }

  // ============================================
  // TEST 7: Update Personal Details - Invalid State (Error)
  // ============================================
  console.log('TEST 7: Update Personal Details - Invalid State (Should Fail)');
  const invalidStateUpdateResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/personal`,
    { state: 'InvalidState', city: 'Bangalore Urban' },
    true
  );
  if (invalidStateUpdateResult.success && invalidStateUpdateResult.status === 400) {
    logTest(
      'Invalid State in Update',
      true,
      `Correctly rejected with 400: ${invalidStateUpdateResult.error}`
    );
  } else {
    logTest('Invalid State in Update', false, 'Should have returned 400 error', invalidStateUpdateResult);
  }

  // ============================================
  // TEST 8: Update Personal Details - City Not in State (Error)
  // ============================================
  console.log('TEST 8: Update Personal Details - City Not in Selected State (Should Fail)');
  const wrongCityResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/personal`,
    { state: 'Karnataka', city: 'Mumbai' },
    true
  );
  if (wrongCityResult.success && wrongCityResult.status === 400) {
    logTest(
      'City Not in Selected State',
      true,
      `Correctly rejected with 400: ${wrongCityResult.error}`
    );
  } else {
    logTest('City Not in Selected State', false, 'Should have returned 400 error', wrongCityResult);
  }

  // ============================================
  // TEST 9: Update Personal Details - Only State (Valid)
  // ============================================
  console.log('TEST 9: Update Personal Details - Only State (Should Succeed)');
  const onlyStateResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/personal`,
    { state: 'Karnataka' }
  );
  if (onlyStateResult.success && onlyStateResult.data.success) {
    const savedState = onlyStateResult.data.data.state;
    
    if (savedState === 'Karnataka') {
      logTest(
        'Update with Only State',
        true,
        'Successfully updated personal details with only state'
      );
    } else {
      logTest('Update with Only State', false, 'State not saved correctly', onlyStateResult.data);
    }
  } else {
    logTest('Update with Only State', false, onlyStateResult.error || 'Unexpected response', onlyStateResult.fullError);
  }

  // ============================================
  // TEST 10: Update Personal Details - Valid State and City (Valid)
  // ============================================
  console.log('TEST 10: Update Personal Details - Valid State and City (Should Succeed)');
  const validUpdateResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/personal`,
    { 
      state: 'Karnataka', 
      city: 'Bangalore Urban',
      height_cm: 175,
      marital_status: 'Never Married'
    }
  );
  if (validUpdateResult.success && validUpdateResult.data.success) {
    const savedState = validUpdateResult.data.data.state;
    const savedCity = validUpdateResult.data.data.city;
    
    if (savedState === 'Karnataka' && savedCity === 'Bangalore Urban') {
      logTest(
        'Update with Valid State and City',
        true,
        'Successfully updated personal details with valid location',
        { state: savedState, city: savedCity }
      );
    } else {
      logTest('Update with Valid State and City', false, 'Location not saved correctly', validUpdateResult.data);
    }
  } else {
    logTest('Update with Valid State and City', false, validUpdateResult.error || 'Unexpected response', validUpdateResult.fullError);
  }

  // ============================================
  // TEST 11: Get Personal Details - Verify Location Saved
  // ============================================
  console.log('TEST 11: Get Personal Details - Verify Location Saved');
  const getDetailsResult = await makeRequest('GET', `/users/${CONFIG.USER_ID}/personal`);
  if (getDetailsResult.success && getDetailsResult.data.success) {
    const personalDetails = getDetailsResult.data.data.personal_details;
    
    if (personalDetails && personalDetails.state && personalDetails.city) {
      logTest(
        'Verify Location Saved',
        true,
        `Location retrieved: ${personalDetails.state}, ${personalDetails.city}`,
        { state: personalDetails.state, city: personalDetails.city }
      );
    } else {
      logTest('Verify Location Saved', false, 'Location fields not found in response', personalDetails);
    }
  } else {
    logTest('Verify Location Saved', false, getDetailsResult.error || 'Unexpected response', getDetailsResult.fullError);
  }

  // ============================================
  // TEST 12: Update with Different City in Same State (Valid)
  // ============================================
  console.log('TEST 12: Update with Different City in Same State');
  const differentCityResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/personal`,
    { 
      state: 'Maharashtra', 
      city: 'Mumbai'
    }
  );
  if (differentCityResult.success && differentCityResult.data.success) {
    const savedState = differentCityResult.data.data.state;
    const savedCity = differentCityResult.data.data.city;
    
    if (savedState === 'Maharashtra' && savedCity === 'Mumbai') {
      logTest(
        'Update with Different State/City',
        true,
        'Successfully updated to Maharashtra, Mumbai',
        { state: savedState, city: savedCity }
      );
    } else {
      logTest('Update with Different State/City', false, 'Location not updated correctly', differentCityResult.data);
    }
  } else {
    logTest('Update with Different State/City', false, differentCityResult.error || 'Unexpected response', differentCityResult.fullError);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('=' .repeat(80));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.testName}: ${t.message}`));
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// ============================================
// MAIN EXECUTION
// ============================================

// Check if configuration is set
if (CONFIG.JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE' || CONFIG.USER_ID === 'YOUR_USER_ID_HERE') {
  console.error('❌ ERROR: Please update JWT_TOKEN and USER_ID in the configuration section');
  console.error('\nTo get these values:');
  console.error('1. Login via POST /api/auth/login');
  console.error('2. Copy the JWT token from the response');
  console.error('3. Copy your user ID from the response');
  console.error('4. Update the CONFIG object at the top of this file\n');
  process.exit(1);
}

// Add timeout
setTimeout(() => {
  console.error('\n❌ Test suite timed out after 60 seconds');
  process.exit(1);
}, 60000);

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:', error.message);
  console.error(error);
  process.exit(1);
});
