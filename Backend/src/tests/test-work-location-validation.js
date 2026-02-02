/**
 * Test Work Location Validation
 * Tests the new work_location_type, work_state, work_city fields
 * 
 * Usage: Replace AUTH_TOKEN with your actual JWT token, then run:
 * node src/tests/test-work-location-validation.js
 */

const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YWYwY2M1My1kZTgyLTQ4YzctODcxMS0xOGU4ZGVhNmNiOWMiLCJtb2JpbGVfbnVtYmVyIjoiNjM2MjExNTk5OCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMDE2NDIwLCJleHAiOjE3NzAwMTczMjB9.lpi3ztJBsG8e71fMVNuBsJ_K3YWyKhm0CWky_az11To';

// Test user ID
const TEST_USER_ID = '7af0cc53-de82-48c7-8711-18e8dea6cb9c';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Test functions
async function testCreateWithValidLocation() {
  console.log('\n🧪 Test 1: Create professional details with valid work location');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    company_name: 'Tech Corp',
    annual_income_range: '10 - 15 Lakhs',
    work_location_type: 'On-Site',
    work_state: 'Karnataka',
    work_city: 'Bangalore Urban'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (result.ok) {
    console.log('✅ PASS: Professional details created successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAIL:', result.data.message || result.data.error);
  }
}

async function testCreateRemoteWithLocation() {
  console.log('\n🧪 Test 2: Create with REMOTE type but providing state/city (should fail)');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    work_location_type: 'Remote',
    work_state: 'Karnataka',
    work_city: 'Bangalore Urban'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (!result.ok && result.data.message.includes('Remote')) {
    console.log('✅ PASS: Correctly rejected remote with location');
    console.log('Error message:', result.data.message);
  } else {
    console.log('❌ FAIL: Should have rejected but got:', result.data);
  }
}

async function testCreateCityWithoutState() {
  console.log('\n🧪 Test 3: Create with city but no state (should fail)');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    work_city: 'Mumbai'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (!result.ok && result.data.message.includes('state')) {
    console.log('✅ PASS: Correctly rejected city without state');
    console.log('Error message:', result.data.message);
  } else {
    console.log('❌ FAIL: Should have rejected but got:', result.data);
  }
}

async function testInvalidCity() {
  console.log('\n🧪 Test 4: Create with invalid city for state (should fail)');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    work_location_type: 'On-Site',
    work_state: 'Karnataka',
    work_city: 'Mumbai' // Mumbai is in Maharashtra, not Karnataka
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (!result.ok && result.data.message.includes('not valid for state')) {
    console.log('✅ PASS: Correctly rejected invalid city for state');
    console.log('Error message:', result.data.message);
  } else {
    console.log('❌ FAIL: Should have rejected but got:', result.data);
  }
}

async function testInvalidState() {
  console.log('\n🧪 Test 5: Create with invalid state (should fail)');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    work_location_type: 'On-Site',
    work_state: 'InvalidState',
    work_city: 'SomeCity'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (!result.ok && (result.data.message.includes('Invalid work state') || result.data.message.includes('not valid for state'))) {
    console.log('✅ PASS: Correctly rejected invalid state');
    console.log('Error message:', result.data.message);
  } else {
    console.log('❌ FAIL: Should have rejected but got:', result.data);
  }
}

async function testRemoteLocation() {
  console.log('\n🧪 Test 6: Create with Remote location type (should succeed)');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    work_location_type: 'Remote',
    annual_income_range: '10 - 15 Lakhs'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (result.ok) {
    console.log('✅ PASS: Remote location created successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAIL:', result.data.message || result.data.error);
  }
}

async function testUpdateLocation() {
  console.log('\n🧪 Test 7: Update work location (PUT)');
  console.log('=' .repeat(70));
  
  const payload = {
    work_location_type: 'Hybrid',
    work_state: 'Maharashtra',
    work_city: 'Mumbai'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'PUT', payload);
  
  if (result.ok) {
    console.log('✅ PASS: Location updated successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAIL:', result.data.message || result.data.error);
  }
}

async function testPatchLocation() {
  console.log('\n🧪 Test 8: Patch only location type (PATCH)');
  console.log('=' .repeat(70));
  
  const payload = {
    work_location_type: 'Multiple Locations'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'PATCH', payload);
  
  if (result.ok) {
    console.log('✅ PASS: Location type patched successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAIL:', result.data.message || result.data.error);
  }
}

async function testGetProfessionalDetails() {
  console.log('\n🧪 Test 9: Get professional details');
  console.log('=' .repeat(70));
  
  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'GET');
  
  if (result.ok) {
    console.log('✅ PASS: Retrieved professional details');
    console.log('Work Location Type:', result.data.data.work_location_type);
    console.log('Work State:', result.data.data.work_state);
    console.log('Work City:', result.data.data.work_city);
    console.log('\nFull Response:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAIL:', result.data.message || result.data.error);
  }
}

async function testInvalidLocationType() {
  console.log('\n🧪 Test 10: Create with invalid location type (should fail)');
  console.log('=' .repeat(70));
  
  const payload = {
    occupation: 'Software Engineer',
    employment_type: 'Private Job',
    work_location_type: 'InvalidType'
  };

  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'POST', payload);
  
  if (!result.ok && (result.data.message.includes('Invalid work location type') || result.data.message.includes('Invalid option'))) {
    console.log('✅ PASS: Correctly rejected invalid location type');
    console.log('Error message:', result.data.message);
  } else {
    console.log('❌ FAIL: Should have rejected but got:', result.data);
  }
}

async function testDeleteProfessionalDetails() {
  console.log('\n🧪 Cleanup: Delete professional details for next test run');
  console.log('=' .repeat(70));
  
  const result = await apiRequest(`/users/${TEST_USER_ID}/professional`, 'DELETE');
  
  if (result.ok) {
    console.log('✅ Professional details deleted');
  } else {
    console.log('⚠️  Could not delete (might not exist):', result.data.message);
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Starting Work Location Validation Tests');
  console.log('=' .repeat(70));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  
  if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n❌ ERROR: Please replace AUTH_TOKEN with your actual JWT token!');
    process.exit(1);
  }
  
  if (TEST_USER_ID === 'YOUR_USER_ID_HERE') {
    console.log('\n❌ ERROR: Please replace TEST_USER_ID with your actual user ID!');
    process.exit(1);
  }

  try {
    // Clean up first
    await testDeleteProfessionalDetails();
    
    // Run validation tests
    await testCreateCityWithoutState();
    await testCreateRemoteWithLocation();
    await testInvalidCity();
    await testInvalidState();
    await testInvalidLocationType();
    
    // Clean up again
    await testDeleteProfessionalDetails();
    
    // Run successful creation tests
    await testCreateWithValidLocation();
    await testGetProfessionalDetails();
    await testUpdateLocation();
    await testPatchLocation();
    await testGetProfessionalDetails();
    
    // Clean up and test remote
    await testDeleteProfessionalDetails();
    await testRemoteLocation();
    await testGetProfessionalDetails();
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ All tests completed!');
    console.log('=' .repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
runTests();
