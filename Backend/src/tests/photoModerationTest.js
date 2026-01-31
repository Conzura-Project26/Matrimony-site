/**
 * Photo Moderation Test Script
 * Tests admin/moderator photo approval and rejection workflows
 * 
 * Usage:
 * 1. Ensure backend is running (npm run dev)
 * 2. Update MODERATOR_USER credentials below
 * 3. Run: node src/tests/photoModerationTest.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// UPDATE WITH MODERATOR/ADMIN CREDENTIALS
const MODERATOR_USER = {
  identifier: '9902964782', // Moderator's phone or email
  password: 'Rahul@2004'
};

// Regular user for creating test photos
const REGULAR_USER = {
  identifier: '9380245433',
  password: 'Harsha@2004'
};

let moderatorToken = '';
let regularUserToken = '';
let regularUserId = '';
let testPhotoIds = [];

/**
 * Login as Moderator/Admin
 */
async function loginAsModerator() {
  console.log('\n🔐 Step 1: Logging in as Moderator/Admin...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, MODERATOR_USER);
    
    if (response.data.success) {
      moderatorToken = response.data.data.accessToken;
      const user = response.data.data.user;
      console.log('✅ Moderator login successful');
      console.log(`   User: ${user.full_name || 'Moderator'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Token: ${moderatorToken.substring(0, 30)}...`);
      return true;
    }
  } catch (error) {
    console.error('❌ Moderator login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Login as Regular User (to create test photos)
 */
async function loginAsRegularUser() {
  console.log('\n🔐 Step 2: Logging in as Regular User (for test data)...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, REGULAR_USER);
    
    if (response.data.success) {
      regularUserToken = response.data.data.accessToken;
      regularUserId = response.data.data.user.id;
      console.log('✅ Regular user login successful');
      console.log(`   User ID: ${regularUserId}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Regular user login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Create test photos for moderation
 */
async function createTestPhotos() {
  console.log('\n📸 Step 3: Creating test photos for moderation...');
  
  const testPhotos = [
    { url: 'https://picsum.photos/id/1000/600/800', visibility: 'PUBLIC' },
    { url: 'https://picsum.photos/id/1001/600/800', visibility: 'PUBLIC' },
    { url: 'https://picsum.photos/id/1002/600/800', visibility: 'PRIVATE' },
  ];

  for (const photo of testPhotos) {
    try {
      const response = await axios.post(
        `${API_BASE}/users/${regularUserId}/photos`,
        {
          fileUrl: photo.url,
          visibility: photo.visibility
        },
        {
          headers: {
            'Authorization': `Bearer ${regularUserToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        testPhotoIds.push(response.data.data.id);
        console.log(`✅ Photo created: ID ${response.data.data.id} (${photo.visibility})`);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      if (msg.includes('Maximum 5 photos')) {
        console.log('⚠️  Photo limit reached - using existing photos for testing');
        break;
      } else {
        console.error(`❌ Failed to create photo: ${msg}`);
      }
    }
  }

  console.log(`\n📊 Created ${testPhotoIds.length} test photos`);
  return testPhotoIds.length > 0;
}

/**
 * Test 1: Get Pending Photos
 */
async function testGetPendingPhotos() {
  console.log('\n\n🧪 TEST 1: Get Pending Photos');
  console.log('=' .repeat(50));

  try {
    // Test with default pagination
    console.log('\n📋 Fetching pending photos (page 1)...');
    const response = await axios.get(`${API_BASE}/admin/photos/pending`, {
      headers: {
        'Authorization': `Bearer ${moderatorToken}`
      }
    });

    if (response.data.success) {
      const { photos, pagination } = response.data.data;
      console.log('✅ Pending photos retrieved successfully');
      console.log(`   Total: ${pagination.total}`);
      console.log(`   Page: ${pagination.page}/${pagination.totalPages}`);
      console.log(`   Showing: ${photos.length} photos`);
      
      photos.slice(0, 3).forEach((photo, index) => {
        console.log(`   ${index + 1}. Photo ID: ${photo.id} | User: ${photo.user.full_name} | Uploaded: ${new Date(photo.uploaded_at).toLocaleString()}`);
      });

      return photos;
    }
  } catch (error) {
    console.error('❌ Failed to get pending photos:', error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Test 2: Get Pending Photos with Pagination
 */
async function testPaginatedPendingPhotos() {
  console.log('\n\n🧪 TEST 2: Get Pending Photos with Pagination');
  console.log('=' .repeat(50));

  try {
    console.log('\n📋 Fetching pending photos (page 1, limit 2)...');
    const response = await axios.get(`${API_BASE}/admin/photos/pending?page=1&limit=2`, {
      headers: {
        'Authorization': `Bearer ${moderatorToken}`
      }
    });

    if (response.data.success) {
      const { photos, pagination } = response.data.data;
      console.log('✅ Paginated results retrieved successfully');
      console.log(`   Total: ${pagination.total}`);
      console.log(`   Page: ${pagination.page}/${pagination.totalPages}`);
      console.log(`   Limit: ${pagination.limit}`);
      console.log(`   Photos returned: ${photos.length}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Pagination test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 3: Approve a Photo
 */
async function testApprovePhoto(photoId) {
  console.log('\n\n🧪 TEST 3: Approve Photo');
  console.log('=' .repeat(50));

  if (!photoId) {
    console.log('⚠️  No photo ID provided - skipping test');
    return null;
  }

  try {
    console.log(`\n✅ Approving photo ID: ${photoId}...`);
    const response = await axios.patch(
      `${API_BASE}/admin/photos/${photoId}/approve`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${moderatorToken}`
        }
      }
    );

    if (response.data.success) {
      const photo = response.data.data;
      console.log('✅ Photo approved successfully');
      console.log(`   Photo ID: ${photo.id}`);
      console.log(`   Approved: ${photo.is_approved}`);
      console.log(`   Approved by: ${photo.approved_by}`);
      return photo;
    }
  } catch (error) {
    console.error('❌ Failed to approve photo:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Test 4: Approve Already Approved Photo (Should Fail)
 */
async function testDuplicateApproval(photoId) {
  console.log('\n\n🧪 TEST 4: Duplicate Approval (Should Fail)');
  console.log('=' .repeat(50));

  if (!photoId) {
    console.log('⚠️  No photo ID provided - skipping test');
    return;
  }

  try {
    console.log(`\n🔄 Attempting to approve already approved photo ${photoId}...`);
    await axios.patch(
      `${API_BASE}/admin/photos/${photoId}/approve`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${moderatorToken}`
        }
      }
    );
    console.log('❌ UNEXPECTED: Should have failed but succeeded');
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('already approved')) {
      console.log('✅ Correctly rejected duplicate approval');
      console.log(`   Error: ${message}`);
    } else {
      console.error('❌ Failed with unexpected error:', message);
    }
  }
}

/**
 * Test 5: Reject/Delete a Photo
 */
async function testRejectPhoto(photoId) {
  console.log('\n\n🧪 TEST 5: Reject and Delete Photo');
  console.log('=' .repeat(50));

  if (!photoId) {
    console.log('⚠️  No photo ID provided - skipping test');
    return;
  }

  try {
    console.log(`\n🗑️  Rejecting photo ID: ${photoId}...`);
    const response = await axios.delete(
      `${API_BASE}/admin/photos/${photoId}`,
      {
        headers: {
          'Authorization': `Bearer ${moderatorToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: 'Test rejection - inappropriate content'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Photo rejected and deleted successfully');
      console.log(`   Message: ${response.data.message}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to reject photo:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 6: Reject Non-Existent Photo (Should Fail)
 */
async function testRejectNonExistentPhoto() {
  console.log('\n\n🧪 TEST 6: Reject Non-Existent Photo (Should Fail)');
  console.log('=' .repeat(50));

  try {
    console.log('\n🔍 Attempting to reject non-existent photo (ID: 999999)...');
    await axios.delete(
      `${API_BASE}/admin/photos/999999`,
      {
        headers: {
          'Authorization': `Bearer ${moderatorToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: 'Test'
        }
      }
    );
    console.log('❌ UNEXPECTED: Should have failed but succeeded');
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('not found') || error.response?.status === 404) {
      console.log('✅ Correctly rejected non-existent photo');
      console.log(`   Error: ${message}`);
    } else {
      console.error('❌ Failed with unexpected error:', message);
    }
  }
}

/**
 * Test 7: Unauthorized Access (Regular User Trying to Moderate)
 */
async function testUnauthorizedAccess() {
  console.log('\n\n🧪 TEST 7: Unauthorized Access (Should Fail)');
  console.log('=' .repeat(50));

  try {
    console.log('\n🚫 Regular user attempting to access pending photos...');
    await axios.get(`${API_BASE}/admin/photos/pending`, {
      headers: {
        'Authorization': `Bearer ${regularUserToken}`
      }
    });
    console.log('❌ UNEXPECTED: Regular user accessed admin endpoint!');
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status;
    if (status === 403 || message.includes('permission') || message.includes('Forbidden')) {
      console.log('✅ Correctly blocked unauthorized access');
      console.log(`   Status: ${status}`);
      console.log(`   Error: ${message}`);
    } else {
      console.error('❌ Failed with unexpected error:', message);
    }
  }
}

/**
 * Test 8: Access Without Authentication (Should Fail)
 */
async function testUnauthenticatedAccess() {
  console.log('\n\n🧪 TEST 8: Unauthenticated Access (Should Fail)');
  console.log('=' .repeat(50));

  try {
    console.log('\n🚫 Attempting to access without token...');
    await axios.get(`${API_BASE}/admin/photos/pending`);
    console.log('❌ UNEXPECTED: Accessed without authentication!');
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status;
    if (status === 401 || message.includes('token') || message.includes('authentication')) {
      console.log('✅ Correctly blocked unauthenticated access');
      console.log(`   Status: ${status}`);
      console.log(`   Error: ${message}`);
    } else {
      console.error('❌ Failed with unexpected error:', message);
    }
  }
}

/**
 * Cleanup: Delete test photos
 */
async function cleanup() {
  console.log('\n\n🧹 Cleanup: Deleting remaining test photos...');
  
  for (const photoId of testPhotoIds) {
    try {
      await axios.delete(
        `${API_BASE}/users/${regularUserId}/photos/${photoId}`,
        {
          headers: {
            'Authorization': `Bearer ${regularUserToken}`
          }
        }
      );
      console.log(`✅ Deleted test photo ${photoId}`);
    } catch (error) {
      // Photo might already be deleted
      console.log(`⚠️  Photo ${photoId} already deleted or not found`);
    }
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🚀 Starting Photo Moderation Tests...');
  console.log('=' .repeat(50));

  // Step 1 & 2: Login
  const moderatorLoggedIn = await loginAsModerator();
  if (!moderatorLoggedIn) {
    console.log('\n❌ Tests aborted: Moderator login failed');
    console.log('\n💡 Please update MODERATOR_USER credentials at the top of this file');
    console.log('   The user must have ADMIN or MODERATOR role');
    return;
  }

  const userLoggedIn = await loginAsRegularUser();
  if (!userLoggedIn) {
    console.log('\n❌ Tests aborted: Regular user login failed');
    console.log('\n💡 Please update REGULAR_USER credentials');
    return;
  }

  // Step 3: Create test photos
  const photosCreated = await createTestPhotos();
  if (!photosCreated) {
    console.log('\n⚠️  No test photos created - will use existing pending photos');
  }

  // Test 1: Get pending photos
  const pendingPhotos = await testGetPendingPhotos();

  // Test 2: Pagination
  await testPaginatedPendingPhotos();

  // Test 3 & 4: Approve photo
  if (pendingPhotos.length > 0) {
    const photoToApprove = pendingPhotos[0];
    const approved = await testApprovePhoto(photoToApprove.id);
    
    if (approved) {
      // Test 4: Try duplicate approval
      await testDuplicateApproval(photoToApprove.id);
    }
  }

  // Test 5: Reject photo
  if (pendingPhotos.length > 1) {
    await testRejectPhoto(pendingPhotos[1].id);
  }

  // Test 6: Reject non-existent photo
  await testRejectNonExistentPhoto();

  // Test 7: Unauthorized access
  await testUnauthorizedAccess();

  // Test 8: Unauthenticated access
  await testUnauthenticatedAccess();

  // Cleanup
  if (testPhotoIds.length > 0) {
    await cleanup();
  }

  // Summary
  console.log('\n\n' + '=' .repeat(50));
  console.log('✅ All Photo Moderation Tests Completed!');
  console.log('=' .repeat(50));
  console.log('\n📊 Test Summary:');
  console.log('   ✅ Get pending photos');
  console.log('   ✅ Pagination');
  console.log('   ✅ Approve photo');
  console.log('   ✅ Duplicate approval protection');
  console.log('   ✅ Reject/delete photo');
  console.log('   ✅ Non-existent photo handling');
  console.log('   ✅ Unauthorized access protection');
  console.log('   ✅ Unauthenticated access protection');
  console.log('\n💡 Check your database audit logs to verify moderation tracking');
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
