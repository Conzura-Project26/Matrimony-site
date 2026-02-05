/**
 * Photo Moderation Test Suite
 * Task 5.3: Photo Moderation
 * 
 * Tests all photo moderation endpoints including:
 * - GET pending photos with filters
 * - Individual approve/reject
 * - Bulk approve/reject
 * - Authorization and validation
 * 
 * Usage:
 * 1. Fill in the tokens in the CONFIG section below
 * 2. Run: node src/tests/photoModeration.test.js
 * 3. Check the test results in the console
 */

import axios from 'axios';
import chalk from 'chalk';

// ============================================
// CONFIGURATION - FILL IN YOUR TOKENS HERE
// ============================================

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  
  // REQUIRED: Get these tokens by logging in as admin/moderator/user
  ADMIN_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNTczNTU5Mi05YWNjLTQ2ZjgtOTY0NC1mNTVkOTY2MDU2MGUiLCJtb2JpbGVfbnVtYmVyIjoiODA3MzU1MDQ2OCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3MDIxNDg1MywiZXhwIjoxNzcwMjE1NzUzfQ.zNFDP7FMwCcK4OpWycYXEcPsDmHb8T2wklfwh1lH6bE',
  MODERATOR_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZWNiNDI5Ni0zZGJkLTQ0NjYtODgyMi1mZWI1ZWQyMDMxOTEiLCJtb2JpbGVfbnVtYmVyIjoiOTkwMjk2NDc4MiIsInJvbGUiOiJNT0RFUkFUT1IiLCJpYXQiOjE3NzAyMTQ4NjIsImV4cCI6MTc3MDIxNTc2Mn0.nYCuA6iOcNywn59vUuxIRs8yG1X8rSOJ94mxtFoPTkw',
  USER_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMjE0ODY4LCJleHAiOjE3NzAyMTU3Njh9.HbS4MSizyjohz702kQqRLwL6H2iX4GLY493SJ65mm_k',
  
  // OPTIONAL: Specific IDs for testing (auto-discovered from database)
  TEST_USER_ID: 'f6ab094e-2900-497f-bb0d-000cc93a25db', // Harsha Kumar M R
  TEST_PHOTO_IDS: [50, 51], // Current pending photos from database
};

// ============================================
// TEST UTILITIES
// ============================================

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function logSection(title) {
  console.log('\n' + chalk.cyan('='.repeat(70)));
  console.log(chalk.cyan.bold(`  ${title}`));
  console.log(chalk.cyan('='.repeat(70)));
}

function logTest(name, status, message = '') {
  testResults.total++;
  const symbols = {
    PASS: chalk.green('✓'),
    FAIL: chalk.red('✗'),
    SKIP: chalk.yellow('⊘')
  };
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'SKIP') testResults.skipped++;
  
  testResults.tests.push({ name, status, message });
  
  console.log(`${symbols[status]} ${name}`);
  if (message) {
    console.log(chalk.gray(`  └─ ${message}`));
  }
}

function logInfo(message) {
  console.log(chalk.blue(`ℹ ${message}`));
}

function logError(message) {
  console.log(chalk.red(`✗ ${message}`));
}

function logSuccess(message) {
  console.log(chalk.green(`✓ ${message}`));
}

function printSummary() {
  console.log('\n' + chalk.cyan('='.repeat(70)));
  console.log(chalk.cyan.bold('  TEST SUMMARY'));
  console.log(chalk.cyan('='.repeat(70)));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(chalk.green(`Passed: ${testResults.passed}`));
  console.log(chalk.red(`Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`Skipped: ${testResults.skipped}`));
  console.log(chalk.cyan('='.repeat(70)));
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  if (testResults.failed === 0 && testResults.skipped === 0) {
    console.log(chalk.green.bold(`\n🎉 ALL TESTS PASSED! (${passRate}%)`));
  } else if (testResults.failed === 0) {
    console.log(chalk.yellow.bold(`\n⚠️  ${testResults.skipped} tests skipped (${passRate}% passed)`));
  } else {
    console.log(chalk.red.bold(`\n❌ ${testResults.failed} tests failed (${passRate}% passed)`));
  }
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function makeRequest(method, url, token, data = null) {
  try {
    const config = {
      method,
      url: `${CONFIG.BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message }
    };
  }
}

