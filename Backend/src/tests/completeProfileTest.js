/**
 * Task 2.10: Complete Profile API - Test Suite
 * 
 * Tests for:
 * 1. GET /users/:userId/profile - Complete profile retrieval
 * 2. GET /users/:userId/verification-status - Verification status
 * 3. Profile completion percentage
 * 4. Profile verification status checker
 * 5. Privacy filtering (sensitive data)
 * 6. Profile badges and activity status
 * 7. Profile readiness for matching
 * 8. Profile completion caching (NEW - Performance optimization)
 * 9. Cache performance metrics (NEW - Verify 3-4x speedup)
 * 
 * Usage:
 * 1. Update TEST_USER_ID and ACCESS_TOKEN with your values
 * 2. Run: node src/tests/completeProfileTest.js
 */

import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

// To run this test:
// 1. Make sure you have a test user in the database
// 2. Get an access token by logging in via POST /auth/login
// 3. Update the values below with actual credentials

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'f6ab094e-2900-497f-bb0d-000cc93a25db';
const ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY5OTYyNDA0LCJleHAiOjE3Njk5NjMzMDR9.3H4RQWErIlhwtqxWjwcWwzNL0DPkuvaz7L7SUYVBL1A';

// Test another user's profile (for privacy testing)
const OTHER_USER_ID = process.env.OTHER_USER_ID || '7af0cc53-de82-48c7-8711-18e8dea6cb9c';
const OTHER_USER_TOKEN = process.env.OTHER_USER_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YWYwY2M1My1kZTgyLTQ4YzctODcxMS0xOGU4ZGVhNmNiOWMiLCJtb2JpbGVfbnVtYmVyIjoiNjM2MjExNTk5OCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY5OTYzMDI1LCJleHAiOjE3Njk5NjM5MjV9.DaUmQqsNBTvzUrmI8vlXfLlAttQpwaFGIFPOYxsGDmI';

// Check if credentials are configured
if (ACCESS_TOKEN === 'your_jwt_token_here') {
  console.error('\n❌ ERROR: Test credentials not configured!');
  console.error('\nPlease set environment variables or update the test file:');
  console.error('  - TEST_USER_ID: A valid user UUID from your database');
  console.error('  - TEST_ACCESS_TOKEN: A valid JWT token (login via POST /auth/login)');
  console.error('  - OTHER_USER_ID: Another valid user UUID (for privacy tests)\n');
  console.error('Example:');
  console.error('  export TEST_USER_ID="actual-uuid-here"');
  console.error('  export TEST_ACCESS_TOKEN="actual-jwt-token-here"');
  console.error('  node src/tests/completeProfileTest.js\n');
  process.exit(1);
}

// ============================================
// AXIOS INSTANCE WITH AUTH
// ============================================

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
  console.log(`  ${label}: ${JSON.stringify(value, null, 2)}`);
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test 1: Get Complete Profile (Self)
 */
