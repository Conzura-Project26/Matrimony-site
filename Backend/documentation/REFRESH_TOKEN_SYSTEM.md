# Refresh Token System Documentation

## Overview

The SARVVIVAH backend now implements a **JWT Refresh Token** authentication system for enhanced security. This system provides:

- **Short-lived access tokens** (15 minutes) - Used for API requests
- **Long-lived refresh tokens** (7 days) - Used to get new access tokens
- **True token invalidation** - Force logout on password change
- **Multi-device support** - Each device gets its own refresh token
- **Token rotation** - Refresh tokens are replaced on use for security

## Why Refresh Tokens?

Traditional JWT tokens cannot be invalidated before they expire. With refresh tokens:

1. **Security**: Access tokens expire quickly, limiting damage if stolen
2. **Revocation**: Refresh tokens stored in database can be revoked anytime
3. **Password Changes**: All tokens are invalidated when password changes
4. **Device Management**: Users can logout from all devices

## Architecture

### Database Schema

```prisma
model RefreshToken {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id    String    @db.Uuid
  token      String    @unique @db.Text
  expires_at DateTime
  created_at DateTime  @default(now())
  is_revoked Boolean   @default(false)
  
  user       User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([token])
  @@map("refresh_tokens")
}
```

### Token Types

| Token Type | Expiry | Storage | Purpose | Revocable |
|------------|--------|---------|---------|-----------|
| **Access Token** | 15 minutes | Client memory/storage | API requests | No (expires quickly) |
| **Refresh Token** | 7 days | Client secure storage | Get new access tokens | Yes (database) |

## API Endpoints

### 1. Login / Signup (Updated)

**Endpoints:**
- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/create-admin`

**Response (Changed):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a8f5f167f44f4964e6c998dee827110c5028a5a5d8b4e5f5c5d0e6c998dee827110c...",
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

### 2. Refresh Access Token (New)

**Endpoint:** `POST /auth/refresh-token`

**Request:**
```json
{
  "refresh_token": "a8f5f167f44f4964e6c998dee827110c..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new_refresh_token_here..."
  }
}
```

**Notes:**
- Old refresh token is automatically revoked (token rotation)
- Store the new refresh token for next use
- If refresh token is invalid/expired, user must login again

### 3. Logout (New)

**Endpoint:** `POST /auth/logout`

**Request:**
```json
{
  "refresh_token": "a8f5f167f44f4964e6c998dee827110c..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Logout All Devices (New)

**Endpoint:** `POST /auth/logout-all`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out from 3 device(s)",
  "data": {
    "devicesLoggedOut": 3
  }
}
```

### 5. Change Password (Updated)

**Endpoint:** `POST /auth/change-password`

**Behavior:** All refresh tokens are automatically revoked after password change. User must login again on all devices.

### 6. Reset Password (Updated)

**Endpoint:** `POST /auth/reset-password`

**Behavior:** All refresh tokens are automatically revoked after password reset. User must login again on all devices.

## Frontend Integration

### 1. Store Tokens Securely

**Best Practices:**
```javascript
// Option 1: httpOnly cookie (most secure - backend sets it)
// Option 2: Secure storage (mobile apps)
// Option 3: LocalStorage with proper XSS protection

// Example: LocalStorage (web)
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### 2. API Request Flow

```javascript
// axios interceptor example
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/auth/refresh-token', {
          refresh_token: refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Update stored tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 3. Login Implementation

```javascript
const login = async (identifier, password) => {
  try {
    const response = await axios.post('/auth/login', {
      identifier,
      password
    });
    
    const { accessToken, refreshToken, user } = response.data.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

### 4. Logout Implementation

```javascript
const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout endpoint
    await axios.post('/auth/logout', { refresh_token: refreshToken });
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    // Clear storage even if request fails
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

### 5. Logout All Devices

```javascript
const logoutAllDevices = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await axios.post(
      '/auth/logout-all',
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    // Clear local storage
    localStorage.clear();
    
    alert(`Logged out from ${response.data.data.devicesLoggedOut} device(s)`);
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout all failed:', error);
  }
};
```

## Security Considerations

### 1. Token Storage

| Storage Method | Security Level | Use Case |
|---------------|---------------|----------|
| **httpOnly Cookie** | ⭐⭐⭐⭐⭐ Highest | Production (backend sets cookie) |
| **Secure Storage** | ⭐⭐⭐⭐ High | Mobile apps (KeyChain/KeyStore) |
| **LocalStorage** | ⭐⭐⭐ Medium | Web (with XSS protection) |
| **SessionStorage** | ⭐⭐ Low | Temporary sessions |

### 2. Token Rotation

Every time `/auth/refresh-token` is called:
- Old refresh token is revoked
- New refresh token is issued
- This prevents token reuse attacks

### 3. Access Token Expiry

- **15 minutes**: Short enough to limit damage if stolen
- **Automatic refresh**: Frontend handles renewal transparently
- **No user interruption**: Users stay logged in seamlessly

### 4. Refresh Token Expiry

- **7 days**: Balance between security and convenience
- **Revocable**: Can be invalidated anytime (password change, logout)
- **Database-tracked**: Full audit trail of active sessions

## Token Lifecycle

### Happy Path

```
1. User logs in
   ↓
2. Receive access_token (15m) + refresh_token (7d)
   ↓
3. Use access_token for API requests
   ↓
4. After 15 minutes, access_token expires
   ↓
5. Frontend detects 401 error
   ↓
6. Call /auth/refresh-token with refresh_token
   ↓
7. Receive new access_token + new refresh_token
   ↓
8. Retry failed request with new access_token
   ↓
9. Repeat steps 3-8 for 7 days
   ↓
10. After 7 days, refresh_token expires → redirect to login
```

### Password Change Path

```
1. User changes password
   ↓
2. Backend revokes ALL refresh tokens for this user
   ↓
3. All devices receive 401 on next refresh attempt
   ↓
4. All devices redirect to login
   ↓
5. User must login again with new password
```

## Error Handling

### Common Error Responses

#### Invalid/Expired Access Token
```json
{
  "success": false,
  "message": "Access token required"
}
```
**Solution:** Use refresh token to get new access token

#### Invalid/Expired Refresh Token
```json
{
  "success": false,
  "message": "Invalid or expired refresh token. Please login again."
}
```
**Solution:** Redirect user to login page

#### Revoked Refresh Token (Password Changed)
```json
{
  "success": false,
  "message": "Invalid or expired refresh token. Please login again."
}
```
**Solution:** Redirect to login, user must use new password

## Maintenance

### Cleanup Expired Tokens

The `TokenService` includes a cleanup method:

```javascript
await tokenService.cleanupExpiredTokens();
```

**Recommendation:** Run this daily via cron job:

```javascript
// In a scheduled task
import cron from 'node-cron';
import tokenService from './services/tokenService.js';

// Run cleanup every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Cleaning up expired refresh tokens...');
  const deleted = await tokenService.cleanupExpiredTokens();
  console.log(`Deleted ${deleted} expired tokens`);
});
```

## Testing

### 1. Test Login Flow

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+919876543210",
    "password": "Password@123"
  }'

# Save the accessToken and refreshToken from response
```

