# 🧪 TASK 6.2 TESTING GUIDE

## Quick Start

### 1. Prerequisites Check

```bash
# Ensure server is running
npm run dev

# Ensure feature gating is seeded (one-time)
node scripts/seedFeatureGating.js
```

### 2. Run Tests

```bash
# Option 1: With pre-flight checks (RECOMMENDED)
node tests/runFeatureGatingTests.js

# Option 2: Direct execution
npm run test:feature-gating

# Option 3: Alternative
node tests/featureGating.test.js
```

### 3. Review Results

- **Console Output**: Detailed colored logs during execution
- **JSON File**: `test-results-{timestamp}.json` saved after completion
- **Database**: All test data persists for analysis

---

## Test Execution Flow

```
┌─────────────────────────────────────────┐
│  Pre-Flight Checks                      │
│  - Server running?                      │
│  - Database connected?                  │
│  - Features seeded?                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Setup Phase (2-3 minutes)              │
│  - Create Admin user                    │
│  - Create FREE user (default)           │
│  - Create BASIC user + assign plan      │
│  - Create PREMIUM user + assign plan    │
│  - Create GOLD user + assign plan       │
│  - Create Target user (for viewing)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 1: Contact Views            │
│  - Test FREE limit (5/month)            │
│  - Test BASIC limit (30/month)          │
│  - Test PREMIUM limit (75/month)        │
│  - Test GOLD unlimited                  │
│  - Test Admin bypass                    │
│  - Test usage history                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 2: Protected Photos         │
│  - Test FREE blocked                    │
│  - Test BASIC blocked                   │
│  - Test PREMIUM allowed                 │
│  - Test GOLD allowed                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 3: Advanced Search          │
│  - Test FREE blocked (403)              │
│  - Test BASIC blocked (403)             │
│  - Test PREMIUM allowed                 │
│  - Test GOLD allowed                    │
│  - Test Admin bypass                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 4: Edge Cases               │
│  - Self-viewing prevention              │
│  - Invalid user ID handling             │
│  - Missing auth token                   │
│  - Invalid token                        │
│  - Concurrent requests (race)           │
│  - Non-gated endpoints                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 5: Subscription Scenarios   │
│  - No subscription (auto-FREE)          │
│  - Expired subscription                 │
│  - Mid-usage plan upgrade               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 6: Usage Tracking           │
│  - Usage increment verification         │
│  - Reset window validation              │
│  - Usage persistence                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Test Suite 7: Error Responses          │
│  - 403 error structure                  │
│  - Upgrade recommendations              │
│  - Plan-specific suggestions            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Results Summary                        │
│  - Total tests run                      │
│  - Pass/Fail counts                     │
│  - Success rate %                       │
│  - Duration                             │
│  - JSON file saved                      │
└─────────────────────────────────────────┘
```

---

## Expected Output

### ✅ Successful Test Run

```
════════════════════════════════════════════════════════════════════════════════════════
║  TEST SUMMARY                                                                        ║
════════════════════════════════════════════════════════════════════════════════════════
  Total Tests:   53
  Passed:        53
  Failed:        0
  Success Rate:  100.00%
  Duration:      187.45s
════════════════════════════════════════════════════════════════════════════════════════

  ℹ Detailed results saved to: test-results-1738886400000.json
  ℹ All test data persists in database for analysis
```

### ⚠️ Test with Failures

```
════════════════════════════════════════════════════════════════════════════════════════
║  TEST SUMMARY                                                                        ║
════════════════════════════════════════════════════════════════════════════════════════
  Total Tests:   53
  Passed:        51
  Failed:        2
  Success Rate:  96.23%
  Duration:      189.12s
════════════════════════════════════════════════════════════════════════════════════════

  ✗ FAIL - View #31: Should have been blocked but succeeded!
  ✗ FAIL - BASIC user was able to use advanced search!
```

---

## Test Coverage Matrix

