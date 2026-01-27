# 🔐 Password Management API Documentation

## Overview

Complete API documentation for forgot password and change password functionality.

---

## 🔄 Forgot Password Flow

### **Step 1: Request OTP**

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "mobile_number": "9876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your mobile number",
  "data": {
    "mobile_number": "9876543210",
    "expires_in": "10 minutes"
  }
}
```

**Error Responses:**
- **404** - Mobile number not registered
- **429** - Rate limit exceeded (3 OTP requests per 15 minutes)

**Features:**
- ✅ Rate limiting: 3 OTP requests per 15 minutes
- ✅ Invalidates all previous OTPs for same mobile
- ✅ 10-minute OTP expiry
- ✅ SMS delivery via Twilio

---

### **Step 2: Verify OTP**

**Endpoint:** `POST /auth/verify-forgot-otp`

**Request Body:**
```json
{
  "mobile_number": "9876543210",
  "otp_code": "473829"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "data": {
    "mobile_number": "9876543210",
    "verified": true
  }
}
```

**Error Responses:**
- **400** - Invalid or expired OTP

**Features:**
- ✅ Marks OTP as verified
- ✅ Creates 30-minute verification session
- ✅ Max 3 retry attempts with progressive delays

---

### **Step 3: Reset Password**

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "mobile_number": "9876543210",
  "new_password": "NewSecure@123",
  "confirm_password": "NewSecure@123"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

**Error Responses:**
- **400** - OTP not verified / Passwords don't match / Validation errors
- **400** - OTP verification expired (>30 minutes)
- **404** - User not found

**Features:**
- ✅ Password confirmation matching
- ✅ Strong password validation
- ✅ SMS notification sent after reset
- ✅ Verification session invalidated after use

**SMS Notification:**
```
Your SARVVIVAH account password has been changed successfully. 
If you did not make this change, please contact support immediately.
```

---

## 🔒 Change Password (Logged-In Users)

### **Change Password**

**Endpoint:** `POST /auth/change-password`

**Authentication:** Required (JWT Bearer token)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "current_password": "OldSecure@123",
  "new_password": "NewSecure@456",
  "confirm_password": "NewSecure@456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again with your new password.",
  "data": {
    "note": "All existing sessions have been invalidated. Please login again."
  }
}
```

**Error Responses:**
- **401** - Current password incorrect / Token invalid/expired
- **400** - Passwords don't match / New password same as current
- **403** - Account deactivated

**Features:**
- ✅ Requires current password verification
- ✅ Password confirmation matching
- ✅ Prevents reusing current password
- ✅ SMS notification sent
- ✅ JWT invalidation (force re-login)

---

## 🚀 Complete Flow Examples

### **Forgot Password (cURL)**

```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"mobile_number": "9876543210"}'

# Step 2: Verify OTP (use OTP from SMS)
curl -X POST http://localhost:3000/auth/verify-forgot-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "9876543210",
    "otp_code": "473829"
  }'

# Step 3: Reset Password
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "9876543210",
    "new_password": "NewSecure@123",
    "confirm_password": "NewSecure@123"
  }'
```

### **Change Password (cURL)**

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "current_password": "OldSecure@123",
    "new_password": "NewSecure@456",
    "confirm_password": "NewSecure@456"
  }'
