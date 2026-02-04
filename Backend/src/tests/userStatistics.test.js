/**
 * Test Suite for Task 5.2: User Statistics
 * 
 * Tests all 15 statistics endpoints with comprehensive coverage
 * Target: 100% pass rate (industry standard)
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ADMIN_MOBILE = '9380245433';
const ADMIN_PASSWORD = 'Harsha@2004';
const USER_MOBILE = '9380245434'; // Regular user for authorization tests
const USER_PASSWORD = 'Test@1234';

let adminToken = null;
let userToken = null;

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper: Login and get admin token
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: ADMIN_MOBILE,
      password: ADMIN_PASSWORD
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper: Login as regular user
async function loginAsUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: USER_MOBILE,
      password: USER_PASSWORD
    });
    return response.data.data.accessToken;
  } catch (error) {
    // User might not exist, that's okay for tests
    return null;
  }
}

// Helper: Make authenticated request
async function makeRequest(method, url, data = null, params = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };
    
    // Only add auth header if token is provided (not null)
    // If token is explicitly passed (even empty string), use it; otherwise use adminToken
    if (token !== null) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If token is '' (empty string), don't add Authorization header at all
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    if (data) config.data = data;
    if (params) config.params = params;
    
    const response = await axios(config);
    return response;
  } catch (error) {
    throw error;
  }
}

// Helper: Assert helper
function assert(condition, testName, expected, actual) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    results.passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Actual: ${JSON.stringify(actual)}`);
    results.failed++;
    results.errors.push({ test: testName, expected, actual });
  }
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('\n========================================');
  console.log('TASK 5.2: USER STATISTICS TEST SUITE');
  console.log('========================================\n');

  try {
    // Login
    console.log('📝 Phase 1: Authentication');
    adminToken = await loginAsAdmin();
    assert(!!adminToken, 'Admin login successful', 'token', adminToken ? 'received' : 'null');

    // ============================================
    // Test 1: Dashboard Statistics
    // ============================================
    console.log('\n📊 Phase 2: Dashboard Statistics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/dashboard');
      assert(response.status === 200, 'Test 1.1: Get dashboard statistics (200)', 200, response.status);
      assert(response.data.success === true, 'Test 1.2: Dashboard success flag', true, response.data.success);
      assert(!!response.data.data.user_summary, 'Test 1.3: Dashboard has user_summary', true, !!response.data.data.user_summary);
      assert(!!response.data.data.gender_distribution, 'Test 1.4: Dashboard has gender_distribution', true, !!response.data.data.gender_distribution);
      assert(!!response.data.data.active_users_7d, 'Test 1.5: Dashboard has active_users_7d', true, !!response.data.data.active_users_7d);
      assert(!!response.data.metadata.generated_at, 'Test 1.6: Dashboard has metadata.generated_at', true, !!response.data.metadata.generated_at);
    } catch (error) {
      assert(false, 'Test 1: Dashboard statistics', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 2: User Summary
    // ============================================
    console.log('\n👥 Phase 3: User Summary Statistics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/summary');
      assert(response.status === 200, 'Test 2.1: Get user summary (200)', 200, response.status);
      assert(typeof response.data.data.total_users === 'number', 'Test 2.2: Total users is number', 'number', typeof response.data.data.total_users);
      assert(!!response.data.data.by_status, 'Test 2.3: Has by_status breakdown', true, !!response.data.data.by_status);
      assert(!!response.data.data.by_verification, 'Test 2.4: Has by_verification breakdown', true, !!response.data.data.by_verification);
      assert(!!response.data.data.by_role, 'Test 2.5: Has by_role breakdown', true, !!response.data.data.by_role);
      assert(!!response.data.data.by_completion_range, 'Test 2.6: Has by_completion_range breakdown', true, !!response.data.data.by_completion_range);
    } catch (error) {
      assert(false, 'Test 2: User summary', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 3: Users by Gender
    // ============================================
    console.log('\n⚧️ Phase 4: Gender Distribution');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/by-gender');
      assert(response.status === 200, 'Test 3.1: Get users by gender (200)', 200, response.status);
      assert(typeof response.data.data.total === 'number', 'Test 3.2: Total is number', 'number', typeof response.data.data.total);
      assert(!!response.data.data.distribution, 'Test 3.3: Has distribution', true, !!response.data.data.distribution);
      
      // Test with filters
      const filtered = await makeRequest('GET', '/admin/statistics/users/by-gender', null, { is_active: true });
      assert(filtered.status === 200, 'Test 3.4: Gender with is_active filter (200)', 200, filtered.status);
    } catch (error) {
      assert(false, 'Test 3: Users by gender', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 4: Users by Religion
    // ============================================
    console.log('\n🕉️ Phase 5: Religion Distribution');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/by-religion');
      assert(response.status === 200, 'Test 4.1: Get users by religion (200)', 200, response.status);
      assert(typeof response.data.data.total === 'number', 'Test 4.2: Total is number', 'number', typeof response.data.data.total);
      assert(!!response.data.data.distribution, 'Test 4.3: Has distribution', true, !!response.data.data.distribution);
      
      // Test with gender filter
      const filtered = await makeRequest('GET', '/admin/statistics/users/by-religion', null, { gender: 'Male' });
      assert(filtered.status === 200, 'Test 4.4: Religion with gender filter (200)', 200, filtered.status);
    } catch (error) {
      assert(false, 'Test 4: Users by religion', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 5: Users by Location
    // ============================================
    console.log('\n🌍 Phase 6: Geographic Distribution');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/by-location');
      assert(response.status === 200, 'Test 5.1: Get users by location (200)', 200, response.status);
      assert(!!response.data.data.by_state, 'Test 5.2: Has by_state', true, !!response.data.data.by_state);
      assert(Array.isArray(response.data.data.top_cities), 'Test 5.3: top_cities is array', true, Array.isArray(response.data.data.top_cities));
      
      // Test with custom top_cities
      const custom = await makeRequest('GET', '/admin/statistics/users/by-location', null, { top_cities: 5 });
      assert(custom.status === 200, 'Test 5.4: Location with custom top_cities (200)', 200, custom.status);
      assert(custom.data.data.top_cities.length <= 5, 'Test 5.5: Top cities respects limit', true, custom.data.data.top_cities.length <= 5);
    } catch (error) {
      assert(false, 'Test 5: Users by location', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 6: Users by Age
    // ============================================
    console.log('\n📅 Phase 7: Age Distribution');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/by-age');
      assert(response.status === 200, 'Test 6.1: Get users by age (200)', 200, response.status);
      assert(!!response.data.data.distribution, 'Test 6.2: Has distribution', true, !!response.data.data.distribution);
      assert(!!response.data.data.average_age, 'Test 6.3: Has average_age', true, !!response.data.data.average_age);
      assert(typeof response.data.data.distribution['18_25'] === 'number', 'Test 6.4: Has 18_25 bucket', 'number', typeof response.data.data.distribution['18_25']);
    } catch (error) {
      assert(false, 'Test 6: Users by age', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 7: Users by Marital Status
    // ============================================
    console.log('\n💑 Phase 8: Marital Status Distribution');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/by-marital-status');
      assert(response.status === 200, 'Test 7.1: Get users by marital status (200)', 200, response.status);
      assert(typeof response.data.data.total === 'number', 'Test 7.2: Total is number', 'number', typeof response.data.data.total);
      assert(!!response.data.data.distribution, 'Test 7.3: Has distribution', true, !!response.data.data.distribution);
    } catch (error) {
      assert(false, 'Test 7: Users by marital status', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 8: Profile Completion
    // ============================================
    console.log('\n📝 Phase 9: Profile Completion Statistics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/profile-completion');
      assert(response.status === 200, 'Test 8.1: Get profile completion (200)', 200, response.status);
      assert(typeof response.data.data.average_completion === 'number', 'Test 8.2: Average completion is number', 'number', typeof response.data.data.average_completion);
      assert(!!response.data.data.distribution, 'Test 8.3: Has distribution', true, !!response.data.data.distribution);
    } catch (error) {
      assert(false, 'Test 8: Profile completion', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 9: Verification Statistics
    // ============================================
    console.log('\n✅ Phase 10: Verification Statistics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/verification');
      assert(response.status === 200, 'Test 9.1: Get verification stats (200)', 200, response.status);
      assert(!!response.data.data.email_verified, 'Test 9.2: Has email_verified', true, !!response.data.data.email_verified);
      assert(!!response.data.data.mobile_verified, 'Test 9.3: Has mobile_verified', true, !!response.data.data.mobile_verified);
      assert(!!response.data.data.profile_verified, 'Test 9.4: Has profile_verified', true, !!response.data.data.profile_verified);
    } catch (error) {
      assert(false, 'Test 9: Verification statistics', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 10: Registration Trends
    // ============================================
    console.log('\n📈 Phase 11: Registration Trends');
    try {
      // Default (daily)
      const daily = await makeRequest('GET', '/admin/statistics/registrations');
      assert(daily.status === 200, 'Test 10.1: Get registrations daily (200)', 200, daily.status);
      assert(daily.data.data.period === 'daily', 'Test 10.2: Period is daily', 'daily', daily.data.data.period);
      assert(Array.isArray(daily.data.data.data), 'Test 10.3: Data is array', true, Array.isArray(daily.data.data.data));
      
      // Weekly
      const weekly = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'weekly' });
      assert(weekly.status === 200, 'Test 10.4: Get registrations weekly (200)', 200, weekly.status);
      
      // Monthly
      const monthly = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'monthly' });
      assert(monthly.status === 200, 'Test 10.5: Get registrations monthly (200)', 200, monthly.status);
      
      // With grouping
      const grouped = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'daily', group_by: 'gender' });
      assert(grouped.status === 200, 'Test 10.6: Registrations with gender grouping (200)', 200, grouped.status);
    } catch (error) {
      assert(false, 'Test 10: Registration trends', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 11: Active Users Summary
    // ============================================
    console.log('\n🔥 Phase 12: Active Users Summary');
    try {
      // 7-day window (default)
      const response = await makeRequest('GET', '/admin/statistics/users/active/summary');
      assert(response.status === 200, 'Test 11.1: Get active users 7d (200)', 200, response.status);
      assert(response.data.data.window === '7d', 'Test 11.2: Window is 7d', '7d', response.data.data.window);
      assert(typeof response.data.data.active_users === 'number', 'Test 11.3: Active users is number', 'number', typeof response.data.data.active_users);
      
      // 1-day window
      const day1 = await makeRequest('GET', '/admin/statistics/users/active/summary', null, { window: '1d' });
      assert(day1.status === 200, 'Test 11.4: Get active users 1d (200)', 200, day1.status);
      
      // 30-day window
      const day30 = await makeRequest('GET', '/admin/statistics/users/active/summary', null, { window: '30d' });
      assert(day30.status === 200, 'Test 11.5: Get active users 30d (200)', 200, day30.status);
    } catch (error) {
      assert(false, 'Test 11: Active users summary', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 12: Active Users Trend
    // ============================================
    console.log('\n📊 Phase 13: Active Users Trend');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/active/trend');
      assert(response.status === 200, 'Test 12.1: Get active users trend (200)', 200, response.status);
      assert(Array.isArray(response.data.data.data), 'Test 12.2: Trend data is array', true, Array.isArray(response.data.data.data));
      assert(response.data.data.window === '7d', 'Test 12.3: Default window is 7d', '7d', response.data.data.window);
      
      // With custom parameters
      const custom = await makeRequest('GET', '/admin/statistics/users/active/trend', null, { window: '30d', period: 'weekly' });
      assert(custom.status === 200, 'Test 12.4: Active users trend with custom params (200)', 200, custom.status);
    } catch (error) {
      assert(false, 'Test 12: Active users trend', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 13: Active Users Demographics
    // ============================================
    console.log('\n👤 Phase 14: Active Users Demographics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/active/demographics');
      assert(response.status === 200, 'Test 13.1: Get active demographics (200)', 200, response.status);
      assert(!!response.data.data.by_gender, 'Test 13.2: Has by_gender', true, !!response.data.data.by_gender);
      assert(!!response.data.data.by_age_group, 'Test 13.3: Has by_age_group', true, !!response.data.data.by_age_group);
      assert(typeof response.data.data.total_active_users === 'number', 'Test 13.4: Total active users is number', 'number', typeof response.data.data.total_active_users);
    } catch (error) {
      assert(false, 'Test 13: Active users demographics', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 14: Engagement Metrics
    // ============================================
    console.log('\n💬 Phase 15: Engagement Metrics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/engagement');
      assert(response.status === 200, 'Test 14.1: Get engagement metrics (200)', 200, response.status);
      assert(typeof response.data.data.profile_views === 'number', 'Test 14.2: Profile views is number', 'number', typeof response.data.data.profile_views);
      assert(typeof response.data.data.interests_sent === 'number', 'Test 14.3: Interests sent is number', 'number', typeof response.data.data.interests_sent);
      assert(typeof response.data.data.messages_sent === 'number', 'Test 14.4: Messages sent is number', 'number', typeof response.data.data.messages_sent);
      assert(typeof response.data.data.shortlists_made === 'number', 'Test 14.5: Shortlists made is number', 'number', typeof response.data.data.shortlists_made);
    } catch (error) {
      assert(false, 'Test 14: Engagement metrics', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 15: Retention Metrics
    // ============================================
    console.log('\n📉 Phase 16: Retention Metrics');
    try {
      const response = await makeRequest('GET', '/admin/statistics/users/retention');
      assert(response.status === 200, 'Test 15.1: Get retention metrics (200)', 200, response.status);
      assert(!!response.data.data.day_1, 'Test 15.2: Has day_1', true, !!response.data.data.day_1);
      assert(!!response.data.data.day_7, 'Test 15.3: Has day_7', true, !!response.data.data.day_7);
      assert(!!response.data.data.day_30, 'Test 15.4: Has day_30', true, !!response.data.data.day_30);
      assert(typeof response.data.data.day_1.retention_rate === 'number', 'Test 15.5: Day 1 retention rate is number', 'number', typeof response.data.data.day_1.retention_rate);
    } catch (error) {
      assert(false, 'Test 15: Retention metrics', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 16: Authorization Tests
    // ============================================
    console.log('\n🔒 Phase 17: Authorization & Validation');
    try {
      // Invalid date range (exceeds limit)
      try {
        const invalidRange = await makeRequest('GET', '/admin/statistics/registrations', null, {
          period: 'daily',
          from: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        });
        assert(false, 'Test 16.1: Invalid date range should fail (400)', 400, invalidRange.status);
      } catch (error) {
        assert(error.response?.status === 400, 'Test 16.1: Invalid date range rejected (400)', 400, error.response?.status);
      }
      
      // Invalid window value
      try {
        const invalidWindow = await makeRequest('GET', '/admin/statistics/users/active/summary', null, { window: '99d' });
        assert(false, 'Test 16.2: Invalid window should fail (400)', 400, invalidWindow.status);
      } catch (error) {
        assert(error.response?.status === 400, 'Test 16.2: Invalid window rejected (400)', 400, error.response?.status);
      }
      
      // Invalid period value
      try {
        const invalidPeriod = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'yearly' });
        assert(false, 'Test 16.3: Invalid period should fail (400)', 400, invalidPeriod.status);
      } catch (error) {
        assert(error.response?.status === 400, 'Test 16.3: Invalid period rejected (400)', 400, error.response?.status);
      }
      
      // Invalid group_by value
      try {
        const invalidGroupBy = await makeRequest('GET', '/admin/statistics/registrations', null, { group_by: 'invalid' });
        assert(false, 'Test 16.4: Invalid group_by should fail (400)', 400, invalidGroupBy.status);
      } catch (error) {
        assert(error.response?.status === 400, 'Test 16.4: Invalid group_by rejected (400)', 400, error.response?.status);
      }
      
      // top_cities below minimum
      try {
        const tooFewCities = await makeRequest('GET', '/admin/statistics/users/by-location', null, { top_cities: 3 });
        assert(false, 'Test 16.5: top_cities < 5 should fail (400)', 400, tooFewCities.status);
      } catch (error) {
        assert(error.response?.status === 400, 'Test 16.5: top_cities < 5 rejected (400)', 400, error.response?.status);
      }
      
      // top_cities above maximum
      try {
        const tooManyCities = await makeRequest('GET', '/admin/statistics/users/by-location', null, { top_cities: 25 });
        assert(false, 'Test 16.6: top_cities > 20 should fail (400)', 400, tooManyCities.status);
      } catch (error) {
        assert(error.response?.status === 400, 'Test 16.6: top_cities > 20 rejected (400)', 400, error.response?.status);
      }
    } catch (error) {
      console.log('    ⚠️  Validation tests encountered errors');
    }

    // ============================================
    // Test 17: Unauthorized Access (No Token)
    // ============================================
    console.log('\n🚫 Phase 18: Unauthorized Access');
    try {
      // No token
      try {
        const noAuth = await makeRequest('GET', '/admin/statistics/dashboard', null, null, '');
        assert(false, 'Test 17.1: No token should fail (401)', 401, noAuth.status);
      } catch (error) {
        assert(error.response?.status === 401, 'Test 17.1: No token rejected (401)', 401, error.response?.status);
      }
      
      // Invalid token
      try {
        const badToken = await makeRequest('GET', '/admin/statistics/users/summary', null, null, 'invalid-token-12345');
        assert(false, 'Test 17.2: Invalid token should fail (401)', 401, badToken.status);
      } catch (error) {
        assert(error.response?.status === 401, 'Test 17.2: Invalid token rejected (401)', 401, error.response?.status);
      }
    } catch (error) {
      console.log('    ⚠️  Unauthorized access tests encountered errors');
    }

    // ============================================
    // Test 18: Forbidden Access (USER role)
    // ============================================
    console.log('\n🔐 Phase 19: Forbidden Access (USER Role)');
    try {
      // Try to login as regular user
      userToken = await loginAsUser();
      
      if (userToken) {
        // Test with USER role (should be forbidden)
        try {
          const userAccess = await makeRequest('GET', '/admin/statistics/dashboard', null, null, userToken);
          assert(false, 'Test 18.1: USER role should be forbidden (403)', 403, userAccess.status);
        } catch (error) {
          assert(error.response?.status === 403, 'Test 18.1: USER role rejected (403)', 403, error.response?.status);
        }
        
        try {
          const userSummary = await makeRequest('GET', '/admin/statistics/users/summary', null, null, userToken);
          assert(false, 'Test 18.2: USER role forbidden on summary (403)', 403, userSummary.status);
        } catch (error) {
          assert(error.response?.status === 403, 'Test 18.2: USER role forbidden on summary (403)', 403, error.response?.status);
        }
      } else {
        console.log('    ⚠️  Regular user not available, skipping USER role tests');
      }
    } catch (error) {
      console.log('    ⚠️  Forbidden access tests skipped');
    }

    // ============================================
    // Test 19: Custom Date Ranges (Valid)
    // ============================================
    console.log('\n📅 Phase 20: Custom Date Ranges');
    try {
      // Valid daily range (30 days)
      const validDaily = await makeRequest('GET', '/admin/statistics/registrations', null, {
        period: 'daily',
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      });
      assert(validDaily.status === 200, 'Test 19.1: Valid 30-day range (200)', 200, validDaily.status);
      
      // Valid weekly range (12 weeks = 84 days)
      const validWeekly = await makeRequest('GET', '/admin/statistics/registrations', null, {
        period: 'weekly',
        from: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      });
      assert(validWeekly.status === 200, 'Test 19.2: Valid 84-day weekly range (200)', 200, validWeekly.status);
      
      // Valid monthly range (365 days)
      const validMonthly = await makeRequest('GET', '/admin/statistics/registrations', null, {
        period: 'monthly',
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      });
      assert(validMonthly.status === 200, 'Test 19.3: Valid 365-day monthly range (200)', 200, validMonthly.status);
    } catch (error) {
      assert(false, 'Test 19: Custom date ranges', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 20: All Grouping Options
    // ============================================
    console.log('\n📊 Phase 21: All Grouping Dimensions');
    try {
      // Group by gender
      const byGender = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'daily', group_by: 'gender' });
      assert(byGender.status === 200, 'Test 20.1: Group by gender (200)', 200, byGender.status);
      
      // Group by religion
      const byReligion = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'daily', group_by: 'religion' });
      assert(byReligion.status === 200, 'Test 20.2: Group by religion (200)', 200, byReligion.status);
      
      // Group by created_by
      const byCreatedBy = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'daily', group_by: 'created_by' });
      assert(byCreatedBy.status === 200, 'Test 20.3: Group by created_by (200)', 200, byCreatedBy.status);
      
      // Group by completion_bucket
      const byCompletion = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'daily', group_by: 'completion_bucket' });
      assert(byCompletion.status === 200, 'Test 20.4: Group by completion_bucket (200)', 200, byCompletion.status);
      
      // No grouping
      const noGroup = await makeRequest('GET', '/admin/statistics/registrations', null, { period: 'daily', group_by: 'none' });
      assert(noGroup.status === 200, 'Test 20.5: No grouping (200)', 200, noGroup.status);
    } catch (error) {
      assert(false, 'Test 20: All grouping options', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 21: All Filter Combinations
    // ============================================
    console.log('\n🔍 Phase 22: Filter Combinations');
    try {
      // Gender with active filter
      const genderActive = await makeRequest('GET', '/admin/statistics/users/by-gender', null, { is_active: true, is_profile_verified: true });
      assert(genderActive.status === 200, 'Test 21.1: Gender with multiple filters (200)', 200, genderActive.status);
      
      // Religion with gender filter
      const religionGender = await makeRequest('GET', '/admin/statistics/users/by-religion', null, { gender: 'Female', is_active: true });
      assert(religionGender.status === 200, 'Test 21.2: Religion with gender filter (200)', 200, religionGender.status);
      
      // Gender inactive only
      const genderInactive = await makeRequest('GET', '/admin/statistics/users/by-gender', null, { is_active: false });
      assert(genderInactive.status === 200, 'Test 21.3: Gender inactive filter (200)', 200, genderInactive.status);
      
      // Religion unverified
      const religionUnverified = await makeRequest('GET', '/admin/statistics/users/by-religion', null, { is_active: false });
      assert(religionUnverified.status === 200, 'Test 21.4: Religion with is_active=false (200)', 200, religionUnverified.status);
    } catch (error) {
      assert(false, 'Test 21: Filter combinations', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 22: Response Structure Validation
    // ============================================
    console.log('\n📋 Phase 23: Response Structure Validation');
    try {
      const dashboard = await makeRequest('GET', '/admin/statistics/dashboard');
      
      // Check standard response structure
      assert(dashboard.data.hasOwnProperty('success'), 'Test 22.1: Has success field', true, dashboard.data.hasOwnProperty('success'));
      assert(dashboard.data.hasOwnProperty('message'), 'Test 22.2: Has message field', true, dashboard.data.hasOwnProperty('message'));
      assert(dashboard.data.hasOwnProperty('data'), 'Test 22.3: Has data field', true, dashboard.data.hasOwnProperty('data'));
      assert(dashboard.data.hasOwnProperty('metadata'), 'Test 22.4: Has metadata field', true, dashboard.data.hasOwnProperty('metadata'));
      
      // Check metadata structure
      const metadata = dashboard.data.metadata;
      assert(metadata.hasOwnProperty('generated_at'), 'Test 22.5: Metadata has generated_at', true, metadata.hasOwnProperty('generated_at'));
      assert(metadata.hasOwnProperty('cache_status'), 'Test 22.6: Metadata has cache_status', true, metadata.hasOwnProperty('cache_status'));
      
      // Validate ISO date format
      const isValidDate = !isNaN(Date.parse(metadata.generated_at));
      assert(isValidDate, 'Test 22.7: generated_at is valid ISO date', true, isValidDate);
    } catch (error) {
      assert(false, 'Test 22: Response structure validation', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 23: All Window Options
    // ============================================
    console.log('\n⏱️ Phase 24: All Activity Windows');
    try {
      // Test all windows for active users summary
      const windows = ['1d', '7d', '30d'];
      for (const window of windows) {
        const response = await makeRequest('GET', '/admin/statistics/users/active/summary', null, { window });
        assert(response.status === 200, `Test 23.${windows.indexOf(window) + 1}: Active users ${window} window (200)`, 200, response.status);
        assert(response.data.data.window === window, `Test 23.${windows.indexOf(window) + 4}: Window matches ${window}`, window, response.data.data.window);
      }
    } catch (error) {
      assert(false, 'Test 23: All window options', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 24: Edge Case - Empty Results Handling
    // ============================================
    console.log('\n🗂️ Phase 25: Empty Results Handling');
    try {
      // Test with filters that might return empty results
      const emptyFilter = await makeRequest('GET', '/admin/statistics/users/by-religion', null, { 
        gender: 'Other', 
        is_active: false 
      });
      assert(emptyFilter.status === 200, 'Test 24.1: Empty filter results (200)', 200, emptyFilter.status);
      assert(emptyFilter.data.success === true, 'Test 24.2: Empty results still successful', true, emptyFilter.data.success);
      assert(typeof emptyFilter.data.data.total === 'number', 'Test 24.3: Total is number even if 0', 'number', typeof emptyFilter.data.data.total);
    } catch (error) {
      assert(false, 'Test 24: Empty results handling', 200, error.response?.status || error.message);
    }

    // ============================================
    // Test 25: Percentage Calculations
    // ============================================
    console.log('\n🧮 Phase 26: Percentage Calculations');
    try {
      const gender = await makeRequest('GET', '/admin/statistics/users/by-gender');
      
      // Check that percentages are present and valid
      const distribution = gender.data.data.distribution;
      let totalPercentage = 0;
      
      Object.values(distribution).forEach(item => {
        assert(typeof item.percentage === 'number', 'Test 25.1: Percentage is number', 'number', typeof item.percentage);
        assert(item.percentage >= 0 && item.percentage <= 100, 'Test 25.2: Percentage in valid range', true, item.percentage >= 0 && item.percentage <= 100);
        totalPercentage += item.percentage;
      });
      
      // Percentages should roughly sum to 100 (allowing for rounding)
      assert(Math.abs(totalPercentage - 100) < 1, 'Test 25.3: Percentages sum to ~100', true, Math.abs(totalPercentage - 100) < 1);
    } catch (error) {
      assert(false, 'Test 25: Percentage calculations', 200, error.response?.status || error.message);
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  console.log(`📈 Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (results.failed > 0) {
    console.log('Failed Tests Details:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
    });
    console.log('');
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
