# SarvVivah Backend - API Documentation

## 📋 Overview

SarvVivah is a matrimony platform backend built with Node.js, Express, and PostgreSQL. This API provides authentication, profile management, matchmaking, messaging, and admin features.

**Development Status:** ~85% Complete | **Last Updated:** February 6, 2026

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- npm/yarn

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Configure database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="15m"
ADMIN_SECRET="admin-creation-secret"
OTP_EXPIRATION_MINUTES=10
NODE_ENV="development"
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js + Express.js |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Validation** | Zod |
| **Authentication** | JWT + OTP |
| **Security** | Helmet, Rate Limiting, XSS Protection |
| **Logging** | Winston |
| **API Docs** | Swagger UI |

### Key Dependencies
```json
{
  "express": "^5.2.1",
  "bcrypt": "^6.0.0",
  "jsonwebtoken": "^9.0.3",
  "zod": "^4.3.6",
  "@prisma/client": "^6.19.2",
  "helmet": "^8.1.0",
  "express-rate-limit": "^8.2.1",
  "winston": "^3.19.0",
  "swagger-ui-express": "^5.0.1"
}
```

---

## 📚 API Documentation

### Swagger UI (Interactive)

Access at: `http://localhost:3000/api-docs` (dev/staging only)

**Features:**
- Try-it-out functionality
- JWT authentication support (click "Authorize")
- Request/response examples
- Complete schema definitions

### Main API Routes

| Route | Description |
|-------|-------------|
| `/auth/*` | Authentication (login, signup, OTP, tokens) |
| `/master/*` | Master data (enums, religions, castes) |
| `/profile/*` | User profile management |
| `/search/*` | Profile search & matchmaking |
| `/interests/*` | Interest management |
| `/messages/*` | Messaging system |
| `/admin/*` | Admin panel operations |

---

## 🔐 Authentication System

### Token Flow

1. **Access Token**: 15-minute JWT for API requests
2. **Refresh Token**: 7-day token for obtaining new access tokens
3. **Token Rotation**: New refresh token issued on refresh

### Key Endpoints

```bash
# Login
POST /auth/login
Body: { "mobile": "9876543210", "password": "..." }
Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }

# Refresh Token
POST /auth/refresh-token
Body: { "refreshToken": "..." }
Response: { "accessToken": "...", "refreshToken": "..." }

# Logout Current Device
POST /auth/logout
Body: { "refreshToken": "..." }

# Logout All Devices
POST /auth/logout-all
Headers: Authorization: Bearer <accessToken>
```

### Frontend Integration

