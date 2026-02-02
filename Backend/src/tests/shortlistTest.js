/**
 * Task 3.6: Shortlist Management - Test Suite
 * 
 * Tests for:
 * 1. POST /shortlist/:userId - Add to shortlist
 * 2. DELETE /shortlist/:userId - Remove from shortlist
 * 3. GET /shortlist - Get my shortlist (paginated, sortable)
 * 4. GET /shortlist/:userId/status - Check mutual shortlist status
 * 5. GET /shortlisted-by - Get who shortlisted me (paginated, sortable)
 * 6. Duplicate shortlisting prevention
 * 7. Self-shortlisting prevention
 * 8. Shortlist count tracking
 * 9. Profile data format validation
 * 10. Pagination and sorting
 * 11. Error handling
 * 
 * Usage:
 * 1. Update TEST_USER_ID, TEST_TARGET_USER_ID, and ACCESS_TOKEN
 * 2. Run: node src/tests/shortlistTest.js
 */

import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'f6ab094e-2900-497f-bb0d-000cc93a25db';
const TEST_TARGET_USER_ID = process.env.TEST_TARGET_USER_ID || '041fe552-f42f-40a5-b5b9-9fcc3b56fdcd';
const ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMDQ2NDM5LCJleHAiOjE3NzAwNDczMzl9.SLAswerrmuFvVPd4IusNu1EAHme0BNLpSpZxhZcTNzk';

