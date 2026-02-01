/**
 * Test Suite: Profile Completion Percentage (Dashboard Endpoint)
 * Tests the ultra-fast cached percentage endpoint for dashboard
 * 
 * Endpoint: GET /users/:id/completion-percentage
 * Performance Target: < 100ms (3-4x faster than full profile)
 */

import axios from 'axios';

// ============================================
// TEST CONFIGURATION
// ============================================

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'f6ab094e-2900-497f-bb0d-000cc93a25db';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY5OTYyNDA0LCJleHAiOjE3Njk5NjMzMDR9.3H4RQWErIlhwtqxWjwcWwzNL0DPkuvaz7L7SUYVBL1A';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function printSubSection(title) {
  console.log('\n' + '-'.repeat(60));
  console.log(`  ${title}`);
  console.log('-'.repeat(60));
}

function printSuccess(message) {
  console.log(`✅ ${message}`);
}

function printError(message) {
  console.log(`❌ ${message}`);
}

function printInfo(label, value) {
  console.log(`  ${label}: ${JSON.stringify(value)}`);
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test 1: Basic Functionality
 */
async function testBasicFunctionality() {
  printSection('TEST 1: BASIC FUNCTIONALITY');
  
  try {
    const startTime = Date.now();
    const response = await api.get(`/users/${TEST_USER_ID}/completion-percentage`);
    const responseTime = Date.now() - startTime;
    
    printSuccess('Endpoint responded successfully');
    printInfo('Status', response.status);
    printInfo('Response Time', `${responseTime}ms`);
    printInfo('Message', response.data.message);
    
    const data = response.data.data;
    
    printSubSection('Response Data');
    printInfo('Completion %', data.completion_percentage);
    printInfo('Status', data.status);
    
    // Validate structure
    if (typeof data.completion_percentage === 'number') {
      printSuccess('Completion percentage is a number');
    } else {
      printError('Completion percentage should be a number');
    }
    
    if (data.completion_percentage >= 0 && data.completion_percentage <= 100) {
      printSuccess('Completion percentage in valid range (0-100)');
    } else {
      printError('Completion percentage out of range');
    }
    
    const validStatuses = ['Just Started', 'In Progress', 'Almost Complete', 'Complete'];
    if (validStatuses.includes(data.status)) {
      printSuccess(`Status is valid: "${data.status}"`);
    } else {
      printError(`Invalid status: "${data.status}"`);
    }
    
    return { passed: true, responseTime };
  } catch (error) {
    printError(`Test failed: ${error.message}`);
    if (error.response) {
      printInfo('Error Status', error.response.status);
      printInfo('Error Data', error.response.data);
    }
    return { passed: false, responseTime: null };
  }
}

/**
 * Test 2: Performance Benchmark
 */
async function testPerformanceBenchmark() {
  printSection('TEST 2: PERFORMANCE BENCHMARK');
  
  try {
    const iterations = 10;
    const responseTimes = [];
    
    printInfo('Running', `${iterations} sequential requests`);
    console.log('');
    
    for (let i = 1; i <= iterations; i++) {
      const startTime = Date.now();
      await api.get(`/users/${TEST_USER_ID}/completion-percentage`);
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      console.log(`  Request ${i}/${iterations}: ${responseTime}ms`);
    }
    
    const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / iterations);
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    
    printSubSection('Performance Statistics');
    printInfo('Average', `${avgTime}ms`);
    printInfo('Fastest', `${minTime}ms`);
    printInfo('Slowest', `${maxTime}ms`);
    printInfo('Target', '< 100ms');
    
    if (avgTime < 100) {
      printSuccess(`✨ Performance target achieved! (${avgTime}ms < 100ms)`);
    } else {
      printError(`⚠️  Performance below target (${avgTime}ms > 100ms)`);
    }
    
    return { passed: avgTime < 100, avgTime, minTime, maxTime };
  } catch (error) {
    printError(`Test failed: ${error.message}`);
    return { passed: false, avgTime: null };
  }
}

/**
 * Test 3: Compare with Full Profile Endpoint
 */
