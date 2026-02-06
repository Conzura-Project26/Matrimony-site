/**
 * Audit Logging System Test Suite
 * Task 5.6: Comprehensive testing of audit logging implementation
 * 
 * Tests:
 * 1. Authentication operations (login, logout, password changes)
 * 2. Photo operations (upload, delete, approve, reject)
 * 3. Profile updates (personal details, caste details, education)
 * 4. Report operations (create, update status, take action)
 * 5. Audit log retrieval and verification
 */

import axios from 'axios';
import prisma from '../src/config/prisma.js';

// ============================================
// CONFIGURATION - UPDATE WITH YOUR CREDENTIALS
// ============================================

const CONFIG = {
  BASE_URL: 'http://localhost:3000', // Update if different
  
  // Test User Credentials (Regular User)
  TEST_USER: {
    mobile_number: '6362115998',
    password: 'Amogh@2004',
    userId: ''         // Will be populated after login
  },
  
  // Moderator User (for photo approval tests)
  MODERATOR_USER: {
    mobile_number: '9902964782',
    password: 'Rahul@2004',
    userId: ''         // Will be populated after login
  },
  
  // Admin/Moderator Credentials
  ADMIN_USER: {
    mobile_number: '9380422508',
    password: 'Nishanth@2005',
    userId: ''         // Will be populated after login
  },
  
  // Second Test User (for reporting tests) - using moderator
  TEST_USER_2: {
    mobile_number: '9902964782',
    userId: ''         // Will be populated after login
  },
  
  // Tokens (will be populated during tests)
  TOKENS: {
    user_access_token: null,
    user_refresh_token: null,
    moderator_access_token: null,
    moderator_refresh_token: null,
    admin_access_token: null,
    admin_refresh_token: null
  },
  
  // Test Resources (will be populated during tests)
  RESOURCES: {
    photoId: null,
    reportId: null,
    educationId: null
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user ID by mobile number
 */
async function getUserIdByMobile(mobileNumber) {
  const user = await prisma.user.findUnique({
    where: { mobile_number: mobileNumber },
    select: { id: true }
  });
  return user?.id || null;
}

/**
 * Make authenticated API request
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${CONFIG.BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    // Extract meaningful error message
    let errorMessage = 'Unknown error';
    if (error.response?.data) {
      const data = error.response.data;
      errorMessage = data.message || data.error || JSON.stringify(data);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: { message: errorMessage, details: error.response?.data },
      status: error.response?.status
    };
  }
}

/**
 * Get latest audit log from database
 */
async function getLatestAuditLog(actorId = null, action = null) {
  const where = {};
  if (actorId) where.actor_id = actorId;
  if (action) where.action = action;
  
  const log = await prisma.auditLog.findFirst({
    where,
    orderBy: { created_at: 'desc' }
  });
  
  return log;
}

/**
 * Get all audit logs for a specific action
 */
async function getAuditLogsByAction(action, limit = 5) {
  const logs = await prisma.auditLog.findMany({
    where: { action },
    orderBy: { created_at: 'desc' },
    take: limit
  });
  
  return logs;
}

/**
 * Verify audit log exists with expected properties
 */
function verifyAuditLog(log, expectedProps) {
  const checks = {
    exists: !!log,
    hasActor: !!log?.actor_id,
    hasAction: !!log?.action,
    hasIpAddress: !!log?.ip_address,
    hasTimestamp: !!log?.created_at
  };
  
  if (expectedProps.action) {
    checks.correctAction = log?.action === expectedProps.action;
  }
  
  if (expectedProps.actorId) {
    checks.correctActor = log?.actor_id === expectedProps.actorId;
  }
  
  if (expectedProps.resourceType) {
    checks.hasResourceType = log?.resource_type === expectedProps.resourceType;
  }
  
  if (expectedProps.status) {
    checks.correctStatus = log?.status === expectedProps.status;
  }
  
  return checks;
}

/**
 * Print test result
 */
function printResult(testName, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   ${details}`);
}

/**
 * Print section header
 */
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('\n🧪 AUDIT LOGGING TEST SUITE - Task 5.6');
  console.log('Started at:', new Date().toISOString());
  console.log('Base URL:', CONFIG.BASE_URL);
  
  let totalTests = 0;
  let passedTests = 0;
  
  try {
    // Get TEST_USER_2 ID for report tests
    if (CONFIG.TEST_USER_2.mobile_number) {
      CONFIG.TEST_USER_2.userId = await getUserIdByMobile(CONFIG.TEST_USER_2.mobile_number);
      if (CONFIG.TEST_USER_2.userId) {
        console.log('✓ Found TEST_USER_2 ID:', CONFIG.TEST_USER_2.userId);
      } else {
        console.log('⚠️  TEST_USER_2 not found - report tests will be skipped');
      }
    }
    
    // ============================================
    // SECTION 1: AUTHENTICATION TESTS
    // ============================================
    printSection('SECTION 1: Authentication & Security Audit Logs');
    
    // Test 1.1: User Login
    console.log('Test 1.1: User Login Audit Log');
    const loginResult = await apiRequest('POST', '/auth/login', {
      identifier: CONFIG.TEST_USER.mobile_number,
      password: CONFIG.TEST_USER.password
    });
    
    totalTests++;
    if (loginResult.success) {
      CONFIG.TOKENS.user_access_token = loginResult.data.data.accessToken;
      CONFIG.TOKENS.user_refresh_token = loginResult.data.data.refreshToken;
      CONFIG.TEST_USER.userId = loginResult.data.data.user.id;
      
      console.log('   ✓ Login successful, User ID:', CONFIG.TEST_USER.userId);
      console.log('   ✓ Token set:', CONFIG.TOKENS.user_access_token ? 'Yes' : 'No');
      
      // Wait for async audit log
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const loginLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'LOGIN_SUCCESS');
      const verification = verifyAuditLog(loginLog, {
        action: 'LOGIN_SUCCESS',
        actorId: CONFIG.TEST_USER.userId,
        status: 'SUCCESS'
      });
      
      if (verification.exists && verification.correctAction) {
        passedTests++;
        printResult('User login audit log created', true, `Log ID: ${loginLog.id}`);
        console.log('   Metadata:', JSON.stringify(loginLog.metadata, null, 2));
      } else {
        printResult('User login audit log created', false, 'Log not found or incorrect');
        if (loginLog) console.log('   Log found but incorrect:', {action: loginLog.action, status: loginLog.status});
      }
    } else {
      const errorMsg = loginResult.error?.message || (typeof loginResult.error === 'object' ? JSON.stringify(loginResult.error) : loginResult.error) || 'Unknown error';
      printResult('User login audit log created', false, `Login failed: ${errorMsg} (Status: ${loginResult.status})`);
    }
    
    // Test 1.2: Admin Login
    console.log('\nTest 1.2: Admin Login Audit Log');
    const adminLoginResult = await apiRequest('POST', '/auth/login', {
      identifier: CONFIG.ADMIN_USER.mobile_number,
      password: CONFIG.ADMIN_USER.password
    });
    
    totalTests++;
    if (adminLoginResult.success) {
      CONFIG.TOKENS.admin_access_token = adminLoginResult.data.data.accessToken;
      CONFIG.TOKENS.admin_refresh_token = adminLoginResult.data.data.refreshToken;
      CONFIG.ADMIN_USER.userId = adminLoginResult.data.data.user.id;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const adminLoginLog = await getLatestAuditLog(CONFIG.ADMIN_USER.userId, 'LOGIN_SUCCESS');
      if (adminLoginLog) {
        passedTests++;
        printResult('Admin login audit log created', true, `Log ID: ${adminLoginLog.id}`);
      } else {
        printResult('Admin login audit log created', false, 'Log not found');
      }
    } else {
      const errorMsg = adminLoginResult.error?.message || (typeof adminLoginResult.error === 'object' ? JSON.stringify(adminLoginResult.error) : adminLoginResult.error) || 'Unknown error';
      printResult('Admin login audit log created', false, `Admin login failed: ${errorMsg} (Status: ${adminLoginResult.status})`);
    }
    
    // Test 1.3: Moderator Login
    console.log('\nTest 1.3: Moderator Login Audit Log');
    const moderatorLoginResult = await apiRequest('POST', '/auth/login', {
      identifier: CONFIG.MODERATOR_USER.mobile_number,
      password: CONFIG.MODERATOR_USER.password
    });
    
    totalTests++;
    if (moderatorLoginResult.success) {
      CONFIG.TOKENS.moderator_access_token = moderatorLoginResult.data.data.accessToken;
      CONFIG.TOKENS.moderator_refresh_token = moderatorLoginResult.data.data.refreshToken;
      CONFIG.MODERATOR_USER.userId = moderatorLoginResult.data.data.user.id;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const moderatorLoginLog = await getLatestAuditLog(CONFIG.MODERATOR_USER.userId, 'LOGIN_SUCCESS');
      if (moderatorLoginLog) {
        passedTests++;
        printResult('Moderator login audit log created', true, `Log ID: ${moderatorLoginLog.id}`);
      } else {
        printResult('Moderator login audit log created', false, 'Log not found');
      }
    } else {
      const errorMsg = moderatorLoginResult.error?.message || (typeof moderatorLoginResult.error === 'object' ? JSON.stringify(moderatorLoginResult.error) : moderatorLoginResult.error) || 'Unknown error';
      printResult('Moderator login audit log created', false, `Moderator login failed: ${errorMsg} (Status: ${moderatorLoginResult.status})`);
    }
    
    // Test 1.4: Logout
    console.log('\nTest 1.4: User Logout Audit Log');
    const logoutResult = await apiRequest('POST', '/auth/logout', {
      refresh_token: CONFIG.TOKENS.user_refresh_token
    }, CONFIG.TOKENS.user_access_token);
    
    totalTests++;
    if (logoutResult.success) {
      console.log('   ✓ Logout successful');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const logoutLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'LOGOUT');
      console.log('   DEBUG - Logout log:', logoutLog ? `Found: ${logoutLog.id}, metadata: ${JSON.stringify(logoutLog.metadata)}` : 'NOT FOUND');
      
      if (!logoutLog) {
        // Check what logs exist for this user
        const allUserLogs = await prisma.auditLog.findMany({
          where: { actor_id: CONFIG.TEST_USER.userId },
          orderBy: { created_at: 'desc' },
          take: 3,
          select: { id: true, action: true, action_type: true, created_at: true }
        });
        console.log('   DEBUG - Recent user logs after logout:', JSON.stringify(allUserLogs, null, 2));
      }
      
      if (logoutLog && logoutLog.metadata?.logout_type === 'single_device') {
        passedTests++;
        printResult('User logout audit log created', true, `Logout type: ${logoutLog.metadata.logout_type}`);
      } else {
        printResult('User logout audit log created', false, 'Log not found or incorrect metadata');
      }
      
      // Re-login for subsequent tests
      const relogin = await apiRequest('POST', '/auth/login', {
        identifier: CONFIG.TEST_USER.mobile_number,
        password: CONFIG.TEST_USER.password
      });
      CONFIG.TOKENS.user_access_token = relogin.data.data.accessToken;
      CONFIG.TOKENS.user_refresh_token = relogin.data.data.refreshToken;
    } else {
      const errorMsg = logoutResult.error?.message || (typeof logoutResult.error === 'object' ? JSON.stringify(logoutResult.error) : logoutResult.error) || 'Unknown error';
      printResult('User logout audit log created', false, `Logout failed: ${errorMsg} (Status: ${logoutResult.status})`);
    }
    
    // ============================================
    // SECTION 2: PHOTO OPERATIONS TESTS
    // ============================================
    printSection('SECTION 2: Photo Operations Audit Logs');
    
    // Test 2.1: Photo Upload
    console.log('Test 2.1: Photo Upload Audit Log');
    const uploadResult = await apiRequest('POST', `/users/${CONFIG.TEST_USER.userId}/photos`, {
      fileUrl: 'https://utfs.io/f/RoYaBfnm6KSJ123456789abcdef.jpg',
      visibility: 'PUBLIC'
    }, CONFIG.TOKENS.user_access_token);
    
    totalTests++;
    if (uploadResult.success) {
      CONFIG.RESOURCES.photoId = uploadResult.data.data.id;
      
      console.log('   ✓ Upload successful, Photo ID:', CONFIG.RESOURCES.photoId);
      console.log('   Response:', JSON.stringify(uploadResult.data, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const uploadLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'PROFILE_PHOTO_UPLOADED');
      console.log('   DEBUG - Upload log:', uploadLog ? `Found: ${uploadLog.id}` : 'NOT FOUND');
      if (!uploadLog) {
        // Check what logs exist for this user
        const allUserLogs = await prisma.auditLog.findMany({
          where: { actor_id: CONFIG.TEST_USER.userId },
          orderBy: { created_at: 'desc' },
          take: 5,
          select: { id: true, action: true, created_at: true, resource_type: true }
        });
        console.log('   DEBUG - Recent user logs:', JSON.stringify(allUserLogs, null, 2));
      }
      
      if (uploadLog && uploadLog.resource_type === 'PHOTO') {
        passedTests++;
        printResult('Photo upload audit log created', true, `Photo ID: ${CONFIG.RESOURCES.photoId}`);
      } else {
        printResult('Photo upload audit log created', false, 'Log not found');
      }
    } else {
      const errorMsg = uploadResult.error?.message || (typeof uploadResult.error === 'object' ? JSON.stringify(uploadResult.error) : uploadResult.error) || 'Unknown error';
      console.log('   Full error response:', JSON.stringify(uploadResult, null, 2));
      printResult('Photo upload audit log created', false, `Upload failed: ${errorMsg} (Status: ${uploadResult.status})`);
    }
    
    // Test 2.2: Photo Approval (Moderator)
    if (CONFIG.RESOURCES.photoId) {
      console.log('\nTest 2.2: Photo Approval Audit Log (Moderator)');
      const approveResult = await apiRequest(
        'PATCH',
        `/admin/photos/${CONFIG.RESOURCES.photoId}/approve`,
        {},
        CONFIG.TOKENS.moderator_access_token
      );
      
      totalTests++;
      if (approveResult.success) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const approveLog = await getLatestAuditLog(CONFIG.MODERATOR_USER.userId, 'ADMIN_PHOTO_APPROVED');
        if (approveLog && approveLog.target_user_id === CONFIG.TEST_USER.userId) {
          passedTests++;
          printResult('Photo approval audit log created', true, `Target user: ${approveLog.target_user_id}`);
        } else {
          printResult('Photo approval audit log created', false, 'Log not found or incorrect target');
        }
      } else {
        const errorMsg = approveResult.error?.message || (typeof approveResult.error === 'object' ? JSON.stringify(approveResult.error) : approveResult.error) || 'Unknown error';
        printResult('Photo approval audit log created', false, `Approval failed: ${errorMsg} (Status: ${approveResult.status})`);
      }
    }
    
    // Test 2.3: Photo Deletion
    if (CONFIG.RESOURCES.photoId) {
      console.log('\nTest 2.3: Photo Deletion Audit Log');
      const deleteResult = await apiRequest(
        'DELETE',
        `/users/${CONFIG.TEST_USER.userId}/photos/${CONFIG.RESOURCES.photoId}`,
        null,
        CONFIG.TOKENS.user_access_token
      );
      
      totalTests++;
      if (deleteResult.success) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const deleteLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'PROFILE_PHOTO_DELETED');
        if (deleteLog && deleteLog.metadata?.deleted_by_owner === true) {
          passedTests++;
          printResult('Photo deletion audit log created', true, 'Deleted by owner: true');
        } else {
          printResult('Photo deletion audit log created', false, 'Log not found or incorrect metadata');
        }
      } else {
        const errorMsg = deleteResult.error?.message || (typeof deleteResult.error === 'object' ? JSON.stringify(deleteResult.error) : deleteResult.error) || 'Unknown error';
        printResult('Photo deletion audit log created', false, `Deletion failed: ${errorMsg} (Status: ${deleteResult.status})`);
      }
    }
    
    // ============================================
    // SECTION 3: PROFILE UPDATE TESTS
    // ============================================
    printSection('SECTION 3: Profile Update Audit Logs');
    
    // Test 3.1: Personal Details Update
    console.log('Test 3.1: Personal Details Update Audit Log');
    const personalUpdateResult = await apiRequest(
      'PUT',
      `/users/${CONFIG.TEST_USER.userId}/personal`,
      {
        height: 176,
        weight: 71,
        marital_status: 'Never Married'
      },
      CONFIG.TOKENS.user_access_token
    );
    
    totalTests++;
    if (personalUpdateResult.success) {
      console.log('   ✓ Personal details update successful');
      console.log('   Response:', JSON.stringify(personalUpdateResult.data, null, 2));
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const personalLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'PERSONAL_DETAILS_UPDATED');
      console.log('   DEBUG - Personal log:', personalLog ? `Found: ${personalLog.id}` : 'NOT FOUND');
      
      if (!personalLog) {
        const allUserLogs = await prisma.auditLog.findMany({
          where: { actor_id: CONFIG.TEST_USER.userId },
          orderBy: { created_at: 'desc' },
          take: 3,
          select: { id: true, action: true, resource_type: true, created_at: true }
        });
        console.log('   DEBUG - Recent user logs:', JSON.stringify(allUserLogs, null, 2));
      }
      
      if (personalLog && personalLog.metadata?.fields_updated) {
        passedTests++;
        printResult('Personal details update audit log created', true, 
          `Fields: ${personalLog.metadata.fields_updated.join(', ')}`);
      } else {
        printResult('Personal details update audit log created', false, 'Log not found');
      }
    } else {
      const errorMsg = personalUpdateResult.error?.message || (typeof personalUpdateResult.error === 'object' ? JSON.stringify(personalUpdateResult.error) : personalUpdateResult.error) || 'Unknown error';
      console.log('   Full error response:', JSON.stringify(personalUpdateResult, null, 2));
      printResult('Personal details update audit log created', false, 
        `Update failed: ${errorMsg} (Status: ${personalUpdateResult.status})`);
    }
    
    // Test 3.2: Caste Details Update
    console.log('\nTest 3.2: Caste Details Update Audit Log');
    const casteUpdateResult = await apiRequest(
      'PUT',
      `/users/${CONFIG.TEST_USER.userId}/caste`,
      {
        religion_id: 1, // Adjust based on your data
        caste_id: 1
      },
      CONFIG.TOKENS.user_access_token
    );
    
    totalTests++;
    if (casteUpdateResult.success) {
      console.log('   ✓ Caste details update successful');
      console.log('   Response:', JSON.stringify(casteUpdateResult.data, null, 2));
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const casteLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'CASTE_DETAILS_UPDATED');
      console.log('   DEBUG - Caste log:', casteLog ? `Found: ${casteLog.id}` : 'NOT FOUND');
      
      if (!casteLog) {
        const allUserLogs = await prisma.auditLog.findMany({
          where: { actor_id: CONFIG.TEST_USER.userId },
          orderBy: { created_at: 'desc' },
          take: 3,
          select: { id: true, action: true, resource_type: true, created_at: true }
        });
        console.log('   DEBUG - Recent user logs:', JSON.stringify(allUserLogs, null, 2));
      }
      
      if (casteLog) {
        passedTests++;
        printResult('Caste details update audit log created', true, `Log ID: ${casteLog.id}`);
      } else {
        printResult('Caste details update audit log created', false, 'Log not found');
      }
    } else {
      const errorMsg = casteUpdateResult.error?.message || (typeof casteUpdateResult.error === 'object' ? JSON.stringify(casteUpdateResult.error) : casteUpdateResult.error) || 'Unknown error';
      console.log('   Full error response:', JSON.stringify(casteUpdateResult, null, 2));
      printResult('Caste details update audit log created', false, 
        `Update failed: ${errorMsg} (Status: ${casteUpdateResult.status})`);
    }
    
    // ============================================
    // SECTION 4: REPORT OPERATIONS TESTS
    // ============================================
    printSection('SECTION 4: Report Operations Audit Logs');
    
    // Test 4.1: User Report Submission
    if (CONFIG.TEST_USER_2.userId) {
      console.log('Test 4.1: User Report Submission Audit Log');
      const reportResult = await apiRequest(
        'POST',
        `/reports/${CONFIG.TEST_USER_2.userId}`,
        {
          category: 'FAKE_PROFILE',
          reason: 'Test report for audit logging verification'
        },
        CONFIG.TOKENS.user_access_token
      );
      
      totalTests++;
      if (reportResult.success) {
        CONFIG.RESOURCES.reportId = reportResult.data.data.report_id;
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const reportLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'USER_REPORTED');
        if (reportLog && reportLog.target_user_id === CONFIG.TEST_USER_2.userId) {
          passedTests++;
          printResult('Report submission audit log created', true, 
            `Report ID: ${CONFIG.RESOURCES.reportId}`);
        } else {
          printResult('Report submission audit log created', false, 'Log not found');
        }
      } else if (reportResult.status === 400 && reportResult.error?.message?.includes('already reported')) {
        // If already reported, check if audit log exists from previous run
        await new Promise(resolve => setTimeout(resolve, 1000));
        const reportLog = await getLatestAuditLog(CONFIG.TEST_USER.userId, 'USER_REPORTED');
        if (reportLog && reportLog.target_user_id === CONFIG.TEST_USER_2.userId) {
          passedTests++;
          printResult('Report submission audit log created', true, 
            `Previously reported - audit log exists`);
        } else {
          printResult('Report submission audit log created', false, 'Already reported but no audit log found');
        }
      } else {
        const errorMsg = reportResult.error?.message || (typeof reportResult.error === 'object' ? JSON.stringify(reportResult.error) : reportResult.error) || 'Unknown error';
        printResult('Report submission audit log created', false, 
          `Report failed: ${errorMsg} (Status: ${reportResult.status})`);
      }
    }
    
    // Test 4.2: Admin Report Status Update
    if (CONFIG.RESOURCES.reportId) {
      console.log('\nTest 4.2: Admin Report Status Update Audit Log');
      const statusUpdateResult = await apiRequest(
        'PUT',
        `/admin/reports/${CONFIG.RESOURCES.reportId}/status`,
        {
          status: 'RESOLVED',
          admin_notes: 'Report verified and resolved for audit log test'
        },
        CONFIG.TOKENS.admin_access_token
      );
      
      totalTests++;
      if (statusUpdateResult.success) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusLog = await getLatestAuditLog(CONFIG.ADMIN_USER.userId, 'ADMIN_REPORT_STATUS_UPDATED');
        if (statusLog && statusLog.metadata?.new_status === 'RESOLVED') {
          passedTests++;
          printResult('Report status update audit log created', true, 
            `New status: ${statusLog.metadata.new_status}`);
        } else {
          printResult('Report status update audit log created', false, 'Log not found');
        }
      } else {
        const errorMsg = statusUpdateResult.error?.message || (typeof statusUpdateResult.error === 'object' ? JSON.stringify(statusUpdateResult.error) : statusUpdateResult.error) || 'Unknown error';
        printResult('Report status update audit log created', false, 
          `Status update failed: ${errorMsg} (Status: ${statusUpdateResult.status})`);
      }
    }
    
    // ============================================
    // SECTION 5: AUDIT LOG RETRIEVAL TESTS
    // ============================================
    printSection('SECTION 5: Audit Log Retrieval & Verification');
    
    // Test 5.1: Get Audit Logs (Admin Endpoint)
    console.log('Test 5.1: Retrieve Audit Logs via Admin Endpoint');
    const getLogsResult = await apiRequest(
      'GET',
      `/admin/audit-logs?limit=10&action=LOGIN_SUCCESS`,
      null,
      CONFIG.TOKENS.admin_access_token
    );
    
    console.log('   DEBUG - Full response:', JSON.stringify(getLogsResult, null, 2));
    
    totalTests++;
    if (getLogsResult.success && getLogsResult.data?.data?.length > 0) {
      passedTests++;
      printResult('Admin audit logs retrieval', true, 
        `Retrieved ${getLogsResult.data.data.length} logs`);
      console.log('   Sample log:', JSON.stringify(getLogsResult.data.data[0], null, 2));
    } else {
      const errorMsg = getLogsResult.error?.message || (typeof getLogsResult.error === 'object' ? JSON.stringify(getLogsResult.error) : getLogsResult.error) || 'No logs found';
      printResult('Admin audit logs retrieval', false, 
        `Failed: ${errorMsg} (Status: ${getLogsResult.status})`);
    }
    
    // Test 5.2: Get Audit Statistics
    console.log('\nTest 5.2: Retrieve Audit Statistics');
    const statsResult = await apiRequest(
      'GET',
      '/admin/audit-logs/statistics',
      null,
      CONFIG.TOKENS.admin_access_token
    );
    
    console.log('   DEBUG - Full stats response:', JSON.stringify(statsResult, null, 2));
    
    totalTests++;
    if (statsResult.success && statsResult.data?.data?.total_logs > 0) {
      passedTests++;
      printResult('Audit statistics retrieval', true, 
        `Total logs: ${statsResult.data.data.total_logs}`);
      console.log('   By action type:', JSON.stringify(statsResult.data.data.by_action_type, null, 2));
    } else {
      const errorMsg = statsResult.error?.message || (typeof statsResult.error === 'object' ? JSON.stringify(statsResult.error) : statsResult.error) || 'Unknown error';
      printResult('Audit statistics retrieval', false, 
        `Failed: ${errorMsg} (Status: ${statsResult.status})`);
    }
    
    // Test 5.3: Verify PII Masking
    console.log('\nTest 5.3: Verify PII Masking in Audit Logs');
    const allLogs = await prisma.auditLog.findMany({
      where: {
        metadata: { not: null }
      },
      take: 10
    });
    
    totalTests++;
    let piiMaskingWorks = true;
    for (const log of allLogs) {
      const metadata = log.metadata;
      if (metadata) {
        // Check for unmasked sensitive data
        const sensitivePatterns = [
          /password[^_]/i,
          /otp_code/i,
          /\d{10,}/  // 10+ digit numbers (phone, card numbers)
        ];
        
        const metadataStr = JSON.stringify(metadata);
        for (const pattern of sensitivePatterns) {
          if (pattern.test(metadataStr)) {
            piiMaskingWorks = false;
            console.log('   ⚠️  Potential PII leak in log:', log.id);
            break;
          }
        }
      }
    }
    
    if (piiMaskingWorks) {
      passedTests++;
      printResult('PII masking verification', true, 'No sensitive data found in logs');
    } else {
      printResult('PII masking verification', false, 'Potential PII leak detected');
    }
    
    // Test 5.4: Verify IP Address Capture
    console.log('\nTest 5.4: Verify IP Address Capture');
    const logsWithIP = await prisma.auditLog.findMany({
      where: {
        ip_address: { not: null }
      },
      take: 5
    });
    
    totalTests++;
    if (logsWithIP.length > 0) {
      passedTests++;
      printResult('IP address capture', true, 
        `${logsWithIP.length} logs with IP addresses`);
      console.log('   Sample IPs:', logsWithIP.map(l => l.ip_address).join(', '));
    } else {
      printResult('IP address capture', false, 'No logs with IP addresses found');
    }
    
    // Test 5.5: Verify User Agent Capture
    console.log('\nTest 5.5: Verify User Agent Capture');
    const logsWithUA = await prisma.auditLog.findMany({
      where: {
        user_agent: { not: null }
      },
      take: 5
    });
    
    totalTests++;
    if (logsWithUA.length > 0) {
      passedTests++;
      printResult('User agent capture', true, 
        `${logsWithUA.length} logs with user agents`);
    } else {
      printResult('User agent capture', false, 'No logs with user agents found');
    }
    
  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup: disconnect Prisma
    await prisma.$disconnect();
  }
  
  // ============================================
  // FINAL RESULTS
  // ============================================
  printSection('TEST RESULTS SUMMARY');
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Audit logging system is working correctly.');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review the output above.`);
  }
  
  console.log('\nTest completed at:', new Date().toISOString());
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// ============================================
// RUN TESTS
// ============================================

// Check if credentials are provided
if (!CONFIG.TEST_USER.mobile_number || !CONFIG.TEST_USER.password) {
  console.error('❌ ERROR: Please provide test user credentials in CONFIG object');
  console.log('\nUpdate the following in CONFIG:');
  console.log('  - TEST_USER.mobile_number');
  console.log('  - TEST_USER.password');
  console.log('  - ADMIN_USER.mobile_number');
  console.log('  - ADMIN_USER.password');
  console.log('  - TEST_USER_2.userId (optional, for report tests)');
  process.exit(1);
}

// Run the test suite
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