### 2. Test Protected Endpoint

```bash
# Use access token
curl -X POST http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "current_password": "Password@123",
    "new_password": "NewPassword@123",
    "confirm_password": "NewPassword@123"
  }'
```

### 3. Test Token Refresh

```bash
# Wait 16 minutes for access token to expire, or use expired token
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token_from_login>"
  }'
```

### 4. Test Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

### 5. Test Logout All Devices

```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -H "Authorization: Bearer <access_token>"
```

### 6. Test Token Revocation on Password Change

```bash
# 1. Login from "Device 1"
# 2. Login from "Device 2" (get separate refresh tokens)
# 3. Change password from Device 1
# 4. Try to refresh token from Device 2
#    Result: Should fail, forcing re-login
```

## Migration from Old System

### Changes Required

1. **Update Frontend Login:**
   - Store both `accessToken` and `refreshToken`
   - Old: `token` → New: `accessToken`

2. **Add Token Refresh Logic:**
   - Implement axios interceptor (see Frontend Integration)
   - Handle 401 responses automatically

3. **Update Logout:**
   - Call `/auth/logout` endpoint with refresh token
   - Don't just clear localStorage

4. **Test All Flows:**
   - Login → Use API → Token expires → Auto refresh → Continue
   - Change password → All devices logged out
   - Logout → Token revoked

## Troubleshooting

### Issue: "Invalid refresh token" after 15 minutes

**Cause:** Frontend not implementing token refresh

**Solution:** Add axios interceptor to handle 401 errors

### Issue: User logged out after password change

**Cause:** This is expected behavior for security

**Solution:** Display message to user explaining they must login with new password

### Issue: Multiple devices not working

**Cause:** Using same refresh token across devices

**Solution:** Each login should get unique refresh token. Don't share tokens.

### Issue: Token refresh fails randomly

**Cause:** Race condition with token rotation

**Solution:** Implement request queuing in frontend to avoid concurrent refreshes

## Best Practices

1. **Never store tokens in URL or query parameters**
2. **Use HTTPS in production** - Tokens must be encrypted in transit
3. **Implement CSRF protection** if using cookies
4. **Set proper CORS headers** to prevent token theft
5. **Monitor refresh token table size** - Clean up expired tokens regularly
6. **Log token usage** for security auditing
7. **Implement rate limiting** on refresh endpoint
8. **Add device tracking** for better security (IP, user agent)

## Future Enhancements

1. **Device Management UI:**
   - Show list of logged-in devices
   - Allow logout of specific devices
   - Show last activity timestamp

2. **Token Fingerprinting:**
   - Bind tokens to device characteristics
   - Detect token theft attempts

3. **Remember Me:**
   - Longer refresh token expiry (30 days)
   - Separate checkbox on login

4. **Two-Factor Authentication:**
   - Require 2FA before issuing refresh token
   - Add 2FA verification to token refresh

5. **Token Analytics:**
   - Track active sessions per user
   - Alert on suspicious activity
   - Geographic location tracking

## Summary

The refresh token system provides:

✅ **Enhanced Security** - Short-lived access tokens limit exposure  
✅ **True Revocation** - Password changes invalidate all sessions  
✅ **Multi-Device Support** - Each device has independent session  
✅ **Seamless UX** - Automatic token refresh, no user interruption  
✅ **Audit Trail** - Database tracks all active sessions  
✅ **Industry Standard** - Follows OAuth 2.0 best practices  

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Author:** SARVVIVAH Development Team