| Feature | FREE | BASIC | PREMIUM | GOLD | Admin | Edge Cases |
|---------|------|-------|---------|------|-------|------------|
| **Contact Views** | ✅ Tested (5) | ✅ Tested (30) | ✅ Tested (75) | ✅ Tested (∞) | ✅ Bypass | ✅ Self/Invalid |
| **Protected Photos** | ✅ Blocked | ✅ Blocked | ✅ Allowed | ✅ Allowed | ✅ Bypass | ✅ N/A |
| **Advanced Search** | ✅ Blocked | ✅ Blocked | ✅ Allowed | ✅ Allowed | ✅ Bypass | ✅ No Auth |
| **Usage Tracking** | ✅ Tested | ✅ Tested | ✅ Tested | ✅ Tested | ✅ N/A | ✅ Race |
| **Error Responses** | ✅ 403 | ✅ 403 | ✅ N/A | ✅ N/A | ✅ N/A | ✅ 401/404 |
| **Subscriptions** | ✅ Default | ✅ Active | ✅ Active | ✅ Active | ✅ N/A | ✅ Expired |

---

## Common Scenarios Tested

### ✓ Happy Paths

1. **User within limits**: Can use features normally
2. **Premium user**: Has access to protected features
3. **Admin user**: Bypasses all restrictions
4. **Plan upgrade**: Can use new limits immediately

### ✓ Error Paths

1. **Limit exceeded**: Gets 403 with upgrade prompt
2. **No permission**: Gets 403 for premium features
3. **No auth**: Gets 401 unauthorized
4. **Invalid data**: Gets 400/404 errors
5. **Expired plan**: Downgraded to FREE

### ✓ Edge Cases

1. **Self-viewing**: Prevented 
2. **Concurrent requests**: Usage tracked correctly
3. **Invalid tokens**: Rejected properly
4. **Non-existent users**: Handled gracefully

---

## Database Analysis After Tests

### View Created Test Users

```sql
SELECT 
  u.user_id,
  u.mobile_number,
  u.role,
  sp.name as plan,
  sp.priority,
  s.start_date,
  s.end_date
FROM "User" u
LEFT JOIN "Subscription" s ON u.user_id = s.user_id AND s.status = 'ACTIVE'
LEFT JOIN "SubscriptionPlan" sp ON s.plan_id = sp.plan_id
WHERE u.mobile_number LIKE '9999%'
   OR u.mobile_number LIKE '8888%'
   OR u.mobile_number LIKE '7777%'
   OR u.mobile_number LIKE '6666%'
   OR u.mobile_number LIKE '5555%'
ORDER BY sp.priority DESC NULLS LAST;
```

### View Usage Statistics

```sql
SELECT 
  u.mobile_number,
  f.name as feature,
  fu.count,
  pf.limit_value as limit,
  CASE 
    WHEN pf.limit_value IS NULL THEN 'Unlimited'
    WHEN fu.count >= pf.limit_value THEN 'LIMIT REACHED'
    ELSE 'Within Limit'
  END as status
FROM "FeatureUsage" fu
JOIN "User" u ON fu.user_id = u.user_id
JOIN "Feature" f ON fu.feature_id = f.feature_id
JOIN "Subscription" s ON u.user_id = s.user_id AND s.status = 'ACTIVE'
JOIN "PlanFeature" pf ON s.plan_id = pf.plan_id AND fu.feature_id = pf.feature_id
WHERE u.mobile_number LIKE '____2%'
ORDER BY f.name, fu.count DESC;
```

### View Error Patterns