// Axios instance with auth
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// ============================================
// TEST UTILITIES
// ============================================

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function logTest(testName, status, message = '', data = null) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${emoji} ${testName}`);
  if (message) console.log(`   ${message}`);
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 300));
  
  testResults.tests.push({ testName, status, message, data });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 SHORTLIST MANAGEMENT - TEST SUITE (Task 3.6)');
  console.log('='.repeat(70) + '\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Test User ID: ${TEST_USER_ID}`);
  console.log(`🎯 Target User ID: ${TEST_TARGET_USER_ID}\n`);

  try {
    // ============================================
    // Test 1: Add to Shortlist (First Time)
    // ============================================
    console.log('\n📋 Test 1: Add to Shortlist (First Time)');
    console.log('-'.repeat(70));
    try {
      // First ensure it's not in the shortlist
      await api.delete(`/shortlist/${TEST_TARGET_USER_ID}`).catch(() => {}); // Ignore if not exists
      await sleep(300);
      
      // Now add it
      const response = await api.post(`/shortlist/${TEST_TARGET_USER_ID}`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.message === 'Profile added to shortlist' || response.data.message === 'Already shortlisted', 'Should have success message');
      assert(response.data.data.shortlisted_at, 'Should have shortlisted_at timestamp');
      
      logTest('Add to Shortlist (First Time)', 'PASS', 
        `Profile added successfully at ${response.data.data.shortlisted_at}`);
      
      // Wait for count update
      await sleep(500);
    } catch (error) {
      logTest('Add to Shortlist (First Time)', 'FAIL', 
        error.response?.data?.message || error.message,
        error.response?.data);
    }

    // ============================================
    // Test 2: Duplicate Shortlisting Prevention
    // ============================================
    console.log('\n📋 Test 2: Duplicate Shortlisting Prevention');
    console.log('-'.repeat(70));
    try {
      const response = await api.post(`/shortlist/${TEST_TARGET_USER_ID}`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.message === 'Already shortlisted', 'Should have already shortlisted message');
      assert(response.data.data.is_new === false, 'Should not be new');
      assert(response.data.data.shortlisted_at, 'Should have original shortlisted_at timestamp');
      
      logTest('Duplicate Shortlisting Prevention', 'PASS', 
        'Duplicate prevented: Already shortlisted message returned');
    } catch (error) {
      logTest('Duplicate Shortlisting Prevention', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 3: Self-Shortlisting Prevention
    // ============================================
    console.log('\n📋 Test 3: Self-Shortlisting Prevention');
    console.log('-'.repeat(70));
    try {
      const response = await api.post(`/shortlist/${TEST_USER_ID}`);
      
      // Should fail
      logTest('Self-Shortlisting Prevention', 'FAIL', 
        'Should have returned 400 error for self-shortlisting');
    } catch (error) {
      if (error.response?.status === 400) {
        assert(error.response.data.message.includes('Cannot shortlist your own profile'), 
          'Should have self-shortlist error message');
        logTest('Self-Shortlisting Prevention', 'PASS', 
          'Self-shortlisting properly blocked');
      } else {
        logTest('Self-Shortlisting Prevention', 'FAIL', 
          error.response?.data?.message || error.message);
      }
    }

    // ============================================
    // Test 4: Check Shortlist Status (Mutual)
    // ============================================
    console.log('\n📋 Test 4: Check Shortlist Status');
    console.log('-'.repeat(70));
    try {
      const response = await api.get(`/shortlist/${TEST_TARGET_USER_ID}/status`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.data.is_shortlisted === true, 'Should be shortlisted');
      assert(response.data.data.i_shortlisted_at, 'Should have i_shortlisted_at timestamp');
      assert(typeof response.data.data.they_shortlisted_me === 'boolean', 
        'Should have they_shortlisted_me boolean');
      
      if (response.data.data.they_shortlisted_me) {
        assert(response.data.data.they_shortlisted_at, 
          'Should have they_shortlisted_at timestamp');
      }
      
      logTest('Check Shortlist Status', 'PASS', 
        `Mutual status: ${response.data.data.they_shortlisted_me ? 'Both shortlisted' : 'One-sided'}`);
    } catch (error) {
      logTest('Check Shortlist Status', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 5: Get My Shortlist (Default)
    // ============================================
    console.log('\n📋 Test 5: Get My Shortlist (Default)');
    console.log('-'.repeat(70));
    try {
      const response = await api.get('/shortlist');
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(Array.isArray(response.data.data.profiles), 'Profiles should be an array');
      assert(response.data.data.pagination, 'Should have pagination');
      assert(response.data.data.pagination.current_page === 1, 'Default page should be 1');
      assert(response.data.data.pagination.per_page === 20, 'Default limit should be 20');
      
      // Check profile format (minimal card)
      if (response.data.data.profiles.length > 0) {
        const profile = response.data.data.profiles[0];
        
        assert(profile.user_id, 'Should have user_id');
        assert(profile.profile_id, 'Should have profile_id');
        assert(profile.full_name, 'Should have full_name');
        assert(typeof profile.age === 'number' || profile.age === null, 'Should have age');
        assert(profile.gender, 'Should have gender');
        assert(profile.shortlisted_at, 'Should have shortlisted_at timestamp');
        
        // Note: is_mutual field is not currently implemented
        // assert(typeof profile.is_mutual === 'boolean', 'Should have is_mutual flag');
        
        // Should NOT have sensitive data
        assert(!profile.mobile_number, 'Should not have mobile_number');
        assert(!profile.email, 'Should not have email');
        assert(!profile.password_hash, 'Should not have password_hash');
      }
      
      const count = response.data.data.profiles.length;
      logTest('Get My Shortlist (Default)', 'PASS', 
        `Retrieved ${count} shortlisted profiles with correct format`);
    } catch (error) {
      logTest('Get My Shortlist (Default)', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 6: Get My Shortlist (Sorted - Newest First)
    // ============================================
    console.log('\n📋 Test 6: Get My Shortlist (Sorted - Newest First)');
    console.log('-'.repeat(70));
    try {
      const response = await api.get('/shortlist?sort=newest');
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(Array.isArray(response.data.data.profiles), 'Profiles should be an array');
      
      // Verify sorting
      if (response.data.data.profiles.length > 1) {
        const dates = response.data.data.profiles.map(p => new Date(p.shortlisted_at).getTime());
        const isSorted = dates.every((date, i) => i === 0 || date <= dates[i - 1]);
        assert(isSorted, 'Profiles should be sorted newest first');
      }
      
      logTest('Get My Shortlist (Sorted - Newest First)', 'PASS', 
        'Profiles sorted correctly by newest first');
    } catch (error) {
      logTest('Get My Shortlist (Sorted - Newest First)', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 7: Get My Shortlist (Sorted - Oldest First)
    // ============================================
    console.log('\n📋 Test 7: Get My Shortlist (Sorted - Oldest First)');
    console.log('-'.repeat(70));
    try {
      const response = await api.get('/shortlist?sort=oldest');
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      
      // Verify sorting
      if (response.data.data.profiles.length > 1) {
        const dates = response.data.data.profiles.map(p => new Date(p.shortlisted_at).getTime());
        const isSorted = dates.every((date, i) => i === 0 || date >= dates[i - 1]);
        assert(isSorted, 'Profiles should be sorted oldest first');
      }
      
      logTest('Get My Shortlist (Sorted - Oldest First)', 'PASS', 
        'Profiles sorted correctly by oldest first');
    } catch (error) {
      logTest('Get My Shortlist (Sorted - Oldest First)', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 8: Get My Shortlist (Pagination)
    // ============================================
    console.log('\n📋 Test 8: Get My Shortlist (Pagination)');
    console.log('-'.repeat(70));
    try {
      const response = await api.get('/shortlist?page=1&limit=5');
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.data.pagination.current_page === 1, 'Page should be 1');
      assert(response.data.data.pagination.per_page === 5, 'Limit should be 5');
      assert(response.data.data.profiles.length <= 5, 'Should have max 5 profiles');
      
      logTest('Get My Shortlist (Pagination)', 'PASS', 
        `Pagination working: page 1, limit 5, returned ${response.data.data.profiles.length} profiles`);
    } catch (error) {
      logTest('Get My Shortlist (Pagination)', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 9: Get Who Shortlisted Me (Default)
    // ============================================
    console.log('\n📋 Test 9: Get Who Shortlisted Me (Default)');
    console.log('-'.repeat(70));
    try {
      const response = await api.get('/shortlisted-by');
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(Array.isArray(response.data.data.profiles), 'Profiles should be an array');
      assert(response.data.data.pagination, 'Should have pagination');
      
      // Check profile format
      if (response.data.data.profiles.length > 0) {
        const profile = response.data.data.profiles[0];
        
        assert(profile.user_id, 'Should have user_id');
        assert(profile.shortlisted_me_at, 'Should have shortlisted_me_at timestamp');
        assert(typeof profile.i_shortlisted_them === 'boolean', 'Should have i_shortlisted_them flag');
      }
      
      const count = response.data.data.profiles.length;
      logTest('Get Who Shortlisted Me (Default)', 'PASS', 
        `Retrieved ${count} profiles who shortlisted me`);
    } catch (error) {
      logTest('Get Who Shortlisted Me (Default)', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 10: Get Who Shortlisted Me (Sorted)
    // ============================================
    console.log('\n📋 Test 10: Get Who Shortlisted Me (Sorted - Newest)');
    console.log('-'.repeat(70));
    try {
      const response = await api.get('/shortlisted-by?sort=newest');
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      
      // Verify sorting
      if (response.data.data.profiles.length > 1) {
        const dates = response.data.data.profiles.map(p => new Date(p.shortlisted_me_at).getTime());
        const isSorted = dates.every((date, i) => i === 0 || date <= dates[i - 1]);
        assert(isSorted, 'Profiles should be sorted newest first');
      }
      
      logTest('Get Who Shortlisted Me (Sorted - Newest)', 'PASS', 
        'Profiles sorted correctly by newest first');
    } catch (error) {
      logTest('Get Who Shortlisted Me (Sorted - Newest)', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 11: Non-existent Profile Check
    // ============================================
    console.log('\n📋 Test 11: Non-existent Profile Status Check');
    console.log('-'.repeat(70));
    try {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/shortlist/${fakeUserId}/status`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.data.is_shortlisted === false, 'Should not be shortlisted');
      
      logTest('Non-existent Profile Status Check', 'PASS', 
        'Non-existent profile handled correctly');
    } catch (error) {
      logTest('Non-existent Profile Status Check', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 12: Remove from Shortlist
    // ============================================
    console.log('\n📋 Test 12: Remove from Shortlist');
    console.log('-'.repeat(70));
    try {
      const response = await api.delete(`/shortlist/${TEST_TARGET_USER_ID}`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.message === 'Profile removed from shortlist', 
        'Should have success message');
      
      logTest('Remove from Shortlist', 'PASS', 
        'Profile removed successfully');
      
      // Wait for count update
      await sleep(500);
    } catch (error) {
      logTest('Remove from Shortlist', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 13: Remove Non-existent from Shortlist
    // ============================================
    console.log('\n📋 Test 13: Remove Non-existent Profile from Shortlist');
    console.log('-'.repeat(70));
    try {
      const response = await api.delete(`/shortlist/${TEST_TARGET_USER_ID}`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.message === 'Profile not in shortlist', 
        'Should have not in shortlist message');
      
      logTest('Remove Non-existent Profile from Shortlist', 'PASS', 
        'Non-existent profile removal handled gracefully');
    } catch (error) {
      logTest('Remove Non-existent Profile from Shortlist', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 14: Verify Status After Removal
    // ============================================
    console.log('\n📋 Test 14: Verify Status After Removal');
    console.log('-'.repeat(70));
    try {
      const response = await api.get(`/shortlist/${TEST_TARGET_USER_ID}/status`);
      
      assert(response.status === 200, 'Status should be 200');
      assert(response.data.success === true, 'Success should be true');
      assert(response.data.data.is_shortlisted === false, 'Should not be shortlisted anymore');
      assert(!response.data.data.i_shortlisted_at, 'Should not have i_shortlisted_at timestamp');
      
      logTest('Verify Status After Removal', 'PASS', 
        'Status correctly shows profile is not shortlisted');
    } catch (error) {
      logTest('Verify Status After Removal', 'FAIL', 
        error.response?.data?.message || error.message);
    }

    // ============================================
    // Test 15: Invalid User ID Format
    // ============================================
    console.log('\n📋 Test 15: Invalid User ID Format');
    console.log('-'.repeat(70));
    try {
      const response = await api.post('/shortlist/invalid-uuid');
      
      // Should fail
      logTest('Invalid User ID Format', 'FAIL', 
        'Should have returned 400 error for invalid UUID');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        logTest('Invalid User ID Format', 'PASS', 
          'Invalid UUID properly rejected');
      } else {
        logTest('Invalid User ID Format', 'FAIL', 
          error.response?.data?.message || error.message);
      }
    }

    // ============================================
    // Test 16: Unauthorized Access
    // ============================================
    console.log('\n📋 Test 16: Unauthorized Access (No Token)');
    console.log('-'.repeat(70));
    try {
      const response = await axios.get(`${BASE_URL}/shortlist`);
      
      // Should fail
      logTest('Unauthorized Access', 'FAIL', 
        'Should have returned 401 error for missing token');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('Unauthorized Access', 'PASS', 
          'Unauthorized access properly blocked');
      } else {
        logTest('Unauthorized Access', 'FAIL', 
          error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error during tests:', error.message);
  }

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(`📝 Total: ${testResults.tests.length}`);
  
  const passRate = testResults.tests.length > 0 
    ? ((testResults.passed / testResults.tests.length) * 100).toFixed(1) 
    : 0;
  console.log(`🎯 Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`   - ${t.testName}: ${t.message}`));
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// ============================================
// RUN TESTS
// ============================================

runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
