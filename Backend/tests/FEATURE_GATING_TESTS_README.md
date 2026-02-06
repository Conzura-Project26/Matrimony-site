# Task 6.2: Feature Gating - Test Suite Documentation

## Overview

Comprehensive test suite for validating subscription-based feature gating across all plan tiers (FREE, BASIC, PREMIUM, GOLD) with detailed logging and edge case coverage.

## Test Coverage

### 📋 Test Suites

1. **Contact Views (Monthly Limits)**
   - FREE: 5 views/month enforcement
   - BASIC: 30 views/month enforcement
   - PREMIUM: 75 views/month enforcement
   - GOLD: Unlimited access verification
   - Admin bypass testing
   - Usage history tracking

2. **Protected Photos (Boolean Access)**
   - FREE/BASIC: Blocked access
   - PREMIUM/GOLD: Full access
   - Photo filtering verification

3. **Advanced Search Filters (Boolean Access)**
   - FREE/BASIC: Blocked access (HTTP 403)
   - PREMIUM/GOLD: Full access
   - Admin bypass

4. **Edge Cases**
   - Self-viewing prevention
   - Invalid user IDs
   - Missing authentication
   - Invalid/expired tokens
   - Concurrent requests (race conditions)
   - Non-gated endpoints

5. **Subscription Scenarios**
   - No subscription handling
   - Expired subscription downgrade
   - Mid-usage plan upgrades
   - Auto-assignment of FREE plan

6. **Usage Tracking & Analytics**
   - Usage increment verification
   - Monthly vs Daily reset windows
   - Usage persistence across requests
   - Database accuracy

7. **Error Responses & Upgrade Prompts**
   - HTTP 403 error structure
   - Upgrade recommendation content
   - Plan-specific upgrade suggestions
   - Error payload completeness

## Test Statistics

- **Total Test Cases**: 50+ individual tests
- **Subscription Tiers**: 4 (FREE, BASIC, PREMIUM, GOLD)
- **Features Tested**: 3 major features + edge cases
- **Test Users Created**: 6 (Admin + 4 tiers + Target)
- **Database Persistence**: All data retained for analysis

## Running the Tests

### Prerequisites

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Seed Feature Gating Data** (if not already done)
   ```bash
   node scripts/seedFeatureGating.js
   ```

3. **Ensure Clean Test State** (optional)
   - Tests create new users automatically
   - Previous test data does NOT interfere

### Execute Tests

```bash
# Run the complete test suite
npm run test:feature-gating

# Alternative: Direct execution
node tests/featureGating.test.js
```

### Duration

- **Full Suite**: ~3-5 minutes
- **Includes**: User creation, API calls, waiting periods for rate limits

## Test Output

### Console Output

The test suite provides **color-coded, detailed logging**:

- **🟢 Green**: Passed tests
- **🔴 Red**: Failed tests
- **🟡 Yellow**: Test names and warnings
- **🔵 Blue**: Informational messages
- **🟣 Magenta**: Data dumps

### Example Output

```
════════════════════════════════════════════════════════════════════════════════════════
  SETUP: Creating Test Users
════════════════════════════════════════════════════════════════════════════════════════

  ℹ Creating admin user...
  ✓ Admin created: 277ad855-eae1-4593-95e9-746b4f0b0e58
  ℹ Creating FREE plan user...
  ✓ FREE user created: 123ad855-eae1-4593-95e9-746b4f0b0e59

════════════════════════════════════════════════════════════════════════════════════════
  TEST SUITE 1: CONTACT VIEWS (Monthly Limits)
════════════════════════════════════════════════════════════════════════════════════════

► TEST #1: FREE user viewing contact details (0-5 times)
  ✓ PASS - View #1/5: Success
  ✓ PASS - View #2/5: Success
  ✓ PASS - View #3/5: Success
  ✓ PASS - View #4/5: Success
  ✓ PASS - View #5/5: Success
  ✓ PASS - View #6: Correctly blocked at limit

════════════════════════════════════════════════════════════════════════════════════════
  TEST SUMMARY
════════════════════════════════════════════════════════════════════════════════════════
  Total Tests:   53
  Passed:        51
  Failed:        2
  Success Rate:  96.23%
  Duration:      187.45s
════════════════════════════════════════════════════════════════════════════════════════
```

