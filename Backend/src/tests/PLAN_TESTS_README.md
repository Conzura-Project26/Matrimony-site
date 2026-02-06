# Subscription Plan Management - Test Suite

Comprehensive test suite for Task 6.1: Plan Management with detailed logging and edge case coverage.

## Test Coverage

### 1. Public Endpoints (7 tests)
- ✅ Get all active plans
- ✅ Filter plans by billing cycle
- ✅ Get plan by ID
- ✅ Invalid UUID format handling
- ✅ Non-existent plan handling
- ✅ Get plan by code
- ✅ Invalid plan code handling

### 2. Admin Plan Management (11 tests)
- ✅ Unauthorized access prevention
- ✅ Role-based access control (USER vs ADMIN)
- ✅ Invalid data validation
- ✅ Negative price rejection
- ✅ Create new plan
- ✅ Duplicate plan code prevention
- ✅ Update plan details
- ✅ Update non-existent plan handling
- ✅ Deactivate plan
- ✅ Reactivate plan
- ✅ Create plan version

### 3. Feature Management (5 tests)
- ✅ Get all features
- ✅ Create new feature
- ✅ Invalid value_type rejection
- ✅ Assign feature to plan
- ✅ Get plan features

### 4. Edge Cases & Security (7 tests)
- ✅ Extremely large price validation
- ✅ Invalid billing cycle rejection
- ✅ Duration-billing cycle mismatch
- ✅ SQL injection prevention
- ✅ XSS attack prevention
- ✅ Concurrent update handling (race condition)
- ✅ Pagination support

**Total: 30 comprehensive test cases**

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Get Authentication Tokens

First, update credentials in `tests/getTestTokens.js`:
```javascript
// Admin credentials
const adminCredentials = {
  mobile_number: '9999999999',  // Your admin mobile
  password: 'Admin@123',        // Your admin password
};

// User credentials  
const userCredentials = {
  mobile_number: '9876543210',  // Your user mobile
  password: 'User@123',         // Your user password
};
```

Then run:
```bash
node tests/getTestTokens.js
```

Copy the generated tokens.

### Step 3: Update Test File

Open `tests/planManagement.test.js` and update:
```javascript
const ADMIN_TOKEN = 'your-admin-jwt-token-here';
const USER_TOKEN = 'your-user-jwt-token-here';
```

### Step 4: Ensure Server is Running
```bash
npm run dev
```

Server should be running on `http://localhost:3000`

### Step 5: Run Tests
```bash
node tests/planManagement.test.js
```

## Test Output Example

```
================================================================================
  PUBLIC PLAN ENDPOINTS
================================================================================

► TEST #1: GET /api/plans - Fetch all active subscription plans
  ℹ Status: 200
  ℹ Plans returned: 10
  ✓ PASS - Successfully fetched all plans
  📊 Sample Plan:
     {
       "id": "7b3d126b-6a1c-4798-860d-e36c976a2870",
       "code": "FREE_MONTHLY",
       "display_name": "Free",
       "price_amount": 0,
       "billing_cycle": "MONTHLY"
     }
  ✓ PASS - Plan structure is valid

► TEST #2: GET /api/plans?billing_cycle=MONTHLY - Filter by billing cycle
  ℹ Status: 200
  ℹ Monthly plans returned: 4
  ✓ PASS - All returned plans have MONTHLY billing cycle

...

================================================================================
  TEST SUMMARY
================================================================================
  Total Tests:  30
  Passed:       28
  Failed:       2
  Success Rate: 93.33%
  Duration:     15.43s
================================================================================
```

## Features

### 🎨 Color-Coded Output
- 🟢 Green: Passed tests
- 🔴 Red: Failed tests
- 🟡 Yellow: Test names
- 🔵 Blue: Info messages
- 🟣 Magenta: Data dumps

### 📊 Detailed Logging
- Request/Response status codes
- Data validation results
- Error messages and stack traces
- Sample response data
- Field-level comparisons

### 🧹 Automatic Cleanup
- Removes all test data after completion
- Deletes created plans and features
- Leaves database in original state

### 🛡️ Security Testing
- SQL injection attempts
- XSS attack simulation
- Authorization bypass attempts
- Malformed data handling

## Test Structure

```javascript
// Each test follows this pattern:
logger.test('Test description');
try {
  // Make API request
  const response = await axios.get(...);
  
  // Log important info
  logger.info(`Status: ${response.status}`);
  
  // Validate response
  if (validation passes) {
    logger.pass('Test passed message');
    logger.data('Label', dataObject);
  } else {
    logger.fail('Test failed message');
  }
} catch (error) {
  logger.fail('Error message', error);
}
```

## Customization

### Add More Tests
```javascript
async function testCustomEndpoint() {
  logger.section('CUSTOM ENDPOINT TESTS');
  
  logger.test('Your test description');
  // Your test code here
}

// Add to runAllTests()
async function runAllTests() {
  await testPublicEndpoints();
  await testAdminPlanEndpoints();
  await testFeatureEndpoints();
  await testEdgeCases();
  await testCustomEndpoint(); // Add your test
  await cleanup();
}
```

### Adjust Timeouts
```javascript
// Increase wait time between tests
await wait(1000); // 1 second
```

### Skip Cleanup
```javascript
// Comment out cleanup in runAllTests()
// await cleanup();
```

## Troubleshooting

### Authentication Errors (401/403)
- Ensure tokens are valid and not expired
- Check user has correct role (ADMIN for admin endpoints)
- Verify Authorization header format: `Bearer <token>`

### Connection Errors
- Ensure backend server is running
- Check BASE_URL is correct (default: http://localhost:3000)
- Verify database is accessible

### Test Failures
- Check server logs for detailed error messages
- Ensure database has required seed data
- Verify Prisma schema is up to date

## CI/CD Integration

Add to your `package.json`:
```json
{
  "scripts": {
    "test:plans": "node tests/planManagement.test.js"
  }
}
```

Run in CI pipeline:
```bash
npm run test:plans
```

Exit code 0 = all tests passed
Exit code 1 = one or more tests failed

## Notes

- Tests create temporary data (TEST_MONTHLY plan, TEST_FEATURE)
- All test data is automatically cleaned up
- Tests run sequentially with 500ms delays to avoid race conditions
- Some tests intentionally trigger errors to validate error handling
- Tokens expire based on your JWT configuration (default 24h)