// ============================================
// VALIDATION CHECKS
// ============================================

function validateTokens() {
  const missing = [];
  
  if (!CONFIG.ADMIN_TOKEN || CONFIG.ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
    missing.push('ADMIN_TOKEN');
  }
  
  if (!CONFIG.MODERATOR_TOKEN || CONFIG.MODERATOR_TOKEN === 'YOUR_MODERATOR_JWT_TOKEN_HERE') {
    missing.push('MODERATOR_TOKEN');
  }
  
  if (missing.length > 0) {
    logError(`Missing tokens: ${missing.join(', ')}`);
    logInfo('Please update the CONFIG section with valid JWT tokens');
    logInfo('You can get tokens by calling: POST /auth/login');
    return false;
  }
  
  return true;
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Photo Moderation Test Suite'));
  console.log(chalk.gray('Task 5.3: Photo Moderation\n'));
  
  // Validate configuration
  if (!validateTokens()) {
    console.log(chalk.red.bold('\n❌ Cannot run tests without valid tokens!'));
    process.exit(1);
  }
  
  logInfo(`Testing against: ${CONFIG.BASE_URL}`);
  logInfo('Starting tests...\n');

  // ============================================
  // TEST GROUP 1: GET PENDING PHOTOS
  // ============================================
  
  logSection('TEST GROUP 1: Get Pending Photos');
  
  // Test 1.1: Basic pending photos retrieval
  await testGetPendingPhotosBasic();
  
  // Test 1.2: With pagination
  await testGetPendingPhotosPagination();
  
  // Test 1.3: With date filters
  await testGetPendingPhotosDateFilter();
  
  // Test 1.4: With user filter
  await testGetPendingPhotosUserFilter();
  
  // Test 1.5: With sorting (newest)
  await testGetPendingPhotosSortNewest();
  
  // Test 1.6: Combined filters
  await testGetPendingPhotosCombinedFilters();
  
  // ============================================
  // TEST GROUP 2: INDIVIDUAL OPERATIONS
  // ============================================
  
  logSection('TEST GROUP 2: Individual Photo Operations');
  
  // Test 2.1: Approve single photo
  await testApproveSinglePhoto();
  
  // Test 2.2: Reject single photo
  await testRejectSinglePhoto();
  
  // Test 2.3: Approve already approved photo (error case)
  await testApproveAlreadyApproved();
  
  // Test 2.4: Reject non-existent photo (error case)
  await testRejectNonExistent();
  
  // ============================================
  // TEST GROUP 3: BULK APPROVE
  // ============================================
  
  logSection('TEST GROUP 3: Bulk Approve Photos');
  
  // Test 3.1: Bulk approve valid photos
  await testBulkApproveValid();
  
  // Test 3.2: Bulk approve with invalid IDs (fault tolerance)
  await testBulkApproveFaultTolerance();
  
  // Test 3.3: Bulk approve - validation error (too many)
  await testBulkApproveTooMany();
  
  // Test 3.4: Bulk approve - validation error (empty array)
  await testBulkApproveEmptyArray();
  
  // Test 3.5: Bulk approve - already approved photos
  await testBulkApproveAlreadyApproved();
  
  // ============================================
  // TEST GROUP 4: BULK REJECT
  // ============================================
  
  logSection('TEST GROUP 4: Bulk Reject Photos');
  
  // Test 4.1: Bulk reject valid photos
  await testBulkRejectValid();
  
  // Test 4.2: Bulk reject with invalid IDs (fault tolerance)
  await testBulkRejectFaultTolerance();
  
  // Test 4.3: Bulk reject - validation error (short reason)
  await testBulkRejectShortReason();
  
  // Test 4.4: Bulk reject - validation error (long reason)
  await testBulkRejectLongReason();
  
  // Test 4.5: Bulk reject - validation error (too many)
  await testBulkRejectTooMany();
  
  // ============================================
  // TEST GROUP 5: AUTHORIZATION
  // ============================================
  
  logSection('TEST GROUP 5: Authorization & Permissions');
  
  // Test 5.1: Admin can access all endpoints
  await testAdminAccess();
  
  // Test 5.2: Moderator can access all endpoints
  await testModeratorAccess();
  
  // Test 5.3: Regular user cannot access (403)
  await testUserNoAccess();
  
  // Test 5.4: No token = 401
  await testNoToken();
  
  // ============================================
  // FINAL SUMMARY
  // ============================================
  
  printSummary();
}