```javascript
// Store tokens
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// Make authenticated request
axios.get('/api/protected', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Auto-refresh on 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await axios.post('/auth/refresh-token', {
        refreshToken: localStorage.getItem('refreshToken')
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      error.config.headers['Authorization'] = `Bearer ${data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 🔒 Authorization

### Middleware Functions

```javascript
import { auth } from './middleware/auth.js';
import { authorizeRole, authorizePermission, checkOwnership } from './middleware/authorization.js';

// Role-based: Only ADMIN
router.get('/admin/dashboard', auth, authorizeRole(['ADMIN']), getDashboard);

// Permission-based: Any user with permission
router.delete('/users/:id', auth, authorizePermission(['delete_users']), deleteUser);

// Ownership: User can only edit their own profile
router.put('/profile/:userId', 
  auth, 
  authorizePermission(['edit_own_profile']),
  checkOwnership('userId'), 
  updateProfile
);
```

### Special Behaviors
- ✅ ADMIN role bypasses all permission checks
- ✅ Inactive users are automatically blocked
- ✅ Failed authorization attempts are audit logged
- ✅ Multiple permissions use OR logic (user needs any one)

---

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts (15+ fields)
- **user_profiles** - Personal details
- **caste_details** - Religion/caste info
- **education_details** - Education & career
- **horoscope_details** - Horoscope info
- **partner_preferences** - Matchmaking criteria
- **photos** - Profile photos
- **interests** - Interest sent/received
- **messages** - Direct messaging
- **conversations** - Message threads

### Master Data (Pre-seeded)
- **religions** (10) → **castes** (92) → **sub_castes** (62)
- **roles** (3) → **permissions** (38)
- **enums** (13 types: Gender, MaritalStatus, EmploymentType, etc.)

### Get All Master Data

```bash
GET /master/all
```

Response includes:
- All enums (gender, maritalStatus, physicalStatus, etc.)
- Religions with nested castes and sub-castes
- Permissions mapped to roles

---

## 🎯 Key Features

### 1. Profile Completion Caching
- **Problem**: Completion calculated on every dashboard load
- **Solution**: Cached in `users.profile_completion_percentage`
- **Result**: 3-4x faster dashboard loads

```javascript
import { getProfileCompletionPercentage, updateProfileCompletionCache } from './utils/profileCompletion.js';

// Get cached completion (fast)
const completion = await getProfileCompletionPercentage(userId);

// Update cache after profile change
await updateProfileCompletionCache(userId);
```

### 2. Master Data API
Single endpoint for all dropdown data:

```javascript
// Get all master data (one call)
const { data } = await fetch('/master/all');

// Cascading dropdowns
const religions = await fetch('/master/religions');
const castes = await fetch(`/master/castes/${religionId}`);
const subCastes = await fetch(`/master/sub-castes/${casteId}`);
```

### 3. Validation Helpers

```javascript
import { isValidMaritalStatus, isValidEmploymentType } from './types/enums.js';

if (!isValidMaritalStatus(input)) {
  throw new Error('Invalid marital status');
}
```

### 4. Password Management
- Bcrypt hashing (10 rounds)
- Forgot password with OTP
- Reset password (revokes all tokens)
- Change password (revokes all tokens)

### 5. OTP System
- 6-digit crypto-random OTP
- 10-minute expiration
- Rate limiting (5 attempts/15 min)
- SMS integration ready

---

## 📊 Development Progress

**See:** [BACKEND_DEVELOPMENT_PLAN.md](BACKEND_DEVELOPMENT_PLAN.md) for complete roadmap and task details.

### Completed Features (~85%)
✅ Authentication & JWT  
✅ Profile Management (Personal, Caste, Education, Horoscope)  
✅ Partner Preferences  
✅ Photo Management  
✅ Search & Matchmaking  
✅ Interest System  
✅ Messaging System  
✅ Admin Panel  
✅ Master Data & Enums  
✅ Swagger Documentation  

### In Progress (~15%)
🔄 Subscription Management  
🔄 Advanced Analytics  
🔄 Payment Integration  

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Specific test suites
npm run test:feature-gating
npm run test:plans
```

### Manual Testing
- Use Swagger UI at `/api-docs`
- Check test scripts in root directory (e.g., `test-sms.js`)

---

## 📁 Project Structure

```
Backend/
├── index.js                 # Server entry point
├── prisma/
│   ├── schema.prisma       # Database schema (310 lines)
│   └── seed.js             # Database seeding
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── types/              # Enums and type definitions
│   └── utils/              # Helper functions
├── tests/                  # Test suites
├── logs/                   # Application logs
└── documentation/          # Detailed documentation
```

---

## 🛡️ Security Features

- ✅ Helmet.js for HTTP headers
- ✅ Rate limiting (100 req/15min)
- ✅ XSS protection
- ✅ MongoDB injection sanitization
- ✅ JWT token expiration
- ✅ Password hashing with bcrypt
- ✅ Refresh token rotation
- ✅ Audit logging for sensitive operations

---

## 🤝 Contributing

### Team Structure (3 Developers)

| Developer | Focus Areas |
|-----------|-------------|
| **Dev 1** | Authentication, User Management, Profile Management |
| **Dev 2** | Search/Matchmaking, Interests, Messaging |
| **Dev 3** | Admin Panel, Subscriptions, Media, Reports |

### Development Workflow

1. Check [BACKEND_DEVELOPMENT_PLAN.md](BACKEND_DEVELOPMENT_PLAN.md) for assigned tasks
2. Create feature branch: `git checkout -b feature/task-x.x`
3. Implement with tests
4. Submit pull request

---

## 📝 License

ISC