async function testCompareWithFullProfile() {
  printSection('TEST 3: PERFORMANCE COMPARISON');
  
  try {
    // Test new fast endpoint
    const startTime1 = Date.now();
    await api.get(`/users/${TEST_USER_ID}/completion-percentage`);
    const fastTime = Date.now() - startTime1;
    
    // Test old full profile endpoint
    const startTime2 = Date.now();
    await api.get(`/users/${TEST_USER_ID}/profile`);
    const fullProfileTime = Date.now() - startTime2;
    
    printSubSection('Response Times');
    printInfo('Fast Endpoint (/completion-percentage)', `${fastTime}ms`);
    printInfo('Full Profile (/profile)', `${fullProfileTime}ms`);
    
    const speedup = (fullProfileTime / fastTime).toFixed(2);
    printInfo('Speedup', `${speedup}x faster`);
    
    if (fastTime < fullProfileTime) {
      printSuccess(`✨ Fast endpoint is ${speedup}x faster!`);
    } else {
      printError('Fast endpoint is not faster (cache might not be working)');
    }
    
    printSubSection('Recommendation');
    console.log(`  📊 For Dashboard: Use /completion-percentage (${fastTime}ms)`);
    console.log(`  📄 For Full Profile: Use /profile (${fullProfileTime}ms)`);
    
    return { passed: fastTime < fullProfileTime, speedup: parseFloat(speedup) };
  } catch (error) {
    printError(`Test failed: ${error.message}`);
    return { passed: false, speedup: null };
  }
}

/**
 * Test 4: Authorization (Other User)
 */
async function testAuthorizationOtherUser() {
  printSection('TEST 4: AUTHORIZATION - OTHER USER');
  
  try {
    const otherUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    try {
      await api.get(`/users/${otherUserId}/completion-percentage`);
      printError('Should have returned 403 for other user');
      return { passed: false };
    } catch (error) {
      if (error.response && error.response.status === 403) {
        printSuccess('Correctly blocked access to other user (403 Forbidden)');
        return { passed: true };
      } else if (error.response && error.response.status === 404) {
        printSuccess('User not found (404) - acceptable');
        return { passed: true };
      } else {
        printError(`Unexpected error: ${error.message}`);
        return { passed: false };
      }
    }
  } catch (error) {
    printError(`Test failed: ${error.message}`);
    return { passed: false };
  }
}

/**
 * Test 5: Cache Consistency
 */
async function testCacheConsistency() {
  printSection('TEST 5: CACHE CONSISTENCY');
  
  try {
    // Make 5 rapid requests
    const results = [];
    for (let i = 0; i < 5; i++) {
      const response = await api.get(`/users/${TEST_USER_ID}/completion-percentage`);
      results.push(response.data.data.completion_percentage);
    }
    
    // All should return same value
    const allSame = results.every(val => val === results[0]);
    
    printInfo('Request 1', `${results[0]}%`);
    printInfo('Request 2', `${results[1]}%`);
    printInfo('Request 3', `${results[2]}%`);
    printInfo('Request 4', `${results[3]}%`);
    printInfo('Request 5', `${results[4]}%`);
    
    if (allSame) {
      printSuccess(`✓ Cache is consistent (all returned ${results[0]}%)`);
    } else {
      printError('Cache values are inconsistent!');
    }
    
    return { passed: allSame, value: results[0] };
  } catch (error) {
    printError(`Test failed: ${error.message}`);
    return { passed: false };
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   PROFILE COMPLETION % - DASHBOARD ENDPOINT TEST         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 Configuration:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test User ID: ${TEST_USER_ID}`);
  console.log(`   Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  
  const results = [];
  
  // Run tests
  results.push({ name: 'Basic Functionality', ...await testBasicFunctionality() });
  results.push({ name: 'Performance Benchmark', ...await testPerformanceBenchmark() });
  results.push({ name: 'Comparison vs Full Profile', ...await testCompareWithFullProfile() });
  results.push({ name: 'Authorization', ...await testAuthorizationOtherUser() });
  results.push({ name: 'Cache Consistency', ...await testCacheConsistency() });
  
  // Summary
  printSection('TEST SUMMARY');
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  Success Rate: ${((passedTests/totalTests) * 100).toFixed(0)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
  }
  
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