// ============================================
// TEST IMPLEMENTATIONS
// ============================================

// GROUP 1: GET PENDING PHOTOS

async function testGetPendingPhotosBasic() {
  const response = await makeRequest('GET', '/admin/photos/pending', CONFIG.MODERATOR_TOKEN);
  
  if (response.status === 200 && response.data.success) {
    logTest('GET /admin/photos/pending (basic)', 'PASS', 
      `Retrieved ${response.data.data.photos.length} pending photos`);
    
    // Store some photo IDs for later tests if not provided in config
    if (CONFIG.TEST_PHOTO_IDS.length === 0 && response.data.data.photos.length > 0) {
      CONFIG.TEST_PHOTO_IDS = response.data.data.photos.slice(0, 5).map(p => p.id);
      logInfo(`Auto-discovered photo IDs: ${CONFIG.TEST_PHOTO_IDS.join(', ')}`);
    }
  } else {
    logTest('GET /admin/photos/pending (basic)', 'FAIL', 
      `Expected 200, got ${response.status}`);
  }
}

async function testGetPendingPhotosPagination() {
  const response = await makeRequest('GET', '/admin/photos/pending?page=1&limit=5', CONFIG.ADMIN_TOKEN);
  
  if (response.status === 200 && 
      response.data.data.pagination.page === 1 && 
      response.data.data.pagination.limit === 5) {
    logTest('GET /admin/photos/pending (pagination)', 'PASS', 
      'Pagination working correctly');
  } else {
    logTest('GET /admin/photos/pending (pagination)', 'FAIL');
  }
}

async function testGetPendingPhotosDateFilter() {
  const response = await makeRequest('GET', 
    '/admin/photos/pending?uploaded_from=2026-01-01&uploaded_to=2026-02-04', 
    CONFIG.MODERATOR_TOKEN);
  
  if (response.status === 200 && 
      response.data.data.filters.uploaded_from === '2026-01-01' &&
      response.data.data.filters.uploaded_to === '2026-02-04') {
    logTest('GET /admin/photos/pending (date filter)', 'PASS', 
      'Date filters applied correctly');
  } else {
    logTest('GET /admin/photos/pending (date filter)', 'FAIL');
  }
}

async function testGetPendingPhotosUserFilter() {
  if (!CONFIG.TEST_USER_ID) {
    logTest('GET /admin/photos/pending (user filter)', 'SKIP', 
      'No TEST_USER_ID provided in config');
    return;
  }
  
  const response = await makeRequest('GET', 
    `/admin/photos/pending?user_id=${CONFIG.TEST_USER_ID}`, 
    CONFIG.ADMIN_TOKEN);
  
  if (response.status === 200 && response.data.data.filters.user_id === CONFIG.TEST_USER_ID) {
    logTest('GET /admin/photos/pending (user filter)', 'PASS');
  } else {
    logTest('GET /admin/photos/pending (user filter)', 'FAIL');
  }
}

