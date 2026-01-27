# Swagger API Documentation

## 🎯 Overview

Interactive API documentation for the SarvVivah backend using Swagger UI. This provides a complete reference for all API endpoints with try-it-out functionality.

## 🚀 Accessing Swagger UI

### Development/Staging
```
http://localhost:3000/api-docs
```

**Note:** Swagger UI is only available in development and staging environments, not in production.

## 📚 What's Documented

### ✅ Authentication Endpoints
All `/auth/*` endpoints including:
- 📱 **OTP Management**: Send and verify OTP
- 🔐 **Authentication**: Login, Signup, Create Admin
- 🔄 **Token Management**: Refresh token, Logout, Logout all devices
- 🔑 **Password Management**: Forgot password, Reset password, Change password

### ✅ Master Data Endpoints
All `/master/*` endpoints including:
- 📋 **Enums**: Gender, Marital Status, Profile Created By, etc.
- 🕉️ **Religions**: All religions list
- 👥 **Castes**: Castes by religion
- 🏛️ **Sub-Castes**: Sub-castes by caste
- 🌳 **Hierarchy**: Complete religion hierarchy

## 🎨 Features

### 1. **Interactive Testing**
- ✅ Try-it-out feature for all endpoints
- ✅ Live request/response examples
- ✅ Real API calls from browser

### 2. **JWT Authentication Support**
- ✅ "Authorize" button at top-right
- ✅ Test protected endpoints with JWT tokens
- ✅ Token persists across requests

### 3. **Complete Schemas**
- ✅ Request body examples
- ✅ Response examples
- ✅ Data type definitions
- ✅ Validation rules

### 4. **Professional UI**
- ✅ Clean, organized interface
- ✅ Grouped by tags (Authentication, Master Data)
- ✅ Expandable sections
- ✅ Dark mode compatible

## 🔐 Testing Protected Endpoints

### Step 1: Login
1. Expand **POST /auth/login**
2. Click **"Try it out"**
3. Enter credentials:
```json
{
  "identifier": "+919876543210",
  "password": "Password@123"
}
```
4. Click **"Execute"**
5. Copy the `accessToken` from response

### Step 2: Authorize
1. Click **"Authorize"** button (🔓 icon at top-right)
2. Enter: `Bearer <your_access_token>`
3. Click **"Authorize"**
4. Click **"Close"**

### Step 3: Test Protected Endpoint
1. Expand any protected endpoint (🔒 icon), e.g., **POST /auth/change-password**
2. Click **"Try it out"**
3. Enter request body
4. Click **"Execute"**
5. You should get a successful response

## 📝 Common Use Cases

### Test Complete Signup Flow
```
1. POST /auth/send-otp          → Send OTP
2. POST /auth/verify-otp        → Verify OTP
3. POST /auth/signup            → Complete signup
   ↓ Receive accessToken & refreshToken
4. Use accessToken for protected endpoints
```

### Test Token Refresh Flow
```
1. POST /auth/login             → Get tokens
   ↓ Wait 16 minutes (or use expired token)
2. POST /auth/refresh-token     → Get new tokens
   ↓ Receive new accessToken & refreshToken
3. Use new accessToken
```

### Test Password Reset Flow
```
1. POST /auth/forgot-password   → Request OTP
2. POST /auth/verify-forgot-otp → Verify OTP
3. POST /auth/reset-password    → Reset password
```

### Test Master Data
```
1. GET /master/enums            → Get all enum options
2. GET /master/religions        → Get religions
3. GET /master/castes/{id}      → Get castes for a religion
4. GET /master/sub-castes/{id}  → Get sub-castes
5. GET /master/all              → Get everything at once
```

## 🎯 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development  # Swagger only works when NODE_ENV !== 'production'
PORT=3000
```

### Files
- **Configuration**: `src/config/swagger.js`
- **Auth Routes**: `src/routes/auth.js`
- **Master Data Routes**: `src/routes/masterData.js`
- **Main Server**: `index.js`

## 📦 Packages Used

```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}
```

## 🎨 Customization

### Custom Styling
The Swagger UI has custom CSS to hide the top bar:
```javascript
customCss: '.swagger-ui .topbar { display: none }'
```

### Custom Title
```javascript
customSiteTitle: 'SarvVivah API Docs'
```

## 📖 Documentation Format

All endpoints are documented using JSDoc comments with Swagger annotations:

```javascript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Login with mobile or email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
```

## 🚫 Production Behavior

In production (`NODE_ENV=production`), Swagger UI is completely disabled:
- `/api-docs` returns 404
- Zero performance overhead
- No security risk

## 🆘 Troubleshooting

### Swagger UI Not Loading
1. Check `NODE_ENV` is not set to `production`
2. Verify server is running on correct port
3. Check console for any startup errors
4. Ensure swagger packages are installed: `npm install`

### "Authorize" Button Not Working
1. Ensure you're using format: `Bearer <token>`
2. Don't include quotes around the token
3. Check token hasn't expired (15 min validity)

### Endpoints Not Showing
1. Check JSDoc comments are properly formatted
2. Verify route files are in `src/routes/` directory
3. Restart server after changes

### Try-It-Out Returning Errors
1. Check request body format matches schema
2. Verify all required fields are provided
3. Ensure authentication is set up for protected endpoints
4. Check server logs for actual error

## 🔗 Additional Resources

- **Swagger Specification**: OpenAPI 3.0.0
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Docs**: https://swagger.io/specification/

## 📋 Maintenance

### Adding New Endpoint
1. Add route handler to appropriate file
2. Add JSDoc Swagger comment above route
3. Restart server
4. Endpoint automatically appears in Swagger UI

### Updating Documentation
1. Edit JSDoc comments in route files
2. No need to update separate documentation files
3. Changes reflect immediately on server restart

## ✨ Best Practices

1. **Always include examples** in request/response schemas
2. **Use proper HTTP status codes** in response definitions
3. **Document all query/path parameters** with types and descriptions
4. **Include error responses** (400, 401, 500, etc.)
5. **Keep descriptions clear and concise**
6. **Use schema references** for common objects (e.g., `$ref: '#/components/schemas/User'`)

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintained By**: SarvVivah Development Team