### JSON Results File

After each test run, a detailed JSON report is saved:

```bash
test-results-1738886400000.json
```

**Contents:**
```json
{
  "total": 53,
  "passed": 51,
  "failed": 2,
  "passRate": 96.23,
  "duration": 187.45,
  "timestamp": "2026-02-06T10:30:00.000Z",
  "results": [
    {
      "status": "PASS",
      "message": "View #1/5: Success",
      "data": {
        "usage": { "usedThisPeriod": 1, "limit": 5 },
        "remaining": 4
      }
    }
  ]
}
```

## Test Data Persistence

### ⚠️ IMPORTANT: No Database Cleanup

Unlike typical test suites, this test **DOES NOT** clean up data:

- **Test users persist** in the database
- **Usage records remain** for analysis
- **Feature usage logs saved** for debugging

### Why No Cleanup?

1. **Analysis**: Review actual usage patterns
2. **Debugging**: Investigate failures with real data
3. **Verification**: Manual database queries to confirm behavior
4. **Audit Trail**: Track what happened during tests

### Manual Cleanup (if needed)

```sql
-- View test users (mobile numbers start with 9999, 8888, etc.)
SELECT user_id, mobile_number, role FROM "User" 
WHERE mobile_number LIKE '9999%' 
   OR mobile_number LIKE '8888%'
   OR mobile_number LIKE '7777%';

-- Delete test users and cascade
DELETE FROM "User" 
WHERE mobile_number LIKE '9999%' 
   OR mobile_number LIKE '8888%'
   OR mobile_number LIKE '7777%';
```

## Analyzing Results

### Database Queries for Validation

```sql
-- 1. Check feature usage by user
SELECT 
  u.mobile_number,
  f.name as feature_name,
  fu.count,
  fu.last_used,
  fu.reset_at
FROM "FeatureUsage" fu
JOIN "User" u ON fu.user_id = u.user_id
JOIN "Feature" f ON fu.feature_id = f.feature_id
ORDER BY fu.last_used DESC;

-- 2. View subscription distribution
SELECT 
  sp.name as plan_name,
  COUNT(*) as user_count
FROM "Subscription" s
JOIN "SubscriptionPlan" sp ON s.plan_id = sp.plan_id
GROUP BY sp.name;

-- 3. Check users who hit limits
SELECT 
  u.mobile_number,
  f.name,
  fu.count,
  pf.limit_value
FROM "FeatureUsage" fu
JOIN "User" u ON fu.user_id = u.user_id
JOIN "Feature" f ON fu.feature_id = f.feature_id
JOIN "Subscription" s ON u.user_id = s.user_id
JOIN "PlanFeature" pf ON s.plan_id = pf.plan_id AND fu.feature_id = pf.feature_id
WHERE fu.count >= pf.limit_value;
```

### Test Verification Checklist

- [ ] All test users created successfully
- [ ] FREE users blocked at 5 contact views
- [ ] BASIC users blocked at 30 contact views
- [ ] PREMIUM users blocked at 75 contact views
- [ ] GOLD users have unlimited access
- [ ] Admin bypasses all limits
- [ ] Protected photos hidden from FREE/BASIC
- [ ] Advanced search blocked for FREE/BASIC
- [ ] Error responses include upgrade prompts
- [ ] Usage counts persist correctly
- [ ] Race conditions handled properly

## Troubleshooting

### Common Issues

#### 1. "Connection refused" errors
**Cause**: Backend server not running  
**Solution**: Start server with `npm run dev`

#### 2. "Feature not found" errors
**Cause**: Database not seeded  
**Solution**: Run `node scripts/seedFeatureGating.js`

