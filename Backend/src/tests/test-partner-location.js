/**
 * API Test Script for Partner Preferences Location Implementation
 * Tests preferred_location JSONB field with state-cities mapping
 * 
 * Usage:
 * 1. Start the backend server: npm run dev
 * 2. Set your JWT token and userId in the configuration below
 * 3. Run: node src/tests/test-partner-location.js
 */

import axios from 'axios';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YWYwY2M1My1kZTgyLTQ4YzctODcxMS0xOGU4ZGVhNmNiOWMiLCJtb2JpbGVfbnVtYmVyIjoiNjM2MjExNTk5OCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY5OTQ3MDU5LCJleHAiOjE3Njk5NDc5NTl9.3x-IpvSMzLJu-UUAidVMoUicqhXa3KmCUpS3vYCOrAY',
  USER_ID: '7af0cc53-de82-48c7-8711-18e8dea6cb9c',
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
  console.log('🧪 Starting Partner Location Preferences Tests...\n');
  console.log('Configuration:');
  console.log(`- Base URL: ${CONFIG.BASE_URL}`);
  console.log(`- JWT Token: ${CONFIG.JWT_TOKEN.substring(0, 20)}...`);
  console.log(`- User ID: ${CONFIG.USER_ID}\n`);
  console.log('=' .repeat(80) + '\n');

  // ============================================
  // TEST 1: Update Partner Preferences with Single State, Multiple Cities
  // ============================================
  console.log('TEST 1: Update Partner Preferences - Single State, Multiple Cities');
  const updateSingleStateResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      min_age: 25,
      max_age: 35,
      preferred_location: {
        "Karnataka": ["Bangalore Urban", "Mysore", "Mangalore"]
      }
    }
  );
  
  if (updateSingleStateResult.success && updateSingleStateResult.data.success) {
    const savedLocation = updateSingleStateResult.data.data.partner_preferences.preferred_location;
    const hasCorrectStructure = savedLocation && 
                                savedLocation.Karnataka && 
                                Array.isArray(savedLocation.Karnataka) &&
                                savedLocation.Karnataka.length === 3;
    
    if (hasCorrectStructure) {
      logTest(
        'Update with Single State & Multiple Cities',
        true,
        'Successfully updated preferences with Karnataka and 3 cities',
        { preferred_location: savedLocation }
      );
    } else {
      logTest('Update with Single State & Multiple Cities', false, 'Location not saved correctly', updateSingleStateResult.data);
    }
  } else {
    logTest('Update with Single State & Multiple Cities', false, updateSingleStateResult.error || 'Unexpected response', updateSingleStateResult.fullError);
  }

  // ============================================
  // TEST 2: Update to Multiple States, Multiple Cities
  // ============================================
  console.log('TEST 2: Update Partner Preferences - Multiple States, Multiple Cities');
  const updateMultipleStatesResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: {
        "Karnataka": ["Bangalore Urban", "Mysore"],
        "Maharashtra": ["Mumbai", "Pune"],
        "Tamil Nadu": ["Chennai"]
      }
    }
  );
  
  if (updateMultipleStatesResult.success && updateMultipleStatesResult.data.success) {
    const savedLocation = updateMultipleStatesResult.data.data.partner_preferences.preferred_location;
    const hasThreeStates = savedLocation && 
                          savedLocation.Karnataka && 
                          savedLocation.Maharashtra && 
                          savedLocation["Tamil Nadu"];
    
    if (hasThreeStates) {
      logTest(
        'Update with Multiple States & Cities',
        true,
        'Successfully updated to 3 states with multiple cities',
        { preferred_location: savedLocation }
      );
    } else {
      logTest('Update with Multiple States & Cities', false, 'Location not updated correctly', updateMultipleStatesResult.data);
    }
  } else {
    logTest('Update with Multiple States & Cities', false, updateMultipleStatesResult.error || 'Unexpected response', updateMultipleStatesResult.fullError);
  }

  // ============================================
  // TEST 3: Update to State Without Cities (Any City)
  // ============================================
  console.log('TEST 3: Update Partner Preferences - State Without Specific Cities');
  const updateStateOnlyResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: {
        "Gujarat": []
      }
    }
  );
  
  if (updateStateOnlyResult.success && updateStateOnlyResult.data.success) {
    const savedLocation = updateStateOnlyResult.data.data.partner_preferences.preferred_location;
    const hasGujarat = savedLocation && savedLocation.Gujarat !== undefined;
    
    if (hasGujarat) {
      logTest(
        'Update with State Only (Any City)',
        true,
        'Successfully updated to Gujarat without specific cities',
        { preferred_location: savedLocation }
      );
    } else {
      logTest('Update with State Only (Any City)', false, 'State not saved correctly', updateStateOnlyResult.data);
    }
  } else {
    logTest('Update with State Only (Any City)', false, updateStateOnlyResult.error || 'Unexpected response', updateStateOnlyResult.fullError);
  }

  // ============================================
  // TEST 4: Invalid State (Should Fail)
  // ============================================
  console.log('TEST 4: Invalid State - Should Reject');
  const invalidStateResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: {
        "InvalidState123": ["Some City"]
      }
    },
    true
  );
  
  if (invalidStateResult.success && invalidStateResult.status === 400) {
    logTest(
      'Invalid State Rejection',
      true,
      `Correctly rejected: ${invalidStateResult.error}`
    );
  } else {
    logTest('Invalid State Rejection', false, 'Should have returned 400 error', invalidStateResult);
  }

  // ============================================
  // TEST 5: Invalid City for State (Should Fail)
  // ============================================
  console.log('TEST 5: Invalid City for State - Should Reject');
  const invalidCityResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: {
        "Karnataka": ["Mumbai"]  // Mumbai is in Maharashtra, not Karnataka
      }
    },
    true
  );
  
  if (invalidCityResult.success && invalidCityResult.status === 400) {
    logTest(
      'Invalid City-State Combo Rejection',
      true,
      `Correctly rejected: ${invalidCityResult.error}`
    );
  } else {
    logTest('Invalid City-State Combo Rejection', false, 'Should have returned 400 error', invalidCityResult);
  }

  // ============================================
  // TEST 6: Get Partner Preferences - Verify Formatted Display
  // ============================================
  console.log('TEST 6: Get Partner Preferences - Verify Formatted Display');
  
  // First update to known data
  await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: {
        "Karnataka": ["Bangalore Urban", "Mysore"],
        "Maharashtra": ["Pune"]
      }
    }
  );

  const getPreferencesResult = await makeRequest('GET', `/users/${CONFIG.USER_ID}/preferences`);
  
  if (getPreferencesResult.success && getPreferencesResult.data.success) {
    const preferences = getPreferencesResult.data.data.partner_preferences;
    const hasRawData = preferences.preferred_location;
    const hasFormattedDisplay = preferences.preferred_location_display;
    
    if (hasRawData && hasFormattedDisplay) {
      logTest(
        'GET Preferences with Formatted Display',
        true,
        `Formatted: "${preferences.preferred_location_display}"`,
        { 
          raw: preferences.preferred_location,
          formatted: preferences.preferred_location_display
        }
      );
    } else {
      logTest('GET Preferences with Formatted Display', false, 'Missing formatted display field', preferences);
    }
  } else {
    logTest('GET Preferences with Formatted Display', false, getPreferencesResult.error || 'Unexpected response', getPreferencesResult.fullError);
  }

  // ============================================
  // TEST 7: Mixed Valid States with Cities and Without
  // ============================================
  console.log('TEST 7: Mixed - States with Cities and States Without Cities');
  const mixedResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: {
        "Karnataka": ["Bangalore Urban"],  // Specific cities
        "Tamil Nadu": [],                  // Any city in Tamil Nadu
        "Kerala": ["Cochin", "Thiruvananthapuram"]  // Specific cities
      }
    }
  );
  
  if (mixedResult.success && mixedResult.data.success) {
    const savedLocation = mixedResult.data.data.partner_preferences.preferred_location;
    const hasCorrectStructure = savedLocation && 
                                savedLocation.Karnataka && 
                                savedLocation["Tamil Nadu"] !== undefined &&
                                savedLocation.Kerala;
    
    if (hasCorrectStructure) {
      logTest(
        'Mixed States (With & Without Cities)',
        true,
        'Successfully saved mixed location preferences',
        { preferred_location: savedLocation }
      );
    } else {
      logTest('Mixed States (With & Without Cities)', false, 'Mixed structure not saved correctly', mixedResult.data);
    }
  } else {
    logTest('Mixed States (With & Without Cities)', false, mixedResult.error || 'Unexpected response', mixedResult.fullError);
  }

  // ============================================
  // TEST 8: Clear Location Preferences (Set to null)
  // ============================================
  console.log('TEST 8: Clear Location Preferences');
  const clearResult = await makeRequest(
    'PUT',
    `/users/${CONFIG.USER_ID}/preferences`,
    {
      preferred_location: null
    }
  );
  
  if (clearResult.success && clearResult.data.success) {
    const savedLocation = clearResult.data.data.partner_preferences.preferred_location;
    
    if (savedLocation === null) {
      logTest(
        'Clear Location Preferences',
        true,
        'Successfully cleared location preferences'
      );
    } else {
      logTest('Clear Location Preferences', false, 'Location not cleared', clearResult.data);
    }
  } else {
    logTest('Clear Location Preferences', false, clearResult.error || 'Unexpected response', clearResult.fullError);
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
  console.error('1. Login via POST /auth/login');
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