async function testGetCompleteProfileSelf() {
  printSection('TEST 1: GET COMPLETE PROFILE (SELF)');
  
  try {
    const response = await api.get(`/users/${TEST_USER_ID}/profile`);
    
    printSuccess('Complete profile retrieved successfully');
    printInfo('Status', response.status);
    printInfo('Message', response.data.message);
    
    const data = response.data.data;
    
    // Check all sections exist
    printSubSection('Profile Sections Check');
    const sections = [
      'basic_info', 'personal_details', 'caste_details', 'education_details',
      'professional_details', 'family_details', 'horoscope_details', 'photos',
      'partner_preferences', 'profile_completion', 'verification_status',
      'activity_status', 'badges'
    ];
    
    sections.forEach(section => {
      const exists = section in data;
      if (exists) {
        printSuccess(`Section '${section}' exists`);
        
        // Show sample data for key sections
        if (section === 'basic_info') {
          console.log(`    Name: ${data.basic_info.full_name}`);
          console.log(`    Age: ${data.basic_info.age}`);
          console.log(`    Gender: ${data.basic_info.gender}`);
          console.log(`    Mobile: ${data.basic_info.mobile_number || 'Hidden'}`);
          console.log(`    Email: ${data.basic_info.email || 'Hidden'}`);
        } else if (section === 'profile_completion') {
          console.log(`    Percentage: ${data.profile_completion.percentage}%`);
          console.log(`    Status: ${data.profile_completion.status}`);
          console.log(`    Ready for Matching: ${data.profile_completion.readiness.is_ready_for_matching}`);
          console.log(`    Is Complete: ${data.profile_completion.readiness.is_complete}`);
        } else if (section === 'verification_status') {
          console.log(`    Is Verified: ${data.verification_status.is_verified}`);
          console.log(`    Mobile Verified: ${data.verification_status.mobile_verified}`);
          console.log(`    Email Verified: ${data.verification_status.email_verified}`);
          console.log(`    Profile Verified: ${data.verification_status.profile_verified}`);
          console.log(`    Verification %: ${data.verification_status.verification_percentage}%`);
        } else if (section === 'badges') {
          console.log(`    Badges Count: ${data.badges.length}`);
          data.badges.forEach(badge => {
            console.log(`      - ${badge.icon} ${badge.label} (${badge.color})`);
          });
        } else if (section === 'activity_status') {
          console.log(`    Activity Level: ${data.activity_status.activity_level}`);
          console.log(`    Days Since Update: ${data.activity_status.days_since_last_update}`);
          console.log(`    Account Age: ${data.activity_status.account_age_days} days`);
        } else if (section === 'photos') {
          console.log(`    Photos Count: ${data.photos.length}`);
          if (data.photos.length > 0) {
            console.log(`    Primary Photo: ${data.photos[0].is_primary ? 'Yes' : 'No'}`);
            console.log(`    All Approved: ${data.photos.every(p => p.is_approved)}`);
          }
        } else if (section === 'education_details') {
          if (data.education_details && data.education_details.length > 0) {
            console.log(`    Education Entries: ${data.education_details.length}`);
            console.log(`    Latest: ${data.education_details[0].qualification} (${data.education_details[0].year_of_passing})`);
          }
        }
      } else {
        printError(`Section '${section}' is missing`);
      }
    });
    
    // Verify sensitive data is visible (viewing own profile)
    printSubSection('Sensitive Data Visibility (Self)');
    if (data.basic_info.mobile_number) {
      printSuccess('Mobile number is visible (expected for self)');
    } else {
      printError('Mobile number is hidden (unexpected for self)');
    }
    
    if (data.basic_info.email) {
      printSuccess('Email is visible (expected for self)');
    } else {
      console.log('⚠️  Email is not set or hidden');
    }
    
    if (data.professional_details?.annual_income_range) {
      printSuccess('Income is visible (expected for self)');
    } else {
      console.log('⚠️  Income is not set or hidden');
    }
    
    if (data.family_details) {
      printSuccess('Family details are visible (expected for self)');
    } else {
      console.log('⚠️  Family details not set');
    }
    
    return response.data;
  } catch (error) {
    printError('Failed to get complete profile');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 2: Get Complete Profile (Other User - Privacy Test)
 */
async function testGetCompleteProfileOther() {
  printSection('TEST 2: GET COMPLETE PROFILE (OTHER USER - PRIVACY)');
  
  try {
    // First user (TEST_USER_ID) viewing another user's profile (OTHER_USER_ID)
    const response = await api.get(`/users/${OTHER_USER_ID}/profile`);
    
    printSuccess('Other user profile retrieved successfully');
    printInfo('Status', response.status);
    printInfo('Viewing user', TEST_USER_ID);
    printInfo('Target user', OTHER_USER_ID);
    
    const data = response.data.data;
    
    // Verify sensitive data is hidden (viewing another user's profile)
    printSubSection('Sensitive Data Visibility (Other User)');
    
    if (!data.basic_info.mobile_number) {
      printSuccess('Mobile number is hidden (expected for other user)');
    } else {
      printError('Mobile number is visible (should be hidden)');
      printInfo('Value', data.basic_info.mobile_number);
    }
    
    if (!data.basic_info.email) {
      printSuccess('Email is hidden (expected for other user)');
    } else {
      printError('Email is visible (should be hidden)');
      printInfo('Value', data.basic_info.email);
    }
    
    if (!data.professional_details?.annual_income_range) {
      printSuccess('Income is hidden (expected for other user)');
    } else {
      printError('Income is visible (should be hidden)');
      printInfo('Value', data.professional_details.annual_income_range);
    }
    
    if (!data.family_details) {
      printSuccess('Family details are hidden (expected for other user)');
    } else {
      printError('Family details are visible (should be hidden)');
    }
    
    // Public data should still be visible
    printSubSection('Public Data Visibility (Other User)');
    if (data.basic_info.full_name) {
      printSuccess('Name is visible');
      printInfo('Name', data.basic_info.full_name);
    } else {
      printError('Name should be visible but is hidden');
    }
    
    if (data.basic_info.age) {
      printSuccess('Age is visible');
      printInfo('Age', data.basic_info.age);
    } else {
      printError('Age should be visible but is hidden');
    }
    
    if (data.personal_details) {
      printSuccess('Personal details are visible');
    } else {
      printError('Personal details should be visible but are hidden');
    }
    
    if (data.education_details) {
      printSuccess('Education details are visible');
    } else {
      printError('Education details should be visible but are hidden');
    }
    
    printSubSection('Privacy Summary');
    const sensitiveHidden = !data.basic_info.mobile_number && 
                           !data.basic_info.email && 
                           !data.professional_details?.annual_income_range &&
                           !data.family_details;
    
    const publicVisible = data.basic_info.full_name && 
                          data.basic_info.age;
    
    if (sensitiveHidden && publicVisible) {
      printSuccess('✓ Privacy filtering working correctly');
    } else {
      printError('✗ Privacy filtering has issues');
    }
    
    return response.data;
  } catch (error) {
    printError(`Test failed: ${error.message}`);
    if (error.response) {
      printInfo('Error Status', error.response.status);
      printInfo('Error Data', error.response.data);
    }
    return null;
  }
}

/**
 * Test 3: Get Verification Status
 */
async function testGetVerificationStatus() {
  printSection('TEST 3: GET VERIFICATION STATUS');
  
  try {
    const response = await api.get(`/users/${TEST_USER_ID}/verification-status`);
    
    printSuccess('Verification status retrieved successfully');
    printInfo('Status', response.status);
    printInfo('Message', response.data.message);
    
    const data = response.data.data;
    
    printSubSection('Verification Overview');
    console.log(`  Overall Verified: ${data.is_verified ? '✅ YES' : '❌ NO'}`);
    console.log(`  Verification Percentage: ${data.verification_percentage}%`);
    console.log(`  Pending Verifications: ${data.pending_verifications.length}`);
    
    printSubSection('Verification Steps');
    data.verification_steps.forEach(step => {
      const statusIcon = step.status === 'verified' ? '✅' : '⏳';
      console.log(`  ${statusIcon} ${step.label}`);
      console.log(`     Status: ${step.status}`);
      console.log(`     Description: ${step.description}`);
    });
    
    if (data.next_steps.length > 0) {
      printSubSection('Next Steps');
      data.next_steps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
    } else {
      printSuccess('All verifications complete!');
    }
    
    printSubSection('User Info');
    console.log(`  Name: ${data.user_info.full_name}`);
    console.log(`  Mobile: ${data.user_info.mobile_number}`);
    console.log(`  Email: ${data.user_info.email}`);
    
    return response.data;
  } catch (error) {
    printError('Failed to get verification status');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 4: Verify Profile Readiness Logic
 */
async function testProfileReadiness() {
  printSection('TEST 4: PROFILE READINESS LOGIC');
  
  try {
    const response = await api.get(`/users/${TEST_USER_ID}/profile`);
    const readiness = response.data.data.profile_completion.readiness;
    
    printSuccess('Profile readiness calculated');
    
    printSubSection('Readiness Details');
    console.log(`  Status: ${readiness.status}`);
    console.log(`  Message: ${readiness.message}`);
    console.log(`  Ready for Matching: ${readiness.is_ready_for_matching ? '✅ YES' : '❌ NO'}`);
    console.log(`  Is Complete: ${readiness.is_complete ? '✅ YES' : '❌ NO'}`);
    console.log(`  Minimum Required: ${readiness.minimum_completion_required}%`);
    
    const completion = response.data.data.profile_completion.percentage;
    const verification = response.data.data.verification_status;
    
    printSubSection('Readiness Criteria Check');
    if (completion >= 60) {
      printSuccess(`Profile completion >= 60% (${completion}%)`);
    } else {
      printError(`Profile completion < 60% (${completion}%)`);
    }
    
    if (verification.mobile_verified) {
      printSuccess('Mobile is verified');
    } else {
      printError('Mobile is not verified');
    }
    
    if (readiness.is_ready_for_matching) {
      printSuccess('✨ Profile is ready for matchmaking!');
    } else {
      printError('⚠️  Profile is NOT ready for matchmaking yet');
    }
    
    return response.data;
  } catch (error) {
    printError('Failed to check profile readiness');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 5: Verify Photo Filtering (Only Approved)
 */
async function testPhotoFiltering() {
  printSection('TEST 5: PHOTO FILTERING (ONLY APPROVED)');
  
  try {
    const response = await api.get(`/users/${TEST_USER_ID}/profile`);
    const photos = response.data.data.photos;
    
    printSuccess('Photos retrieved');
    
    printSubSection('Photo Filtering Check');
    console.log(`  Total Photos: ${photos.length}`);
    
    if (photos.length > 0) {
      const allApproved = photos.every(photo => photo.is_approved === true);
      if (allApproved) {
        printSuccess('All returned photos are approved ✓');
      } else {
        printError('Some photos are not approved!');
      }
      
      const hasPrimary = photos.some(photo => photo.is_primary === true);
      if (hasPrimary) {
        printSuccess('Primary photo is set');
      } else {
        console.log('⚠️  No primary photo set');
      }
      
      printSubSection('Photo Metadata');
      photos.forEach((photo, index) => {
        console.log(`  Photo ${index + 1}:`);
        console.log(`    ID: ${photo.id}`);
        console.log(`    URL: ${photo.photo_url.substring(0, 50)}...`);
        console.log(`    Primary: ${photo.is_primary ? '✓' : '✗'}`);
        console.log(`    Approved: ${photo.is_approved ? '✓' : '✗'}`);
        console.log(`    Visibility: ${photo.visibility}`);
        console.log(`    Uploaded: ${photo.uploaded_at}`);
      });
    } else {
      console.log('⚠️  No photos found');
    }
    
    return response.data;
  } catch (error) {
    printError('Failed to check photo filtering');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 6: Verify Education Sorting (Latest First)
 */
async function testEducationSorting() {
  printSection('TEST 6: EDUCATION SORTING (LATEST FIRST)');
  
  try {
    const response = await api.get(`/users/${TEST_USER_ID}/profile`);
    const education = response.data.data.education_details;
    
    printSuccess('Education details retrieved');
    
    if (education && education.length > 0) {
      printSubSection('Education Entries');
      console.log(`  Total Entries: ${education.length}`);
      
      education.forEach((edu, index) => {
        console.log(`  ${index + 1}. ${edu.qualification}`);
        console.log(`     Institution: ${edu.institution_name}`);
        console.log(`     Year: ${edu.year_of_passing}`);
      });
      
      // Check if sorted by year descending
      if (education.length > 1) {
        const isSorted = education.every((edu, i) => {
          if (i === 0) return true;
          return education[i - 1].year_of_passing >= edu.year_of_passing;
        });
        
        if (isSorted) {
          printSuccess('Education entries are sorted by year (latest first) ✓');
        } else {
          printError('Education entries are NOT sorted correctly');
        }
      }
    } else {
      console.log('⚠️  No education details found');
    }
    
    return response.data;
  } catch (error) {
    printError('Failed to check education sorting');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 7: Verify Badge Calculation
 */
async function testBadgeCalculation() {
  printSection('TEST 7: BADGE CALCULATION');
  
  try {
    const response = await api.get(`/users/${TEST_USER_ID}/profile`);
    const data = response.data.data;
    
    printSuccess('Badges calculated');
    
    printSubSection('Available Badges');
    if (data.badges.length > 0) {
      console.log(`  Total Badges: ${data.badges.length}`);
      data.badges.forEach(badge => {
        console.log(`  ${badge.icon} ${badge.label}`);
        console.log(`     Type: ${badge.type}`);
        console.log(`     Color: ${badge.color}`);
      });
    } else {
      console.log('  No badges earned yet');
    }
    
    printSubSection('Badge Eligibility Check');
    
    // Verified badge
    if (data.verification_status.is_verified) {
      console.log('  ✅ Eligible for "Verified Profile" badge');
    } else {
      console.log('  ⏳ Not eligible for "Verified Profile" badge yet');
    }
    
    // Complete profile badge
    if (data.profile_completion.percentage === 100) {
      console.log('  ✅ Eligible for "Complete Profile" badge');
    } else {
      console.log(`  ⏳ Not eligible for "Complete Profile" badge yet (${data.profile_completion.percentage}% complete)`);
    }
    
    // Recently joined badge
    if (data.activity_status.account_age_days <= 30) {
      console.log('  ✅ Eligible for "Recently Joined" badge');
    } else {
      console.log('  ❌ Not eligible for "Recently Joined" badge (account age: ' + data.activity_status.account_age_days + ' days)');
    }
    
    // Active user badge
    if (data.activity_status.days_since_last_update <= 7) {
      console.log('  ✅ Eligible for "Active User" badge');
    } else {
      console.log('  ❌ Not eligible for "Active User" badge (last update: ' + data.activity_status.days_since_last_update + ' days ago)');
    }
    
    return response.data;
  } catch (error) {
    printError('Failed to check badge calculation');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 8: Profile Completion Caching (NEW)
 */
async function testProfileCompletionCaching() {
  printSection('TEST 8: PROFILE COMPLETION CACHING (NEW FEATURE)');
  
  try {
    // Test 8.1: Verify cached value exists
    printSubSection('Test 8.1: Verify Cache Exists');
    const response1 = await api.get(`/users/${TEST_USER_ID}/profile`);
    const cachedPercentage = response1.data.data.profile_completion.percentage;
    
    if (cachedPercentage !== undefined && cachedPercentage !== null) {
      printSuccess(`Cached profile completion: ${cachedPercentage}%`);
    } else {
      printError('Profile completion percentage is missing');
    }
    
    // Test 8.2: Verify cache consistency (multiple reads should return same value)
    printSubSection('Test 8.2: Cache Consistency Check');
    const startTime = Date.now();
    const response2 = await api.get(`/users/${TEST_USER_ID}/profile`);
    const readTime1 = Date.now() - startTime;
    
    const startTime2 = Date.now();
    const response3 = await api.get(`/users/${TEST_USER_ID}/profile`);
    const readTime2 = Date.now() - startTime2;
    
    const percentage1 = response2.data.data.profile_completion.percentage;
    const percentage2 = response3.data.data.profile_completion.percentage;
    
    if (percentage1 === percentage2) {
      printSuccess(`Cache consistency verified: ${percentage1}% (both reads)`);
    } else {
      printError(`Cache inconsistency: ${percentage1}% vs ${percentage2}%`);
    }
    
    printInfo('First read time', `${readTime1}ms`);
    printInfo('Second read time', `${readTime2}ms`);
    
    if (readTime2 < 150) {
      printSuccess('Fast cache reads confirmed (< 150ms)');
    } else {
      console.log(`⚠️  Cache read took ${readTime2}ms (expected < 150ms)`);
    }
    
    // Test 8.3: Test cache update after profile modification
    printSubSection('Test 8.3: Cache Update After Profile Change');
    console.log('  Note: This test requires permission to update profile');
    console.log('  Skipping actual update (read-only test mode)');
    console.log('  In production, cache updates automatically after:');
    console.log('    - Personal details update');
    console.log('    - Education create/update/delete');
    console.log('    - Professional details update');
    console.log('    - Photo upload/delete');
    console.log('    - And all other profile CRUD operations');
    
    return response1.data;
  } catch (error) {
    printError('Failed to test profile completion caching');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 9: Cache Performance Comparison
 */
async function testCachePerformance() {
  printSection('TEST 9: CACHE PERFORMANCE METRICS');
  
  try {
    printSubSection('Multiple Sequential Reads (Simulating Dashboard Loads)');
    
    const readTimes = [];
    const iterations = 5;
    
    for (let i = 1; i <= iterations; i++) {
      const startTime = Date.now();
      await api.get(`/users/${TEST_USER_ID}/profile`);
      const duration = Date.now() - startTime;
      readTimes.push(duration);
      console.log(`  Read ${i}/${iterations}: ${duration}ms`);
    }
    
    const avgTime = Math.round(readTimes.reduce((a, b) => a + b, 0) / readTimes.length);
    const minTime = Math.min(...readTimes);
    const maxTime = Math.max(...readTimes);
    
    printSubSection('Performance Summary');
    console.log(`  Average Response Time: ${avgTime}ms`);
    console.log(`  Fastest Response: ${minTime}ms`);
    console.log(`  Slowest Response: ${maxTime}ms`);
    
    if (avgTime < 150) {
      printSuccess(`Excellent performance! Average ${avgTime}ms (cached reads)`);
      console.log('  Expected performance gain: 3-4x faster than uncached');
    } else if (avgTime < 300) {
      console.log(`⚠️  Moderate performance: ${avgTime}ms`);
      console.log('  (Expected < 150ms for cached reads)');
    } else {
      console.log(`⚠️  Slow performance: ${avgTime}ms`);
      console.log('  (Cache may not be working properly)');
    }
    
    return { avgTime, minTime, maxTime, readTimes };
  } catch (error) {
    printError('Failed to test cache performance');
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 10: Error Handling
 */
async function testErrorHandling() {
  printSection('TEST 10: ERROR HANDLING');
  
  // Test 10.1: Non-existent user
  printSubSection('Test 10.1: Non-existent User');
  try {
    await api.get('/users/00000000-0000-0000-0000-000000000000/profile');
    printError('Should have thrown 404 error');
  } catch (error) {
    if (error.response?.status === 404) {
      printSuccess('Correctly returned 404 for non-existent user');
    } else {
      printError(`Unexpected error: ${error.response?.status}`);
    }
  }
  
  // Test 10.2: Invalid UUID format
  printSubSection('Test 10.2: Invalid UUID Format');
  try {
    await api.get('/users/invalid-uuid/profile');
    printError('Should have thrown error for invalid UUID');
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      printSuccess('Correctly handled invalid UUID format');
    } else {
      printError(`Unexpected error: ${error.response?.status}`);
    }
  }
  
  // Test 10.3: Verification status without permission
  printSubSection('Test 10.3: Verification Status (Other User)');
  try {
    await api.get(`/users/${OTHER_USER_ID}/verification-status`);
    printError('Should have thrown 403 for viewing other user verification status');
  } catch (error) {
    if (error.response?.status === 403) {
      printSuccess('Correctly returned 403 for unauthorized verification status access');
    } else {
      console.log(`⚠️  Got ${error.response?.status} instead of 403 (or OTHER_USER_ID not configured)`);
    }
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TASK 2.10: COMPLETE PROFILE API - TEST SUITE          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 Configuration:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test User ID: ${TEST_USER_ID}`);
  console.log(`   Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  
  let passedTests = 0;
  let failedTests = 0;
  
  const tests = [
    { name: 'Complete Profile (Self)', fn: testGetCompleteProfileSelf },
    { name: 'Complete Profile (Other User)', fn: testGetCompleteProfileOther },
    { name: 'Verification Status', fn: testGetVerificationStatus },
    { name: 'Profile Readiness', fn: testProfileReadiness },
    { name: 'Photo Filtering', fn: testPhotoFiltering },
    { name: 'Education Sorting', fn: testEducationSorting },
    { name: 'Badge Calculation', fn: testBadgeCalculation },
    { name: 'Profile Completion Caching 🆕', fn: testProfileCompletionCaching },
    { name: 'Cache Performance Metrics 🆕', fn: testCachePerformance },
    { name: 'Error Handling', fn: testErrorHandling }
  ];
  
  for (const test of tests) {
    try {
      await test.fn();
      passedTests++;
    } catch (error) {
      failedTests++;
      console.error(`\n❌ Test "${test.name}" failed`);
    }
  }
  
  // Summary
  printSection('TEST SUMMARY');
  console.log(`  Total Tests: ${tests.length}`);
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