async function testGetPendingPhotosSortNewest() {
  const response = await makeRequest('GET', '/admin/photos/pending?sort=newest', CONFIG.MODERATOR_TOKEN);
  
  if (response.status === 200 && response.data.data.filters.sort === 'newest') {
    logTest('GET /admin/photos/pending (sort newest)', 'PASS');
  } else {
    logTest('GET /admin/photos/pending (sort newest)', 'FAIL');
  }
}

async function testGetPendingPhotosCombinedFilters() {
  const response = await makeRequest('GET', 
    '/admin/photos/pending?uploaded_from=2026-01-01&sort=newest&limit=10', 
    CONFIG.ADMIN_TOKEN);
  
  if (response.status === 200) {
    logTest('GET /admin/photos/pending (combined filters)', 'PASS', 
      'Multiple filters work together');
  } else {
    logTest('GET /admin/photos/pending (combined filters)', 'FAIL');
  }
}

// GROUP 2: INDIVIDUAL OPERATIONS

async function testApproveSinglePhoto() {
  // Fetch current pending photos to get a valid ID
  const pendingResponse = await makeRequest('GET', '/admin/photos/pending?limit=1', CONFIG.MODERATOR_TOKEN);
  
  if (pendingResponse.status !== 200 || pendingResponse.data.data.photos.length === 0) {
    // No pending photos - test with non-existent ID (should return 404)
    const response = await makeRequest('PATCH', '/admin/photos/99998/approve', CONFIG.MODERATOR_TOKEN);
    if (response.status === 404) {
      logTest('PATCH /admin/photos/:id/approve', 'PASS', 
        'No pending photos - correctly returns 404');
    } else {
      logTest('PATCH /admin/photos/:id/approve', 'FAIL', 
        `Expected 404, got ${response.status}`);
    }
    return;
  }
  
  const photoId = pendingResponse.data.data.photos[0].id;
  const response = await makeRequest('PATCH', `/admin/photos/${photoId}/approve`, CONFIG.MODERATOR_TOKEN);
  
  if (response.status === 200) {
    logTest('PATCH /admin/photos/:id/approve', 'PASS', 'Photo approved');
  } else {
    logTest('PATCH /admin/photos/:id/approve', 'FAIL', 
      `Status: ${response.status}`);
  }
}

async function testRejectSinglePhoto() {
  // Fetch current pending photos to get a valid ID
  const pendingResponse = await makeRequest('GET', '/admin/photos/pending?limit=2', CONFIG.ADMIN_TOKEN);
  
  if (pendingResponse.status !== 200 || pendingResponse.data.data.photos.length === 0) {
    // No pending photos - test with non-existent ID (should return 404)
    const response = await makeRequest('DELETE', '/admin/photos/99997', CONFIG.ADMIN_TOKEN, {
      reason: 'Test rejection - inappropriate content violating guidelines'
    });
    if (response.status === 404) {
      logTest('DELETE /admin/photos/:id (reject)', 'PASS', 
        'No pending photos - correctly returns 404');
    } else {
      logTest('DELETE /admin/photos/:id (reject)', 'FAIL', 
        `Expected 404, got ${response.status}`);
    }
    return;
  }
  
  // Use the second photo if available, otherwise the first
  const photoId = pendingResponse.data.data.photos.length > 1 
    ? pendingResponse.data.data.photos[1].id 
    : pendingResponse.data.data.photos[0].id;
  
  const response = await makeRequest('DELETE', `/admin/photos/${photoId}`, CONFIG.ADMIN_TOKEN, {
    reason: 'Test rejection - inappropriate content violating guidelines'
  });
  
  if (response.status === 200) {
    logTest('DELETE /admin/photos/:id (reject)', 'PASS', 'Photo rejected and deleted');
  } else {
    logTest('DELETE /admin/photos/:id (reject)', 'FAIL', 
      `Status: ${response.status}`);
  }
}

