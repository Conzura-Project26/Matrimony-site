/**
 * Matchmaking API Test Suite
 * Phase 3 - Task 3.4: Matchmaking Algorithm
 * 
 * Tests all matchmaking endpoints:
 * 1. GET /profiles/recommended
 * 2. GET /profiles/daily-matches
 * 3. GET /profiles/new-matches
 * 4. GET /profiles/new-matches/count
 * 5. POST /matches/:matchId/view
 * 
 * Run with: node src/tests/test-matchmaking.js
 */

import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_CREDENTIALS = {
  identifier: '9380422508', // Replace with your test user (mobile or email)
  password: 'Nishanth@2005'
};

let authToken = '';
let userId = '';
let testMatchId = '';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const login = async () => {
  try {
    console.log('\n🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER_CREDENTIALS);
    
    if (response.data.success) {
      authToken = response.data.data.accessToken;
      userId = response.data.data.user.id;
      console.log(`✅ Login successful - User ID: ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const makeRequest = async (method, endpoint, data = null, params = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) config.data = data;
    if (params) config.params = params;
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

const printResponse = (testName, response) => {
  console.log(`\n📊 ${testName}`);
  console.log('─'.repeat(60));
  
  if (response.success) {
    console.log('✅ Status: SUCCESS');
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.log('❌ Status: FAILED');
    console.log('Error:', response.error);
    console.log('Status Code:', response.status);
  }
  
  console.log('─'.repeat(60));
};

// ============================================
// TEST CASES
// ============================================

/**
 * Test 1: Get Recommended Profiles
 */
const testGetRecommended = async () => {
  console.log('\n\n🧪 TEST 1: Get Recommended Profiles');
  console.log('═'.repeat(60));
  
  // Test 1.1: Default params
  console.log('\n📝 Test 1.1: Get recommendations with default params');
  let response = await makeRequest('GET', '/profiles/recommended');
  printResponse('Default Recommendations', response);
  
  if (response.success && response.data.data.matches.length > 0) {
    testMatchId = response.data.data.matches[0].match_id;
    console.log(`\n💾 Saved match_id for later tests: ${testMatchId}`);
  }
  
  // Test 1.2: With pagination
  console.log('\n📝 Test 1.2: Get recommendations with pagination (page=2, limit=5)');
  response = await makeRequest('GET', '/profiles/recommended', null, { page: 2, limit: 5 });
  printResponse('Paginated Recommendations', response);
  
  // Test 1.3: With min_score filter
  console.log('\n📝 Test 1.3: Get recommendations with min_score=70');
  response = await makeRequest('GET', '/profiles/recommended', null, { min_score: 70 });
  printResponse('High Score Recommendations (≥70%)', response);
  
  // Test 1.4: Force regenerate
  console.log('\n📝 Test 1.4: Force regenerate matches');
  response = await makeRequest('GET', '/profiles/recommended', null, { regenerate: true, limit: 10 });
  printResponse('Regenerated Recommendations', response);
  
  // Test 1.5: Invalid params
  console.log('\n📝 Test 1.5: Invalid pagination params (should fail)');
  response = await makeRequest('GET', '/profiles/recommended', null, { page: 0, limit: 100 });
  printResponse('Invalid Params Test', response);
};

/**
 * Test 2: Get Daily Matches
 */
const testGetDailyMatches = async () => {
  console.log('\n\n🧪 TEST 2: Get Daily Matches');
  console.log('═'.repeat(60));
  
  console.log('\n📝 Test 2.1: Get today\'s daily matches');
  const response = await makeRequest('GET', '/profiles/daily-matches');
  printResponse('Daily Matches', response);
  
  if (response.success) {
    const stats = response.data.data.stats;
    console.log('\n📈 Daily Match Statistics:');
    console.log(`   Total Matches: ${stats.total}`);
    console.log(`   New (Unviewed): ${stats.new}`);
    console.log(`   Already Viewed: ${stats.viewed}`);
    console.log(`   Refresh Time: ${stats.refresh_time}`);
  }
};

/**
 * Test 3: Get New Matches
 */
const testGetNewMatches = async () => {
  console.log('\n\n🧪 TEST 3: Get New Matches');
  console.log('═'.repeat(60));
  
  // Test 3.1: Default
  console.log('\n📝 Test 3.1: Get new matches (default)');
  let response = await makeRequest('GET', '/profiles/new-matches');
  printResponse('New Matches', response);
  
  // Test 3.2: With pagination
  console.log('\n📝 Test 3.2: Get new matches with pagination (page=1, limit=5)');
  response = await makeRequest('GET', '/profiles/new-matches', null, { page: 1, limit: 5 });
  printResponse('Paginated New Matches', response);
};

/**
 * Test 4: Get New Matches Count
 */
const testGetNewMatchesCount = async () => {
  console.log('\n\n🧪 TEST 4: Get New Matches Count');
  console.log('═'.repeat(60));
  
  console.log('\n📝 Test 4.1: Get unseen matches count');
  const response = await makeRequest('GET', '/profiles/new-matches/count');
  printResponse('New Matches Count', response);
  
  if (response.success) {
    const count = response.data.data.count;
    console.log(`\n🔔 Notification Badge: ${count} new matches`);
  }
};

/**
 * Test 5: Record Match View
 */
const testRecordMatchView = async () => {
  console.log('\n\n🧪 TEST 5: Record Match View');
  console.log('═'.repeat(60));
  
  if (!testMatchId) {
    console.log('⚠️  No match_id available. Skipping view test.');
    console.log('💡 Tip: Run testGetRecommended first to get a match_id');
    return;
  }
  
  // Test 5.1: Record valid view
  console.log(`\n📝 Test 5.1: Record view for match_id: ${testMatchId}`);
  let response = await makeRequest('POST', `/matches/${testMatchId}/view`);
  printResponse('Record Match View', response);
  
  // Test 5.2: Invalid match ID
  console.log('\n📝 Test 5.2: Record view with invalid match_id (should fail)');
  response = await makeRequest('POST', '/matches/invalid-uuid-123/view');
  printResponse('Invalid Match ID Test', response);
  
  // Test 5.3: Non-existent match ID
  console.log('\n📝 Test 5.3: Record view with non-existent match_id (should fail)');
  const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
  response = await makeRequest('POST', `/matches/${fakeUuid}/view`);
  printResponse('Non-existent Match Test', response);
};

/**
 * Test 6: Profile Completion Requirements
 */
const testProfileCompletionRequirements = async () => {
  console.log('\n\n🧪 TEST 6: Profile Completion Requirements');
  console.log('═'.repeat(60));
  
  console.log('\n📝 Test 6.1: Check if user meets minimum profile completion (50%)');
  console.log('Note: This test assumes your test user has sufficient profile completion.');
  console.log('If you get an error about insufficient completion, update your test user profile.');
  
  const response = await makeRequest('GET', '/profiles/recommended', null, { limit: 1 });
  
  if (response.success) {
    console.log('✅ User meets profile completion requirement');
  } else if (response.status === 400 && response.error.message?.includes('Profile completion')) {
    console.log('❌ User does NOT meet profile completion requirement');
    console.log('Required: ≥50% to view matches');
    console.log('Required: ≥70% to appear in others\' matches');
  }
  
  printResponse('Profile Completion Check', response);
};

/**
 * Test 7: Match Score and Data Validation
 */
const testMatchDataValidation = async () => {
  console.log('\n\n🧪 TEST 7: Match Data Validation');
  console.log('═'.repeat(60));
  
  console.log('\n📝 Test 7.1: Verify match response structure');
  const response = await makeRequest('GET', '/profiles/recommended', null, { limit: 3 });
  
  if (response.success && response.data.data.matches.length > 0) {
    const match = response.data.data.matches[0];
    
    console.log('\n✅ Validating match object structure:');
    console.log(`   ✓ match_id: ${match.match_id ? '✓' : '✗'}`);
    console.log(`   ✓ user_id: ${match.user_id ? '✓' : '✗'}`);
    console.log(`   ✓ profile_id: ${match.profile_id ? '✓' : '✗'}`);
    console.log(`   ✓ full_name: ${match.full_name ? '✓' : '✗'}`);
    console.log(`   ✓ age: ${match.age !== undefined ? '✓' : '✗'}`);
    console.log(`   ✓ match_score: ${match.match_score !== undefined ? '✓' : '✗'} (${match.match_score}%)`);
    console.log(`   ✓ is_viewed: ${match.is_viewed !== undefined ? '✓' : '✗'}`);
    
    console.log('\n🔒 Security Check - Contact Info Hidden:');
    console.log(`   ✓ mobile_number: ${match.mobile_number === undefined ? '✓ (Hidden)' : '✗ (EXPOSED!)'}`);
    console.log(`   ✓ email: ${match.email === undefined ? '✓ (Hidden)' : '✗ (EXPOSED!)'}`);
    
    if (match.mobile_number || match.email) {
      console.log('\n⚠️  SECURITY ISSUE: Contact information is exposed in match response!');
    } else {
      console.log('\n✅ Security verified: Contact information properly hidden');
    }
  } else {
    console.log('⚠️  No matches found to validate');
  }
};

/**
 * Test 8: Edge Cases and Error Handling
 */
const testEdgeCases = async () => {
  console.log('\n\n🧪 TEST 8: Edge Cases and Error Handling');
  console.log('═'.repeat(60));
  
  // Test 8.1: No auth token
  console.log('\n📝 Test 8.1: Request without auth token (should fail)');
  const tempToken = authToken;
  authToken = '';
  let response = await makeRequest('GET', '/profiles/recommended');
  printResponse('No Auth Token Test', response);
  authToken = tempToken;
  
  // Test 8.2: Invalid auth token
  console.log('\n📝 Test 8.2: Request with invalid auth token (should fail)');
  authToken = 'invalid-token-123';
  response = await makeRequest('GET', '/profiles/recommended');
  printResponse('Invalid Auth Token Test', response);
  authToken = tempToken;
  
  // Test 8.3: Extreme pagination
  console.log('\n📝 Test 8.3: Request with page=999 (should return empty)');
  response = await makeRequest('GET', '/profiles/recommended', null, { page: 999 });
  printResponse('Extreme Pagination Test', response);
  
  // Validate the response (check if response succeeded first)
  if (response.success && response.data?.pagination?.page == 999 && response.data?.matches?.length === 0) {
    console.log('✅ Correctly returned page=999 with empty matches');
  } else if (response.success) {
    console.log(`⚠️  Expected page=999 in response, got page=${response.data?.pagination?.page} (type: ${typeof response.data?.pagination?.page})`);
  }
};

// ============================================
// MAIN TEST RUNNER
// ============================================

const runAllTests = async () => {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║         🎯 MATCHMAKING API TEST SUITE - Task 3.4              ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    console.log('\n💡 Tips:');
    console.log('   1. Make sure the server is running (npm run dev)');
    console.log('   2. Update TEST_USER_CREDENTIALS with valid credentials');
    console.log('   3. Ensure test user has partner preferences set');
    return;
  }
  
  // Run all tests
  try {
    await testGetRecommended();
    await testGetDailyMatches();
    await testGetNewMatches();
    await testGetNewMatchesCount();
    await testRecordMatchView();
    await testProfileCompletionRequirements();
    await testMatchDataValidation();
    await testEdgeCases();
    
    // Summary
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║                  ✅ ALL TESTS COMPLETED                        ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    console.log('\n📝 Test Summary:');
    console.log('   ✓ GET /profiles/recommended');
    console.log('   ✓ GET /profiles/daily-matches');
    console.log('   ✓ GET /profiles/new-matches');
    console.log('   ✓ GET /profiles/new-matches/count');
    console.log('   ✓ POST /matches/:matchId/view');
    console.log('   ✓ Profile completion requirements');
    console.log('   ✓ Data validation & security');
    console.log('   ✓ Edge cases & error handling');
    
    console.log('\n📚 Next Steps:');
    console.log('   1. Review Swagger docs at http://localhost:3000/api-docs');
    console.log('   2. Run migration: node prisma/migrations/manual_add_matchmaking_tables.sql');
    console.log('   3. Test with multiple users for bidirectional scoring');
    console.log('   4. Set up cron job for daily match generation');
    
  } catch (error) {
    console.error('\n\n❌ Test suite encountered an error:', error.message);
    console.error(error.stack);
  }
};

// Run tests
runAllTests().catch(console.error);
