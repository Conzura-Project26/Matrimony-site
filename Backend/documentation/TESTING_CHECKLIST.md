# Testing Checklist for Refresh Token System

## Pre-Testing Setup

### ✅ Implementation Status
- [x] Database schema updated (RefreshToken model)
- [x] Database synced (`prisma db push` completed)
- [x] TokenService created
- [x] Auth controller updated
- [x] Routes added
- [x] Environment variables configured
- [x] Documentation created

### 🔄 Before Testing
- [ ] Stop the backend server (if running)
- [ ] Run `npx prisma generate` to regenerate Prisma client
- [ ] Start the backend server: `npm start`
- [ ] Verify server starts without errors

## Test Scenarios

### 1. Login Flow ✅

**Endpoint:** `POST /auth/login`

**Test Case 1.1: Successful Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+919876543210",
    "password": "Password@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a8f5f167f44f4964e6c998dee827110c...",
    "user": {
      "id": "uuid",
      "mobile_number": "+919876543210",
      "full_name": "John Doe",
      "role": {
        "role_name": "user"
      }
    }
  }
}
```

**Verification:**
- [ ] Response contains `accessToken`
- [ ] Response contains `refreshToken`
- [ ] `accessToken` is a JWT (starts with `eyJ`)
- [ ] `refreshToken` is a long hex string (128 characters)
- [ ] User data is present
- [ ] Check database: `SELECT * FROM refresh_tokens WHERE user_id = 'user-uuid'`
- [ ] One token record should exist

---

### 2. Signup Flow ✅

**Endpoint:** `POST /auth/signup`

**Test Case 2.1: Successful Signup**

First, send OTP:
```bash
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+919876543211"
  }'
```

Verify OTP (use OTP from database or SMS):
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+919876543211",
    "otp": "123456"
  }'
```

Complete signup:
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+919876543211",
    "password": "Password@123",
    "full_name": "Jane Doe",
    "gender": "Female",
    "date_of_birth": "15-01-1995",
    "profile_created_by": "Self"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully. You are now logged in.",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "b9g6g278...",
    "user": { ... }
  }
}
```

**Verification:**
- [ ] Response contains both tokens
- [ ] User account created in database
- [ ] Refresh token stored in database
- [ ] OTP marked as used

---

### 3. Protected Endpoint with Access Token ✅

**Endpoint:** `POST /auth/change-password`

**Test Case 3.1: Valid Access Token**

First, login to get tokens:
```bash
# Login and save the accessToken from response
```

Use access token:
```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Password@123",
    "new_password": "NewPassword@123",
    "confirm_password": "NewPassword@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again with your new password.",
  "data": {
    "note": "All existing sessions have been invalidated. Please login again."
  }
}
```

**Verification:**
- [ ] Password changed successfully
- [ ] Check database: All refresh tokens for this user should be revoked
  ```sql
  SELECT * FROM refresh_tokens WHERE user_id = 'user-uuid';
  -- All should have is_revoked = true
  ```
- [ ] SMS notification sent to user's mobile

**Test Case 3.2: Missing Access Token**
```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Password@123",
    "new_password": "NewPassword@123",
    "confirm_password": "NewPassword@123"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**Test Case 3.3: Invalid Access Token**
```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected Response:** 401 with error message

---

### 4. Token Refresh Flow ✅

**Endpoint:** `POST /auth/refresh-token`

**Test Case 4.1: Valid Refresh Token**

Use refresh token from login:
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN_FROM_LOGIN>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "c0h7h389..."
  }
}
```

**Verification:**
- [ ] New `accessToken` received
- [ ] New `refreshToken` received (different from old one)
- [ ] Old refresh token revoked in database
  ```sql
  SELECT * FROM refresh_tokens WHERE token = 'old_refresh_token';
  -- Should have is_revoked = true
  ```
- [ ] New refresh token stored in database
- [ ] New access token is valid (test with protected endpoint)

**Test Case 4.2: Invalid Refresh Token**
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "invalid_token"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token. Please login again."
}
```

**Test Case 4.3: Revoked Refresh Token**

Use old refresh token that was already used:
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<OLD_USED_TOKEN>"
  }'
```

**Expected Response:** Same as invalid token (401 error)

**Test Case 4.4: Expired Refresh Token**

This requires waiting 7 days or manually updating the database:
```sql
UPDATE refresh_tokens 
SET expires_at = NOW() - INTERVAL '1 day' 
WHERE token = 'some_token';
```

Then try to refresh. Should fail with "Invalid or expired refresh token".

---

### 5. Logout Flow ✅

**Endpoint:** `POST /auth/logout`