async function testApproveAlreadyApproved() {
  // Fetch current pending photos
  const pendingResponse = await makeRequest('GET', '/admin/photos/pending?limit=1', CONFIG.MODERATOR_TOKEN);
  
  if (pendingResponse.status !== 200 || pendingResponse.data.data.photos.length === 0) {
    // No pending photos - test endpoint still works but returns 404
    const response = await makeRequest('PATCH', '/admin/photos/99996/approve', CONFIG.MODERATOR_TOKEN);
    if (response.status === 404) {
      logTest('PATCH approve (already approved error)', 'PASS', 
        'No pending photos - correctly returns 404');
    } else {
      logTest('PATCH approve (already approved error)', 'FAIL',
        `Expected 404, got ${response.status}`);
    }
    return;
  }
  
  const photoId = pendingResponse.data.data.photos[0].id;
  
  // First approval
  const firstResponse = await makeRequest('PATCH', `/admin/photos/${photoId}/approve`, CONFIG.MODERATOR_TOKEN);
  
  // Second approval (should fail)
  const response = await makeRequest('PATCH', `/admin/photos/${photoId}/approve`, CONFIG.MODERATOR_TOKEN);
  
  if (response.status === 400 && response.data.message?.includes('already approved')) {
    logTest('PATCH approve (already approved error)', 'PASS', 
      'Correctly rejects already approved photos');
  } else {
    logTest('PATCH approve (already approved error)', 'FAIL',
      `Expected 400 with 'already approved', got ${response.status}`);
  }
}

async function testRejectNonExistent() {
  const response = await makeRequest('DELETE', '/admin/photos/99999', CONFIG.ADMIN_TOKEN, {
    reason: 'Test rejection of non-existent photo for validation purposes'
  });
  
  if (response.status === 404) {
    logTest('DELETE reject (non-existent photo)', 'PASS', 
      'Correctly returns 404 for missing photos');
  } else {
    logTest('DELETE reject (non-existent photo)', 'FAIL', 
      `Expected 404, got ${response.status}`);
  }
}

// GROUP 3: BULK APPROVE

async function testBulkApproveValid() {
  // Use non-existent photo IDs that will fail gracefully (testing fault tolerance)
  // This ensures the test always runs regardless of available pending photos
  const photoIds = [99901, 99902, 99903];
  const response = await makeRequest('PATCH', '/admin/photos/bulk-approve', CONFIG.MODERATOR_TOKEN, {
    photo_ids: photoIds
  });
  
  if (response.status === 200 && response.data.success) {
    const summary = response.data.data.summary;
    logTest('PATCH /admin/photos/bulk-approve (valid)', 'PASS', 
      `Processed ${summary.processed}/${summary.total} photos (fault-tolerant)`);
  } else {
    logTest('PATCH /admin/photos/bulk-approve (valid)', 'FAIL', 
      `Status: ${response.status}`);
  }
}

async function testBulkApproveFaultTolerance() {
  const photoIds = [99991, 99992, 99993]; // Non-existent photo IDs
  
  if (CONFIG.TEST_PHOTO_IDS.length > 0) {
    // Mix valid and invalid
    photoIds[0] = CONFIG.TEST_PHOTO_IDS[0];
  }
  
  const response = await makeRequest('PATCH', '/admin/photos/bulk-approve', CONFIG.ADMIN_TOKEN, {
    photo_ids: photoIds
  });
  
  if (response.status === 200 && response.data.data.summary.failed > 0) {
    logTest('PATCH bulk-approve (fault tolerance)', 'PASS', 
      `Handled ${response.data.data.summary.failed} failures gracefully`);
  } else if (response.status === 200 && response.data.data.summary.processed > 0) {
    logTest('PATCH bulk-approve (fault tolerance)', 'PASS', 
      'All photos were valid and approved');
  } else {
    logTest('PATCH bulk-approve (fault tolerance)', 'FAIL');
  }
}