```

---

## 🔐 Security Features

### **Rate Limiting**
- 3 OTP requests per 15 minutes per mobile number
- Prevents OTP spam and abuse
- Returns remaining wait time in error message

### **OTP Management**
- 10-minute expiry
- One-time use (marked as verified after use)
- Previous OTPs invalidated when new one requested
- 30-minute verification window

### **Password Security**
- Bcrypt hashing with 10 salt rounds
- Strong password requirements enforced
- Cannot reuse current password
- Password validation on frontend and backend

### **Session Management**
- JWT-based authentication
- Token invalidation after password change
- 30-minute verification sessions
- Automatic cleanup of expired sessions

### **Notifications**
- SMS alerts for password changes
- Immediate notification on password reset
- Security warning to contact support

---

## ⚠️ Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Validation error / Invalid data |
| 401 | Unauthorized | Invalid/expired token or password |
| 403 | Forbidden | Account deactivated |
| 404 | Not Found | User not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 📝 Validation Rules

### **Mobile Number**
- Exactly 10 digits
- Must start with 6, 7, 8, or 9
- No spaces or special characters
- No +91 country code

### **OTP Code**
- Exactly 6 digits
- Numeric only

### **Password**
- Minimum 8 characters
- 1 uppercase letter (A-Z)
- 1 lowercase letter (a-z)
- 1 number (0-9)
- 1 special character (!@#$%^&*()_+-=[]{}|;:'",.<>?/)

### **Password Confirmation**
- Must match new_password exactly
- Case-sensitive

---

## 💡 Best Practices

### **For Frontend Developers**

1. **Implement proper error handling:**
   ```javascript
   try {
     const response = await fetch('/auth/forgot-password', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ mobile_number: '9876543210' })
     });
     const data = await response.json();
     
     if (!data.success) {
       // Show error message to user
       console.error(data.message);
     }
   } catch (error) {
     console.error('Network error:', error);
   }
   ```

2. **Show password requirements:**
   - Display requirements before user enters password
   - Use real-time validation feedback
   - Show password strength indicator

3. **Handle rate limiting:**
   - Display countdown timer when rate limited
   - Disable "Resend OTP" button during cooldown
   - Show clear error messages

4. **Secure token storage:**
   - Store JWT in httpOnly cookies (preferred)
   - Or use secure localStorage with XSS protection
   - Never store passwords

### **For Backend Developers**

1. **Use environment variables:**
   - Store Twilio credentials in .env
   - Use strong JWT_SECRET
   - Never commit secrets to git

2. **Implement proper logging:**
   - Log all password change attempts
   - Monitor rate limit violations
   - Track failed OTP verifications

3. **Production considerations:**
   - Use Redis for rate limiting (not in-memory Map)
   - Use Redis for session storage
   - Implement proper SMS delivery monitoring
   - Set up alerts for failed password attempts

---

## 🧪 Testing

### **Test Mode**

Set `SMS_TEST_MODE="true"` in .env to test without sending actual SMS:

```env
SMS_TEST_MODE="true"
```

Console output will show:
```
📱 [SMS TEST MODE] OTP Message
📞 To: +919876543210
🔐 OTP: 473829
📝 Message: "Your SARVVIVAH OTP is 473829..."
```

### **Test Scenarios**

1. ✅ Valid forgot password flow
2. ✅ Invalid OTP
3. ✅ Expired OTP (>10 minutes)
4. ✅ Rate limiting (4th request within 15 min)
5. ✅ Password mismatch
6. ✅ Weak password
7. ✅ Change password with wrong current password
8. ✅ Change password without JWT token

---

## 📊 Database Schema

### **otp_logs Table**

```sql
CREATE TABLE otp_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL,  -- 'SIGNUP', 'LOGIN', 'FORGOT_PASSWORD'
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Purpose values:
- `SIGNUP` - User registration
- `LOGIN` - Login with OTP (future)
- `FORGOT_PASSWORD` - Password reset

---

## 🔗 Related Endpoints

- [POST /auth/signup](README.md#signup) - User registration
- [POST /auth/login](README.md#login) - User login
- [POST /auth/send-otp](README.md#send-otp) - Send signup OTP
- [POST /auth/verify-otp](README.md#verify-otp) - Verify signup OTP

---

## 📞 Support

For issues or questions:
- Check error messages carefully
- Verify Twilio credentials in .env
- Ensure database is accessible
- Check console logs for detailed errors

---

**Last Updated:** January 27, 2026
**API Version:** 1.0.0