```sql
-- Users who hit limits
SELECT 
  u.mobile_number,
  sp.name as plan,
  f.name as feature,
  fu.count,
  pf.limit_value,
  fu.last_used
FROM "FeatureUsage" fu
JOIN "User" u ON fu.user_id = u.user_id
JOIN "Feature" f ON fu.feature_id = f.feature_id
JOIN "Subscription" s ON u.user_id = s.user_id AND s.status = 'ACTIVE'
JOIN "SubscriptionPlan" sp ON s.plan_id = sp.plan_id
JOIN "PlanFeature" pf ON s.plan_id = pf.plan_id AND fu.feature_id = pf.feature_id
WHERE fu.count >= pf.limit_value
  AND pf.limit_value IS NOT NULL
ORDER BY fu.last_used DESC;
```

---

## Troubleshooting

### Issue: "Connection refused"

**Symptoms**: Tests fail immediately with ECONNREFUSED

**Solution**:
```bash
# Start the server first
npm run dev

# In another terminal, run tests
npm run test:feature-gating
```

---

### Issue: "Feature not found" errors

**Symptoms**: Tests fail with feature lookup errors

**Solution**:
```bash
# Seed the database with feature gating data
node scripts/seedFeatureGating.js

# Then run tests
npm run test:feature-gating
```

---

### Issue: "All tests fail with 401"

**Symptoms**: Every test returns 401 Unauthorized

**Possible Causes**:
1. Auth middleware not working
2. JWT secret mismatch
3. User creation failing

**Solution**:
```bash
# Check .env file has JWT_SECRET
cat .env | grep JWT_SECRET

# Test signup manually
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"mobile_number":"9999999999","password":"Test@123"}'
```

---

### Issue: Tests hang indefinitely

**Symptoms**: Tests start but never complete

**Solution**:
1. Check server logs for errors
2. Ensure database is not locked
3. Restart server and try again
4. Reduce wait times in test file if testing locally

---

### Issue: Race condition test fails randomly

**Symptoms**: Test #45 passes sometimes, fails others

**Note**: This is expected due to network timing. Run multiple times to establish pattern.

**If consistently fails**: Possible race condition in usage tracking - needs investigation.

---

## Performance Benchmarks

### Target Performance

- **Setup**: < 30 seconds
- **Contact Views Suite**: < 2 minutes
- **Other Suites**: < 30 seconds each
- **Total Duration**: 3-5 minutes

### Warning Signs

- **Setup > 60s**: Database slow or connection issues
- **Any suite > 5 minutes**: Server performance problem
- **Timeouts**: Increase wait times or check server

---

## Integration Checklist

Before merging to production:

- [ ] All tests pass (100% success rate)
- [ ] Test duration < 5 minutes
- [ ] No server errors in logs
- [ ] Database queries return expected results
- [ ] JSON results file generated successfully
- [ ] Feature limits match documentation
- [ ] Upgrade prompts are correct
- [ ] Admin bypass working
- [ ] Edge cases handled properly

---

## Next Steps After Testing

### If All Tests Pass ✅

1. **Review JSON results** for any warnings
2. **Check database** for data integrity
3. **Proceed to Phase 1 activation** (see docs)
4. **Monitor production** with logging mode first

### If Tests Fail ❌

1. **Check specific failure** in console output
2. **Review error response** structure
3. **Query database** for debugging
4. **Fix issue** in implementation
5. **Re-run tests** to verify fix

---

## Documentation References

- **Full Implementation**: `documentation/TASK_6.2_FEATURE_GATING_SUMMARY.md`
- **Quick Reference**: `documentation/TASK_6.2_QUICK_REFERENCE.md`
- **Test Details**: `tests/FEATURE_GATING_TESTS_README.md`
- **Seeding Guide**: `scripts/seedFeatureGating.js` (inline comments)

---

## Support

**For test issues**: Review `tests/FEATURE_GATING_TESTS_README.md`  
**For feature gating issues**: Review `documentation/TASK_6.2_FEATURE_GATING_SUMMARY.md`  
**For implementation questions**: Review `documentation/TASK_6.2_QUICK_REFERENCE.md`

---

**Last Updated**: February 6, 2026  
**Test Suite Version**: 1.0  
**Status**: Ready for execution ✅
