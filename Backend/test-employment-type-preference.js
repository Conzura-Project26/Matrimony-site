/**
 * Employment Type Preference Testing Script
 * Tests the new enum-based validation for employment_type_preference field
 * 
 * Run: node test-employment-type-preference.js [AUTH_TOKEN] [USER_ID]
 */

import axios from 'axios';
import readline from 'readline';

// ============================================
// CONFIGURATION
// ============================================
const BASE_URL = 'http://localhost:3000';
let AUTH_TOKEN = ''; // Will be set from user input
let USER_ID = ''; // Will be set from user input

// Valid Employment Types (from EmploymentType enum)
const VALID_EMPLOYMENT_TYPES = [
  'Government Job',
  'Private Job',
  'Business',
  'Self-Employed',
  'Freelancer / Consultant',
  'Homemaker',
  'Student',
  'Retired',
  'Not Working'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testNumber, description) {
  console.log(`\n${'='.repeat(60)}`);
  log(`TEST ${testNumber}: ${description}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ PASS: ${message}`, 'green');
}

function logError(message) {
  log(`❌ FAIL: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// ============================================
// TEST CASES
// ============================================

async function test1_SingleEmploymentType() {
  logTest(1, 'Create preferences with single employment type');

  const payload = {
    employment_type_preference: ['Government Job']
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (result.success && result.data.data.partner_preferences.employment_type_preference.length === 1) {
    logSuccess('Single employment type preference created successfully');
    console.log('Response:', JSON.stringify(result.data.data.partner_preferences.employment_type_preference, null, 2));
    return true;
  } else {
    logError('Failed to create single employment type preference');
    console.log('Error:', result.error);
    return false;
  }
}

async function test2_MultipleEmploymentTypes() {
  logTest(2, 'Update preferences with multiple employment types');

  const payload = {
    employment_type_preference: ['Government Job', 'Private Job', 'Business']
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (result.success && result.data.data.partner_preferences.employment_type_preference.length === 3) {
    logSuccess('Multiple employment types set successfully');
    console.log('Response:', JSON.stringify(result.data.data.partner_preferences.employment_type_preference, null, 2));
    return true;
  } else {
    logError('Failed to set multiple employment types');
    console.log('Error:', result.error);
    return false;
  }
}

async function test3_AllValidEmploymentTypes() {
  logTest(3, 'Test all valid employment type enum values');

  const payload = {
    employment_type_preference: VALID_EMPLOYMENT_TYPES
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (result.success && result.data.data.partner_preferences.employment_type_preference.length === 9) {
    logSuccess('All 9 employment types accepted successfully');
    console.log('Response:', JSON.stringify(result.data.data.partner_preferences.employment_type_preference, null, 2));
    return true;
  } else {
    logError('Failed to accept all employment types');
    console.log('Error:', result.error);
    return false;
  }
}

async function test4_InvalidEmploymentType() {
  logTest(4, 'Test INVALID employment type (should FAIL validation)');

  const payload = {
    employment_type_preference: ['Software Engineer'] // Old free-text format - should fail
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (!result.success && (result.status === 400 || result.status === 422)) {
    logSuccess('Correctly rejected invalid employment type "Software Engineer"');
    console.log('Validation error:', JSON.stringify(result.error, null, 2));
    return true;
  } else {
    logError('SECURITY ISSUE: Invalid employment type was accepted!');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return false;
  }
}

async function test5_InvalidTypo() {
  logTest(5, 'Test employment type with TYPO (should FAIL validation)');

  const payload = {
    employment_type_preference: ['Goverment Job'] // Typo: "Goverment" instead of "Government"
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (!result.success && (result.status === 400 || result.status === 422)) {
    logSuccess('Correctly rejected typo "Goverment Job"');
    console.log('Validation error:', JSON.stringify(result.error, null, 2));
    return true;
  } else {
    logError('SECURITY ISSUE: Typo was accepted!');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return false;
  }
}

async function test6_EmptyArray() {
  logTest(6, 'Test empty array (no preference - should succeed)');

  const payload = {
    employment_type_preference: []
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (result.success && result.data.data.partner_preferences.employment_type_preference.length === 0) {
    logSuccess('Empty array accepted (no preference set)');
    console.log('Response:', JSON.stringify(result.data.data.partner_preferences.employment_type_preference, null, 2));
    return true;
  } else {
    logError('Failed to accept empty array');
    console.log('Error:', result.error);
    return false;
  }
}

async function test7_MixedValidInvalid() {
  logTest(7, 'Test mixed valid and invalid values (should FAIL)');

  const payload = {
    employment_type_preference: ['Government Job', 'Doctor', 'Private Job'] // "Doctor" is invalid
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (!result.success && (result.status === 400 || result.status === 422)) {
    logSuccess('Correctly rejected array with invalid value "Doctor"');
    console.log('Validation error:', JSON.stringify(result.error, null, 2));
    return true;
  } else {
    logError('SECURITY ISSUE: Invalid value in array was accepted!');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return false;
  }
}

async function test8_GetPreferences() {
  logTest(8, 'Retrieve partner preferences');

  const result = await makeRequest('GET', `/users/${USER_ID}/preferences`);

  if (result.success && result.data.data.partner_preferences) {
    logSuccess('Successfully retrieved partner preferences');
    console.log('employment_type_preference:', 
      JSON.stringify(result.data.data.partner_preferences.employment_type_preference, null, 2));
    return true;
  } else {
    logError('Failed to retrieve preferences');
    console.log('Error:', result.error);
    return false;
  }
}

async function test9_CombinedUpdate() {
  logTest(9, 'Update employment type with other preference fields');

  const payload = {
    min_age: 25,
    max_age: 35,
    employment_type_preference: ['Private Job', 'Self-Employed'],
    diet_preference: ['Vegetarian', 'Vegan']
  };

  const result = await makeRequest('PUT', `/users/${USER_ID}/preferences`, payload);

  if (result.success) {
    logSuccess('Combined update with multiple fields successful');
    console.log('employment_type_preference:', result.data.data.partner_preferences.employment_type_preference);
    console.log('min_age:', result.data.data.partner_preferences.min_age);
    console.log('max_age:', result.data.data.partner_preferences.max_age);
    return true;
  } else {
    logError('Combined update failed');
    console.log('Error:', result.error);
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.clear();
  log('\n╔═══════════════════════════════════════════════════════════╗', 'blue');
  log('║    EMPLOYMENT TYPE PREFERENCE VALIDATION TEST SUITE      ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════╝', 'blue');

  // Get credentials from command line arguments or prompt
  if (process.argv[2] && process.argv[3]) {
    AUTH_TOKEN = process.argv[2];
    USER_ID = process.argv[3];
  } else {
    // Prompt for credentials
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    AUTH_TOKEN = await new Promise(resolve => {
      rl.question('\nEnter your AUTH TOKEN: ', resolve);
    });

    USER_ID = await new Promise(resolve => {
      rl.question('Enter your USER ID: ', resolve);
    });

    rl.close();
  }

  if (!AUTH_TOKEN || !USER_ID) {
    logError('AUTH_TOKEN and USER_ID are required!');
    logWarning('Usage: node test-employment-type-preference.js [AUTH_TOKEN] [USER_ID]');
    process.exit(1);
  }

  log(`\nConfiguration:`, 'yellow');
  console.log(`  BASE_URL: ${BASE_URL}`);
  console.log(`  USER_ID: ${USER_ID}`);
  console.log(`  AUTH_TOKEN: ${AUTH_TOKEN.substring(0, 20)}...`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    test1_SingleEmploymentType,
    test2_MultipleEmploymentTypes,
    test3_AllValidEmploymentTypes,
    test4_InvalidEmploymentType,
    test5_InvalidTypo,
    test6_EmptyArray,
    test7_MixedValidInvalid,
    test8_GetPreferences,
    test9_CombinedUpdate
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', 'cyan');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  } else {
    log(`Failed: ${results.failed}`, 'green');
  }
  
  console.log('\n' + '='.repeat(60));
  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉', 'green');
  } else {
    logWarning('Some tests failed. Please review the errors above.');
  }
  console.log('='.repeat(60) + '\n');

  // Display valid values reference
  log('\n📋 VALID EMPLOYMENT TYPE VALUES:', 'blue');
  VALID_EMPLOYMENT_TYPES.forEach((type, index) => {
    console.log(`   ${index + 1}. ${type}`);
  });
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
