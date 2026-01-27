# Refresh Token Quick Reference

## Token Configuration

```env
JWT_EXPIRATION="15m"  # Access token expiry
# Refresh token: 7 days (hardcoded in tokenService.js)
```

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | Public | Login and get tokens |
| `/auth/signup` | POST | Public | Signup and get tokens |
| `/auth/refresh-token` | POST | Public | Get new access token |
| `/auth/logout` | POST | Public | Logout current device |
| `/auth/logout-all` | POST | JWT | Logout all devices |
| `/auth/change-password` | POST | JWT | Change password (revokes all tokens) |
| `/auth/reset-password` | POST | Public | Reset password (revokes all tokens) |

## Token Response Format

### Login/Signup Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",  // 15 min JWT
    "refreshToken": "a8f5f167...", // 7 day token
    "user": { /* user data */ }
  }
}
```

### Refresh Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",  // New 15 min JWT
    "refreshToken": "b9g6g278..."  // New 7 day token (rotated)
  }
}
```

## Frontend Implementation Checklist

### 1. Login/Signup
- [ ] Store `accessToken` and `refreshToken` securely
- [ ] Use `accessToken` for API requests
- [ ] Add `Authorization: Bearer <accessToken>` header

### 2. API Request Interceptor
- [ ] Add axios request interceptor
- [ ] Attach access token to all requests
- [ ] Handle requests without authentication

### 3. Token Refresh on 401
- [ ] Add axios response interceptor
- [ ] Detect 401 errors
- [ ] Call `/auth/refresh-token` with refresh token
- [ ] Update stored tokens with new values
- [ ] Retry failed request with new access token
- [ ] Redirect to login if refresh fails

### 4. Logout
- [ ] Call `/auth/logout` with refresh token
- [ ] Clear stored tokens
- [ ] Redirect to login page

### 5. Password Change Handling
- [ ] Show message about logging out other devices
- [ ] Force current device re-login after password change

## Code Snippets

### Store Tokens
```javascript
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### Make Authenticated Request
```javascript
axios.get('/api/protected', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### Refresh Token on 401
```javascript
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const res = await axios.post('/auth/refresh-token', { refresh_token: refreshToken });
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      error.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Logout
```javascript
const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  await axios.post('/auth/logout', { refresh_token: refreshToken });
  localStorage.clear();
  window.location.href = '/login';
};
```

## Testing Commands

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "+919876543210", "password": "Password@123"}'
```

### Use Access Token
```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password": "old", "new_password": "new", "confirm_password": "new"}'
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<refresh_token>"}'
```

### Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<refresh_token>"}'
```

### Logout All Devices
```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -H "Authorization: Bearer <access_token>"
```

## Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Access token required" | No Authorization header | Add Bearer token to request |
| "Invalid or expired refresh token" | Refresh token expired/revoked | Redirect to login |
| "Current password is incorrect" | Wrong current password | Check password input |
| "All existing sessions have been invalidated" | Password changed | Login with new password |

## Database Queries

### Check active tokens for user
```sql
SELECT * FROM refresh_tokens 
WHERE user_id = 'user-uuid' 
AND is_revoked = false 
AND expires_at > NOW();
```

### Revoke all tokens for user
```sql
UPDATE refresh_tokens 
SET is_revoked = true 
WHERE user_id = 'user-uuid' 
AND is_revoked = false;
```

### Clean expired tokens
```sql
DELETE FROM refresh_tokens 
WHERE expires_at < NOW() 
OR is_revoked = true;
```

## Security Checklist

- [x] Access tokens expire in 15 minutes
- [x] Refresh tokens expire in 7 days
- [x] Refresh tokens stored in database
- [x] Refresh tokens are revoked on use (rotation)
- [x] All tokens revoked on password change
- [x] All tokens revoked on logout-all
- [x] JWT contains user_id, mobile_number, role
- [ ] Production: Use HTTPS only
- [ ] Production: Enable CORS properly
- [ ] Production: Set up token cleanup cron job
- [ ] Production: Implement rate limiting on refresh endpoint
- [ ] Production: Use httpOnly cookies for refresh tokens

## Files Modified

- [x] `prisma/schema.prisma` - Added RefreshToken model
- [x] `src/services/tokenService.js` - Token management service
- [x] `src/utils/validation.js` - Added refreshTokenSchema
- [x] `src/controllers/authController.js` - Updated all auth methods
- [x] `src/routes/auth.js` - Added new routes
- [x] `.env` - Changed JWT_EXPIRATION to 15m

## Next Steps

1. **Restart Server:**
   ```bash
   cd Backend
   npm start
   ```

2. **Test Login Flow:**
   - Login and verify you receive both tokens
   - Use access token for protected endpoints
   - Wait 16 minutes and verify token expires
   - Use refresh token to get new access token

3. **Test Password Change:**
   - Login from two different browsers
   - Change password in one browser
   - Verify other browser is logged out

4. **Frontend Integration:**
   - Implement token refresh interceptor
   - Update all API calls to use new token format
   - Test automatic token refresh

5. **Production Setup:**
   - Set up cleanup cron job
   - Enable HTTPS
   - Configure CORS
   - Add rate limiting
   - Consider httpOnly cookies

## Support

For detailed documentation, see [REFRESH_TOKEN_SYSTEM.md](REFRESH_TOKEN_SYSTEM.md)

---

**Quick Link:** Full documentation at `/Backend/REFRESH_TOKEN_SYSTEM.md`