**Test Case 5.1: Successful Logout**

Login first, then:
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN_FROM_LOGIN>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Verification:**
- [ ] Refresh token revoked in database
  ```sql
  SELECT * FROM refresh_tokens WHERE token = 'refresh_token';
  -- Should have is_revoked = true
  ```
- [ ] Try to use same refresh token again → should fail
- [ ] Access token still works until it expires (15 min)

**Test Case 5.2: Invalid Refresh Token**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "invalid_token"
  }'
```

Should still return success (idempotent operation).

---

### 6. Logout All Devices ✅

**Endpoint:** `POST /auth/logout-all`

**Test Case 6.1: Logout All Devices**

Setup:
1. Login from "Device 1" (save accessToken1, refreshToken1)
2. Login from "Device 2" (save accessToken2, refreshToken2)
3. Check database: Should have 2 refresh tokens for this user

Logout all:
```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -H "Authorization: Bearer <ACCESS_TOKEN_1>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully logged out from 2 device(s)",
  "data": {
    "devicesLoggedOut": 2
  }
}
```

**Verification:**
- [ ] Both refresh tokens revoked in database
- [ ] Try to refresh with refreshToken1 → should fail
- [ ] Try to refresh with refreshToken2 → should fail
- [ ] Access tokens still work until they expire

**Test Case 6.2: No Access Token**
```bash
curl -X POST http://localhost:3000/auth/logout-all
```

**Expected Response:** 401 Unauthorized

---

### 7. Password Change Token Revocation ✅

**Test Case 7.1: All Tokens Revoked on Password Change**

Setup:
1. Login from "Device 1" (save tokens1)
2. Login from "Device 2" (save tokens2)
3. Check database: 2 refresh tokens exist

Change password from Device 1:
```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN_1>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Password@123",
    "new_password": "NewPassword@123",
    "confirm_password": "NewPassword@123"
  }'
```

Test from Device 2:
```bash
# Try to refresh token from Device 2
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN_2>"
  }'
```

**Expected Response:** "Invalid or expired refresh token"

**Verification:**
- [ ] All refresh tokens revoked in database
- [ ] Device 2 cannot refresh tokens
- [ ] Device 2 is forced to login again
- [ ] SMS notification sent

---

### 8. Password Reset Token Revocation ✅

**Test Case 8.1: All Tokens Revoked on Password Reset**

Setup:
1. Login from 2 devices (get 2 refresh tokens)

Forgot password flow:
```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+919876543210"
  }'

# Step 2: Verify OTP
curl -X POST http://localhost:3000/auth/verify-forgot-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+919876543210",
    "otp": "123456"
  }'

# Step 3: Reset password
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+919876543210",
    "new_password": "ResetPassword@123",
    "confirm_password": "ResetPassword@123"
  }'
```

Test from other device:
```bash
# Try to refresh token
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<OLD_REFRESH_TOKEN>"
  }'
```

**Expected Response:** "Invalid or expired refresh token"

**Verification:**
- [ ] All refresh tokens revoked
- [ ] All devices must login with new password
- [ ] SMS notification sent

---

### 9. Access Token Expiry ✅

**Test Case 9.1: Access Token Expires After 15 Minutes**

1. Login and save both tokens
2. Use access token immediately → should work
3. Wait 16 minutes
4. Try to use access token → should fail with 401
5. Use refresh token to get new access token → should work
6. Use new access token → should work

```bash
# Immediate use (works)
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Password@123",
    "new_password": "NewPassword@123",
    "confirm_password": "NewPassword@123"
  }'

# Wait 16 minutes...

# After 16 minutes (fails)
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer <SAME_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Expected: 401 error

# Refresh token (works)
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN>"
  }'

# Use new access token (works)
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer <NEW_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

### 10. Database Verification ✅

**Check Refresh Tokens Table**

```sql
-- View all refresh tokens
SELECT 
  id,
  user_id,
  LEFT(token, 20) as token_preview,
  expires_at,
  created_at,
  is_revoked
FROM refresh_tokens
ORDER BY created_at DESC;

-- Count active tokens per user
SELECT 
  u.full_name,
  u.mobile_number,
  COUNT(rt.id) as active_tokens
FROM users u
LEFT JOIN refresh_tokens rt ON u.id = rt.user_id
WHERE rt.is_revoked = false AND rt.expires_at > NOW()
GROUP BY u.id, u.full_name, u.mobile_number;

-- Find expired tokens
SELECT COUNT(*) 
FROM refresh_tokens 
WHERE expires_at < NOW();

-- Find revoked tokens
SELECT COUNT(*) 
FROM refresh_tokens 
WHERE is_revoked = true;
```