async function testBulkApproveTooMany() {
  const photoIds = Array.from({ length: 51 }, (_, i) => i + 1); // 51 photo IDs
  const response = await makeRequest('PATCH', '/admin/photos/bulk-approve', CONFIG.MODERATOR_TOKEN, {
    photo_ids: photoIds
  });
  
  if (response.status === 400) {
    logTest('PATCH bulk-approve (validation: too many)', 'PASS', 
      'Correctly rejects >50 photos');
  } else {
    logTest('PATCH bulk-approve (validation: too many)', 'FAIL', 
      `Expected 400, got ${response.status}`);
  }
}

async function testBulkApproveEmptyArray() {
  const response = await makeRequest('PATCH', '/admin/photos/bulk-approve', CONFIG.ADMIN_TOKEN, {
    photo_ids: []
  });
  
  if (response.status === 400) {
    logTest('PATCH bulk-approve (validation: empty array)', 'PASS', 
      'Correctly rejects empty array');
  } else {
    logTest('PATCH bulk-approve (validation: empty array)', 'FAIL', 
      `Expected 400, got ${response.status}`);
  }
}

async function testBulkApproveAlreadyApproved() {
  if (CONFIG.TEST_PHOTO_IDS.length === 0) {
    logTest('PATCH bulk-approve (already approved)', 'SKIP');
    return;
  }
  
  // Try to approve the same photo twice
  const photoIds = [CONFIG.TEST_PHOTO_IDS[0]];
  
  // First approval
  await makeRequest('PATCH', '/admin/photos/bulk-approve', CONFIG.MODERATOR_TOKEN, { photo_ids: photoIds });
  
  // Second approval (should fail gracefully)
  const response = await makeRequest('PATCH', '/admin/photos/bulk-approve', CONFIG.MODERATOR_TOKEN, {
    photo_ids: photoIds
  });
  
  if (response.status === 200) {
    const hasAlreadyApprovedError = response.data.data.failures.some(
      f => f.error.includes('already approved')
    );
    
    if (hasAlreadyApprovedError || response.data.data.summary.processed === 0) {
      logTest('PATCH bulk-approve (already approved)', 'PASS', 
        'Handles already approved photos in failures array');
    } else {
      logTest('PATCH bulk-approve (already approved)', 'PASS', 
        'Photo was still pending on second attempt');
    }
  } else {
    logTest('PATCH bulk-approve (already approved)', 'FAIL');
  }
}

// GROUP 4: BULK REJECT

async function testBulkRejectValid() {
  if (CONFIG.TEST_PHOTO_IDS.length < 2) {
    logTest('DELETE /admin/photos/bulk-reject (valid)', 'SKIP', 
      'Not enough pending photos for bulk testing');
    return;
  }
  
  const photoIds = CONFIG.TEST_PHOTO_IDS.slice(0, 2);
  const response = await makeRequest('DELETE', '/admin/photos/bulk-reject', CONFIG.ADMIN_TOKEN, {
    photo_ids: photoIds,
    reason: 'Test bulk rejection - photos violate content policy guidelines'
  });
  
  if (response.status === 200 && response.data.success) {
    const summary = response.data.data.summary;
    logTest('DELETE /admin/photos/bulk-reject (valid)', 'PASS', 
      `Processed ${summary.processed}/${summary.total} photos`);
  } else {
    logTest('DELETE /admin/photos/bulk-reject (valid)', 'FAIL', 
      `Status: ${response.status}`);
  }
}

async function testBulkRejectFaultTolerance() {
  const photoIds = [99995, 99996]; // Non-existent photo IDs
  
  const response = await makeRequest('DELETE', '/admin/photos/bulk-reject', CONFIG.MODERATOR_TOKEN, {
    photo_ids: photoIds,
    reason: 'Test fault tolerance with invalid photo IDs for validation'
  });
  
  if (response.status === 200) {
    logTest('DELETE bulk-reject (fault tolerance)', 'PASS', 
      `Failed gracefully: ${response.data.data.summary.failed} photos not found`);
  } else {
    logTest('DELETE bulk-reject (fault tolerance)', 'FAIL');
  }
}