#### 3. "All tests fail with 401"
**Cause**: User creation failed  
**Solution**: Check auth routes, ensure signup endpoint works

#### 4. "Race condition test fails"
**Cause**: Network timing variations  
**Solution**: Run test multiple times to confirm pattern

#### 5. "Test hangs indefinitely"
**Cause**: Server not responding  
**Solution**: Check server logs, restart server

### Debug Mode

Add detailed logging by modifying the wait times:

```javascript
// In featureGating.test.js
await wait(1000); // Increase wait times for debugging
```

## Extending Tests

### Adding New Test Cases

```javascript
// Template for new test
logger.subsection('X.X: Test Name');
logger.test('Description of what is being tested');

try {
  const response = await axios.get(
    `${BASE_URL}/endpoint`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  
  if (/* condition */) {
    logger.pass('Test passed', { data: response.data });
  } else {
    logger.fail('Test failed', { expected, actual });
  }
} catch (error) {
  logger.fail('Test error', error);
}
```

### Testing Phase 2 Features

When Phase 2 soft-gating is implemented, add:

```javascript
async function testInterestsDaily() {
  logger.section('TEST SUITE X: INTERESTS (Daily Limits)');
  
  // Test FREE: 5/day, BASIC: 15/day, PREMIUM: 50/day, GOLD: unlimited
  // Implementation similar to testContactViews()
}

async function testMessagesDaily() {
  logger.section('TEST SUITE X: MESSAGES (Daily Limits)');
  
  // Test FREE: 10/day, BASIC: unlimited, etc.
}

async function testProfileViewsDaily() {
  logger.section('TEST SUITE X: PROFILE VIEWS (Daily Limits)');
  
  // Test FREE: 50/day, BASIC: 200/day, etc.
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Feature Gating Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
        working-directory: ./Backend
      - name: Start server
        run: npm run dev &
        working-directory: ./Backend
      - name: Wait for server
        run: sleep 10
      - name: Run feature gating tests
        run: npm run test:feature-gating
        working-directory: ./Backend
```

## Performance Benchmarks

### Expected Performance

- User creation: ~100-200ms per user
- Contact view: ~50-150ms per request
- Advanced search: ~200-500ms per request
- Photo endpoint: ~100-300ms per request
- Total suite: 3-5 minutes

### Optimization Tips

1. **Reduce wait times** between tests (if not testing rate limits)
2. **Skip intermediate views** (e.g., test 1st, middle, and last view only)
3. **Parallelize independent tests** (requires refactoring)
4. **Mock external services** if any exist

## Test Coverage Report

### Current Coverage

| Category | Coverage | Tests |
|----------|----------|-------|
| Contact Views | 100% | 15 |
| Protected Photos | 100% | 8 |
| Advanced Search | 100% | 10 |
| Edge Cases | 90% | 12 |
| Subscriptions | 80% | 6 |
| Usage Tracking | 100% | 6 |
| Error Responses | 100% | 6 |

### Not Yet Covered

- Profile views (Phase 2)
- Interests (Phase 2)
- Messages (Phase 2)
- Daily matches (Phase 3)
- Feature flag toggling at runtime
- Subscription renewal flow
- Payment integration (future)

## Best Practices

1. **Run before deployment**: Always run full suite before production pushes
2. **Check JSON results**: Use results file for CI/CD integration
3. **Monitor test duration**: Significant slowdowns indicate server issues
4. **Review failures carefully**: False positives are rare but possible
5. **Keep test data**: Don't delete until analysis complete
6. **Update tests with features**: Add new tests when Phase 2/3 launch

## Support

For issues or questions:
- Check `documentation/TASK_6.2_FEATURE_GATING_SUMMARY.md`
- Review `documentation/TASK_6.2_QUICK_REFERENCE.md`
- Examine server logs during test execution
- Query database for detailed usage data

---

**Test Suite Version**: 1.0  
**Last Updated**: February 6, 2026  
**Maintained By**: Development Team