---

## Frontend Integration Test

### 11. Frontend Token Refresh Interceptor ✅

**Test with Real Frontend (or Postman)**

1. **Login**
   - Store accessToken and refreshToken in localStorage
   - Verify tokens are stored correctly

2. **Make API Request**
   - Use accessToken in Authorization header
   - Request should succeed

3. **Simulate Token Expiry**
   - Wait 16 minutes OR manually change token to invalid
   - Make API request
   - Should get 401 error

4. **Automatic Refresh**
   - Frontend interceptor should:
     - Detect 401 error
     - Call /auth/refresh-token with refreshToken
     - Get new tokens
     - Retry original request with new accessToken
     - Original request should succeed

5. **Logout**
   - Call /auth/logout with refreshToken
   - Clear localStorage
   - Redirect to login page

**Verification:**
- [ ] User doesn't notice token refresh happening
- [ ] No disruption in user experience
- [ ] All API calls continue to work seamlessly
- [ ] Logout properly clears tokens

---

## Performance Tests

### 12. Load Testing ✅

**Test Case 12.1: Multiple Concurrent Refreshes**

Use tool like Apache Bench or k6:
```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -p refresh_payload.json \
  http://localhost:3000/auth/refresh-token
```

**Verification:**
- [ ] All requests complete successfully
- [ ] No race conditions
- [ ] Database handles concurrent writes
- [ ] Tokens are properly rotated

**Test Case 12.2: Database Performance**

```sql
-- Check index usage
EXPLAIN ANALYZE 
SELECT * FROM refresh_tokens 
WHERE token = 'some_token';

-- Should use index on token column

EXPLAIN ANALYZE 
SELECT * FROM refresh_tokens 
WHERE user_id = 'some_uuid';

-- Should use index on user_id column
```

---

## Security Tests

### 13. Security Validation ✅

**Test Case 13.1: Token Reuse Prevention**

1. Login and get refreshToken1
2. Use refreshToken1 to get new tokens (get refreshToken2)
3. Try to use refreshToken1 again
4. Should fail (token was revoked in step 2)

**Test Case 13.2: Stolen Access Token**

1. Access token is stolen (simulated)
2. Attacker uses it for 15 minutes max
3. After 15 minutes, token expires
4. Attacker cannot refresh (doesn't have refresh token)

**Test Case 13.3: Stolen Refresh Token**

1. Refresh token is stolen
2. Legitimate user uses refresh token → gets new tokens
3. Attacker tries to use old refresh token → fails (revoked)
4. Attacker tries to use new refresh token → works (security issue)
5. User changes password → all tokens revoked → attacker locked out

**Mitigation:** Use httpOnly cookies in production

---

## Final Checklist

### Implementation Verification
- [x] Database schema created
- [ ] Prisma client regenerated
- [x] TokenService implemented
- [x] Controllers updated
- [x] Routes added
- [x] Environment variables set
- [x] Documentation created

### Testing Verification
- [ ] All 13 test scenarios passed
- [ ] Database queries verified
- [ ] Frontend integration tested
- [ ] Performance acceptable
- [ ] Security validated

### Production Readiness
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting added
- [ ] Cleanup cron job scheduled
- [ ] Monitoring set up
- [ ] Documentation shared with frontend team

---

## Common Issues & Solutions

### Issue: "Invalid refresh token" immediately after login
**Cause:** Database not synced or Prisma client not regenerated  
**Solution:** 
```bash
npx prisma db push
npx prisma generate
```

### Issue: Access token not expiring after 15 minutes
**Cause:** JWT_EXPIRATION still set to "24h"  
**Solution:** Check `.env` file, should be `JWT_EXPIRATION="15m"`

### Issue: Refresh token not stored in database
**Cause:** Prisma client using old schema  
**Solution:** Restart server after running `npx prisma generate`

### Issue: "Cannot find module tokenService"
**Cause:** Server not restarted after creating file  
**Solution:** Restart server with `npm start`

### Issue: All tokens revoked but user still logged in
**Cause:** Access token still valid (15 min)  
**Solution:** This is expected. Access token works until it expires. After expiry, refresh will fail.

---

## Success Criteria

✅ All tests pass  
✅ Tokens properly stored and revoked  
✅ Password changes force re-login  
✅ Frontend can automatically refresh tokens  
✅ No errors in server logs  
✅ Database performance acceptable  
✅ Security requirements met  

---

**Testing Status:** Ready for Testing  
**Last Updated:** January 2025  
**Test Duration:** ~2 hours for complete testing