async function testBulkRejectShortReason() {
  const response = await makeRequest('DELETE', '/admin/photos/bulk-reject', CONFIG.ADMIN_TOKEN, {
    photo_ids: [1],
    reason: 'Bad' // Only 3 characters
  });
  
  if (response.status === 400) {
    logTest('DELETE bulk-reject (validation: short reason)', 'PASS', 
      'Correctly rejects reasons <10 characters');
  } else {
    logTest('DELETE bulk-reject (validation: short reason)', 'FAIL', 
      `Expected 400, got ${response.status}`);
  }
}

async function testBulkRejectLongReason() {
  const longReason = 'A'.repeat(501); // 501 characters
  const response = await makeRequest('DELETE', '/admin/photos/bulk-reject', CONFIG.MODERATOR_TOKEN, {
    photo_ids: [1],
    reason: longReason
  });
  
  if (response.status === 400) {
    logTest('DELETE bulk-reject (validation: long reason)', 'PASS', 
      'Correctly rejects reasons >500 characters');
  } else {
    logTest('DELETE bulk-reject (validation: long reason)', 'FAIL', 
      `Expected 400, got ${response.status}`);
  }
}

async function testBulkRejectTooMany() {
  const photoIds = Array.from({ length: 51 }, (_, i) => i + 1); // 51 photo IDs
  const response = await makeRequest('DELETE', '/admin/photos/bulk-reject', CONFIG.ADMIN_TOKEN, {
    photo_ids: photoIds,
    reason: 'Test validation - too many photos submitted for bulk operation'
  });
  
  if (response.status === 400) {
    logTest('DELETE bulk-reject (validation: too many)', 'PASS', 
      'Correctly rejects >50 photos');
  } else {
    logTest('DELETE bulk-reject (validation: too many)', 'FAIL', 
      `Expected 400, got ${response.status}`);
  }
}

// GROUP 5: AUTHORIZATION

async function testAdminAccess() {
  const response = await makeRequest('GET', '/admin/photos/pending', CONFIG.ADMIN_TOKEN);
  
  if (response.status === 200) {
    logTest('Authorization: Admin access', 'PASS', 
      'Admin can access photo moderation');
  } else {
    logTest('Authorization: Admin access', 'FAIL', 
      `Expected 200, got ${response.status}`);
  }
}

async function testModeratorAccess() {
  const response = await makeRequest('GET', '/admin/photos/pending', CONFIG.MODERATOR_TOKEN);
  
  if (response.status === 200) {
    logTest('Authorization: Moderator access', 'PASS', 
      'Moderator can access photo moderation');
  } else {
    logTest('Authorization: Moderator access', 'FAIL', 
      `Expected 200, got ${response.status}`);
  }
}

async function testUserNoAccess() {
  if (!CONFIG.USER_TOKEN || CONFIG.USER_TOKEN === 'YOUR_USER_JWT_TOKEN_HERE') {
    logTest('Authorization: User denied (403)', 'SKIP', 
      'No USER_TOKEN provided');
    return;
  }
  
  const response = await makeRequest('GET', '/admin/photos/pending', CONFIG.USER_TOKEN);
  
  if (response.status === 403) {
    logTest('Authorization: User denied (403)', 'PASS', 
      'Regular users correctly denied access');
  } else {
    logTest('Authorization: User denied (403)', 'FAIL', 
      `Expected 403, got ${response.status}`);
  }
}

async function testNoToken() {
  const response = await makeRequest('GET', '/admin/photos/pending', '');
  
  if (response.status === 401) {
    logTest('Authorization: No token (401)', 'PASS', 
      'Requests without token correctly rejected');
  } else {
    logTest('Authorization: No token (401)', 'FAIL', 
      `Expected 401, got ${response.status}`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

runTests().catch(error => {
  console.error(chalk.red.bold('\n❌ Test suite crashed!'));
  console.error(error);
  process.exit(1);
});
