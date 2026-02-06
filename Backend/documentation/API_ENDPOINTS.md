# SarvVivah API Endpoints - Complete Reference

## 📖 Overview

Complete documentation of all **183+ API endpoints** implemented in the SarvVivah matrimony platform backend.

**Base URL:** `http://localhost:3000`

---

## 🔗 Interactive API Documentation

**Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

The Swagger UI provides:
- ✅ Interactive testing (try-it-out functionality)
- ✅ JWT authentication support (click "Authorize" button)
- ✅ Request/response examples
- ✅ Complete schema definitions
- ✅ Real-time API testing from browser

**Note:** Swagger UI is available in development and staging environments only.

---

## 📋 Table of Contents

1. [Authentication Routes](#1-authentication-routes) (12 endpoints)
2. [User Profile Management](#2-user-profile-management) (31 endpoints)
3. [Photo Management](#3-photo-management) (4 endpoints)
4. [Master Data](#4-master-data) (9 endpoints)
5. [Search & Profile Listing](#5-search--profile-listing) (4 endpoints)
6. [Matchmaking & Recommendations](#6-matchmaking--recommendations) (5 endpoints)
7. [Interests Management](#7-interests-management) (6 endpoints)
8. [Messaging System](#8-messaging-system) (8 endpoints)
9. [Shortlist Management](#9-shortlist-management) (5 endpoints)
10. [Blocking System](#10-blocking-system) (3 endpoints)
11. [Contact Views](#11-contact-views) (2 endpoints)
12. [Profile Views](#12-profile-views) (5 endpoints)
13. [Reporting System](#13-reporting-system) (3 endpoints)
14. [Notifications](#14-notifications) (6 endpoints)
15. [Subscription Management](#15-subscription-management) (9 endpoints)
16. [Admin Routes](#16-admin-routes) (60+ endpoints)
17. [Testing Routes](#17-testing-routes) (11 endpoints)

---

## 1. Authentication Routes

**Base Path:** `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/auth/send-otp` | ❌ Public | Send OTP to mobile number for signup |
| **POST** | `/auth/verify-otp` | ❌ Public | Verify OTP for signup |
| **POST** | `/auth/signup` | ❌ Public | Complete user registration after OTP verification |
| **POST** | `/auth/login` | ❌ Public | Login with mobile/email and password |
| **POST** | `/auth/create-admin` | 🔐 Optional | Create admin or moderator account (requires admin secret) |
| **POST** | `/auth/forgot-password` | ❌ Public | Request password reset OTP |
| **POST** | `/auth/verify-forgot-otp` | ❌ Public | Verify OTP for password reset |
| **POST** | `/auth/reset-password` | ❌ Public | Reset password after OTP verification |
| **POST** | `/auth/change-password` | 🔐 JWT | Change password (authenticated users) |
| **POST** | `/auth/refresh-token` | ❌ Public | Refresh access token using refresh token |
| **POST** | `/auth/logout` | 🔐 JWT | Logout from current device |
| **POST** | `/auth/logout-all` | 🔐 JWT | Logout from all devices |

**Key Features:**
- JWT access token (15 minutes validity)
- Refresh token (7 days validity)
- Token rotation on refresh
- OTP-based verification (10 minutes validity)
- Rate limiting on critical endpoints

---

## 2. User Profile Management

**Base Path:** `/users/:userId`

### 2.1 Personal Details

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/personal` | 🔐 JWT | Create personal details (height, weight, marital status, etc.) |
| **PUT** | `/users/:userId/personal` | 🔐 JWT | Update personal details |
| **GET** | `/users/:userId/personal` | 🔐 JWT | Get personal details |

### 2.2 Caste/Religion Details

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/caste` | 🔐 JWT | Create caste/religion details |
| **PUT** | `/users/:userId/caste` | 🔐 JWT | Update caste/religion details |
| **GET** | `/users/:userId/caste` | 🔐 JWT | Get caste/religion details |

### 2.3 Education Details

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/education` | 🔐 JWT | Add new education entry |
| **PUT** | `/users/:userId/education/:eduId` | 🔐 JWT | Update education entry |
| **DELETE** | `/users/:userId/education/:eduId` | 🔐 JWT | Delete education entry |
| **GET** | `/users/:userId/education` | 🔐 JWT | Get all education entries |

### 2.4 Professional Details

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/professional` | 🔐 JWT | Create professional details |
| **PUT** | `/users/:userId/professional` | 🔐 JWT | Update professional details (full replacement) |
| **PATCH** | `/users/:userId/professional` | 🔐 JWT | Patch professional details (partial update) |
| **GET** | `/users/:userId/professional` | 🔐 JWT | Get professional details |

### 2.5 Family Details

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/family` | 🔐 JWT | Create family details |
| **PUT** | `/users/:userId/family` | 🔐 JWT | Update family details |
| **GET** | `/users/:userId/family` | 🔐 JWT | Get family details |

### 2.6 Horoscope Details

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/horoscope` | 🔐 JWT | Create horoscope details (rasi, nakshatra, birth time) |
| **PUT** | `/users/:userId/horoscope` | 🔐 JWT | Update horoscope details |
| **GET** | `/users/:userId/horoscope` | 🔐 JWT | Get horoscope details |

### 2.7 Partner Preferences

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/preferences` | 🔐 JWT | Create partner preferences |
| **PUT** | `/users/:userId/preferences` | 🔐 JWT | Update partner preferences |
| **GET** | `/users/:userId/preferences` | 🔐 JWT | Get partner preferences |
| **POST** | `/users/:userId/preferences/match/:targetUserId` | 🔐 JWT | Calculate compatibility score with target user |

### 2.8 Profile Completion & Verification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/users/:userId/profile` | 🔐 JWT | Get complete user profile (all sections) |
| **GET** | `/users/:userId/profile-completion` | 🔐 JWT | Get profile completion with section breakdown |
| **GET** | `/users/:userId/completion-percentage` | 🔐 JWT | Get profile completion percentage (cached, fast) |
| **GET** | `/users/:userId/verification-status` | 🔐 JWT | Get verification status details |

---

## 3. Photo Management

**Base Path:** `/users/:userId/photos`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/users/:userId/photos` | 🔐 JWT | Upload new photo (max 5 per user) |
| **GET** | `/users/:userId/photos` | 🔐 JWT | Get all photos for a user |
| **DELETE** | `/users/:userId/photos/:photoId` | 🔐 JWT | Delete a photo |
| **PATCH** | `/users/:userId/photos/:photoId/primary` | 🔐 JWT | Set photo as primary |

**Upload Limits:**
- Max 5 photos per user
- Photos require admin approval before visibility
- Supported formats: JPG, PNG, WebP

---

## 4. Master Data

**Base Path:** `/master`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/master/enums` | 🔐 JWT | Get all enum options (gender, marital status, etc.) |
| **GET** | `/master/religions` | 🔐 JWT | Get all religions |
| **GET** | `/master/castes/:religionId` | 🔐 JWT | Get castes by religion ID |
| **GET** | `/master/sub-castes/:casteId` | 🔐 JWT | Get sub-castes by caste ID |
| **GET** | `/master/all` | 🔐 JWT | Get all master data in one call (enums + religions) |
| **GET** | `/master/religions/:religionId/hierarchy` | 🔐 JWT | Get religion with nested castes and sub-castes |
| **GET** | `/master/states` | 🔐 JWT | Get all Indian states |
| **GET** | `/master/cities` | 🔐 JWT | Get cities by state with search support |
| **GET** | `/master/report-reasons` | 🔐 JWT | Get report reasons/categories |

**Pre-seeded Data:**
- 10 Religions
- 92 Castes
- 62 Sub-Castes
- 13 Enum Types
- Indian States & Cities

---

## 5. Search & Profile Listing

**Base Paths:** `/search`, `/profiles`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/search/profiles` | 🔐 JWT | Simple profile search with query params |
| **POST** | `/search/advanced` | 🔐 JWT + 💎 Premium | Advanced profile search with complex filters |
| **GET** | `/search/profile/:profileId` | 🔐 JWT | Search profile by custom profile ID |
| **GET** | `/profiles` | 🔐 JWT | Get all profiles with filters, sorting & pagination |

**Search Filters:**
- Age range
- Height range
- Religion, Caste, Sub-caste
- Education level
- Occupation
- Location (state, city)
- Marital status
- Physical status

**Sorting Options:**
- Recently joined
- Profile completion
- Match score
- Last active

---

## 6. Matchmaking & Recommendations

**Base Path:** `/profiles`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/profiles/recommended` | 🔐 JWT | Get AI-recommended profiles based on preferences |
| **GET** | `/profiles/daily-matches` | 🔐 JWT | Get daily curated matches (10 per day) |
| **GET** | `/profiles/new-matches` | 🔐 JWT | Get new matches since last check |
| **GET** | `/profiles/new-matches/count` | 🔐 JWT | Get count of unseen new matches |
| **POST** | `/matches/:matchId/view` | 🔐 JWT | Record match profile view (analytics) |

**Matching Algorithm:**
- Partner preference compatibility
- Religion/Caste matching
- Age, height, education compatibility
- Location preference matching
- Horoscope compatibility (optional)

---

## 7. Interests Management

**Base Path:** `/interests`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/interests/:receiverId` | 🔐 JWT + 💎 Feature | Send interest to another user |
| **GET** | `/interests/sent` | 🔐 JWT | Get sent interests with status filters |
| **GET** | `/interests/received` | 🔐 JWT | Get received interests (inbox) |
| **PUT** | `/interests/:interestId/accept` | 🔐 JWT | Accept interest request |
| **PUT** | `/interests/:interestId/reject` | 🔐 JWT | Reject interest request |
| **DELETE** | `/interests/:interestId` | 🔐 JWT | Withdraw sent interest (before response) |

**Interest Status:**
- PENDING - Awaiting response
- ACCEPTED - Mutual interest
- REJECTED - Declined

**Feature Gating:**
- Free users: Limited interests per day
- Premium users: Unlimited interests

---

## 8. Messaging System

**Base Path:** `/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/messages/conversations` | 🔐 JWT | Get all conversations (inbox) |
| **GET** | `/messages/unread-count` | 🔐 JWT | Get global unread message count |
| **POST** | `/messages/:userId` | 🔐 JWT + 💎 Feature | Send message to a user |
| **GET** | `/messages/:userId` | 🔐 JWT | Get conversation with a user |
| **DELETE** | `/messages/conversations/:userId` | 🔐 JWT | Delete entire conversation (soft delete) |
| **POST** | `/messages/conversations/:userId/archive` | 🔐 JWT | Archive conversation |
| **DELETE** | `/messages/conversations/:userId/archive` | 🔐 JWT | Unarchive conversation |
| **DELETE** | `/messages/:messageId` | 🔐 JWT | Delete single message (soft delete) |

**Messaging Features:**
- Real-time messaging
- Read/unread status tracking
- Message archiving
- Conversation soft delete
- Pagination support

**Feature Gating:**
- Free users: Can only message accepted interests
- Premium users: Can message anyone

---

## 9. Shortlist Management

**Base Path:** `/shortlist`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/shortlist/:userId` | 🔐 JWT | Add profile to shortlist (favorites) |
| **DELETE** | `/shortlist/:userId` | 🔐 JWT | Remove profile from shortlist |
| **GET** | `/shortlist` | 🔐 JWT | Get my shortlist with pagination |
| **GET** | `/shortlist/:userId/status` | 🔐 JWT | Check shortlist status (mutual check) |
| **GET** | `/shortlisted-by` | 🔐 JWT + 💎 Premium | Get who shortlisted me |

**Privacy:**
- Users cannot see who shortlisted them (unless Premium)
- Shortlist is completely private
- No notifications sent

---

## 10. Blocking System

**Base Path:** `/blocks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/blocks/:userId` | 🔐 JWT | Block a user (prevents all interactions) |
| **DELETE** | `/blocks/:userId` | 🔐 JWT | Unblock a user |
| **GET** | `/blocks` | 🔐 JWT | Get list of blocked users |

**Blocking Effects:**
- User won't appear in search results
- Cannot send interests or messages
- Existing conversations hidden
- Profile views prevented

---

## 11. Contact Views

**Base Path:** `/contacts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/contacts/history` | 🔐 JWT | Get my contact view history |
| **GET** | `/contacts/:userId` | 🔐 JWT + 💎 Premium | View user contact details (phone/email) |

**Feature Gating:**
- Free users: Limited contact views per month
- Premium users: Unlimited contact views
- Gold users: Unlimited + priority support

---

## 12. Profile Views

**Base Path:** `/profiles` (views), `/profile` (analytics)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/profiles/:profileId/view` | 🔐 JWT | Record a profile view (analytics) |
| **GET** | `/profile/viewers` | 🔐 JWT + 💎 Premium | Get who viewed my profile |
| **GET** | `/profile/viewed` | 🔐 JWT | Get profiles I viewed (history) |
| **GET** | `/profile/viewers/count` | 🔐 JWT | Get count of profile viewers |
| **GET** | `/profile/viewed/count` | 🔐 JWT | Get count of profiles I viewed |

**Privacy:**
- Free users: Can only see viewer count
- Premium users: Can see who viewed their profile
- Views are tracked automatically on profile access

---

## 13. Reporting System

**Base Path:** `/reports`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/reports/reasons` | 🔐 JWT | Get report reasons/categories |
| **GET** | `/reports/my-reports` | 🔐 JWT | View my reports (made and received) |
| **POST** | `/reports/:userId` | 🔐 JWT | Report a user |

**Report Categories:**
- FAKE_PROFILE
- HARASSMENT
- SPAM
- INAPPROPRIATE_CONTENT
- SCAM
- FAKE_PHOTOS
- ABUSIVE_BEHAVIOR
- OTHER

**Report Status:**
- OPEN - Under review
- IN_REVIEW - Being investigated
- RESOLVED - Action taken
- DISMISSED - No action needed

---

## 14. Notifications

**Base Path:** `/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/notifications` | 🔐 JWT | Get notifications with filters & pagination |
| **GET** | `/notifications/unread/count` | 🔐 JWT | Get unread notification count |
| **PUT** | `/notifications/:id/read` | 🔐 JWT | Mark notification as read |
| **PUT** | `/notifications/mark-all-read` | 🔐 JWT | Mark all notifications as read |
| **DELETE** | `/notifications/:id` | 🔐 JWT | Delete single notification |
| **DELETE** | `/notifications/clear-all` | 🔐 JWT | Clear all notifications |

**Notification Types:**
- Interest received/accepted/rejected
- New message
- Profile viewed
- Match found
- Subscription expiring
- Admin actions

---

## 15. Subscription Management

**Base Paths:** `/subscriptions`, `/plans`

### 15.1 User Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/subscriptions/current` | 🔐 JWT | Get current active subscription |
| **GET** | `/subscriptions/history` | 🔐 JWT | Get subscription history |
| **POST** | `/subscriptions/subscribe` | 🔐 JWT | Subscribe to a plan |
| **POST** | `/subscriptions/:subscriptionId/renew` | 🔐 JWT | Renew subscription |
| **POST** | `/subscriptions/:subscriptionId/cancel` | 🔐 JWT | Cancel subscription |
| **PATCH** | `/subscriptions/:subscriptionId/auto-renew` | 🔐 JWT | Toggle auto-renew |

### 15.2 Public Plans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/plans` | ❌ Public | Get all active subscription plans |
| **GET** | `/plans/:planId` | ❌ Public | Get specific plan by ID |
| **GET** | `/plans/code/:code` | ❌ Public | Get plan by code (FREE, BASIC, PREMIUM, GOLD) |

**Available Plans:**
1. **FREE** - Basic features, limited usage
2. **BASIC** - More interests, profile views
3. **PREMIUM** - Unlimited features, advanced search
4. **GOLD** - Everything + priority support

---

## 16. Admin Routes

**Base Path:** `/admin`  
**Required Role:** ADMIN or MODERATOR

### 16.1 Photo Moderation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/admin/photos/pending` | 🔐 Admin | Get pending photos for moderation |
| **PATCH** | `/admin/photos/:photoId/approve` | 🔐 Admin | Approve a photo |
| **DELETE** | `/admin/photos/:photoId` | 🔐 Admin | Reject/delete a photo |
| **PATCH** | `/admin/photos/bulk-approve` | 🔐 Admin | Bulk approve photos (max 50) |
| **DELETE** | `/admin/photos/bulk-reject` | 🔐 Admin | Bulk reject photos (max 50) |

### 16.2 User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/admin/users` | 🔐 Admin | Get all users with filters |
| **GET** | `/admin/users/analytics` | 🔐 Admin | Get user analytics/statistics |
| **GET** | `/admin/users/:id` | 🔐 Admin | Get detailed user information |
| **PUT** | `/admin/users/:id/status` | 🔐 Admin | Update user account status (active/inactive) |
| **PUT** | `/admin/users/:id/verify` | 🔐 Admin | Verify/unverify user profile |
| **DELETE** | `/admin/users/:id` | 🔐 Admin | Delete user (soft delete) |
| **POST** | `/admin/users/export` | 🔐 Admin | Export users data (async job) |
| **POST** | `/admin/users/bulk` | 🔐 Admin | Perform bulk operations on users |

### 16.3 Statistics & Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/admin/statistics/dashboard` | 🔐 Admin | Get aggregated dashboard statistics |
| **GET** | `/admin/statistics/users/summary` | 🔐 Admin | Get user summary with breakdowns |
| **GET** | `/admin/statistics/users/by-gender` | 🔐 Admin | Get user distribution by gender |
| **GET** | `/admin/statistics/users/by-religion` | 🔐 Admin | Get user distribution by religion |
| **GET** | `/admin/statistics/users/by-location` | 🔐 Admin | Get geographic distribution |
| **GET** | `/admin/statistics/users/by-age` | 🔐 Admin | Get age distribution |
| **GET** | `/admin/statistics/users/by-marital-status` | 🔐 Admin | Get marital status distribution |
| **GET** | `/admin/statistics/users/profile-completion` | 🔐 Admin | Get profile completion statistics |
| **GET** | `/admin/statistics/users/verification` | 🔐 Admin | Get verification statistics |
| **GET** | `/admin/statistics/registrations` | 🔐 Admin | Get registration trends |
| **GET** | `/admin/statistics/users/active/summary` | 🔐 Admin | Get active users summary (DAU/WAU/MAU) |
| **GET** | `/admin/statistics/users/active/trend` | 🔐 Admin | Get active users trend over time |
| **GET** | `/admin/statistics/users/active/demographics` | 🔐 Admin | Get active users demographics |
| **GET** | `/admin/statistics/users/engagement` | 🔐 Admin | Get engagement metrics |
| **GET** | `/admin/statistics/users/retention` | 🔐 Admin | Get user retention metrics |

### 16.4 Report Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/admin/reports` | 🔐 Admin | Get all user reports with filters |
| **GET** | `/admin/reports/statistics` | 🔐 Admin | Get report statistics |
| **GET** | `/admin/reports/:id` | 🔐 Admin | Get detailed report information |
| **PUT** | `/admin/reports/:id/status` | 🔐 Admin | Update report status |
| **PUT** | `/admin/reports/:id/action` | 🔐 Admin | Take moderation action on reported user |

### 16.5 Subscription Plan Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/admin/plans` | 🔐 Admin | Create new subscription plan |
| **PUT** | `/admin/plans/:planId` | 🔐 Admin | Update subscription plan |
| **DELETE** | `/admin/plans/:planId` | 🔐 Admin | Deactivate subscription plan |
| **PATCH** | `/admin/plans/:planId/reactivate` | 🔐 Admin | Reactivate deactivated plan |
| **POST** | `/admin/plans/:planId/version` | 🔐 Admin | Create new plan version |
| **GET** | `/admin/features` | 🔐 Admin | Get all features with gating rules |
| **POST** | `/admin/features` | 🔐 Admin | Create new feature |

### 16.6 Audit Logging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/admin/audit-logs` | 🔐 Admin | Get audit logs with filters |
| **GET** | `/admin/audit-logs/statistics` | 🔐 Admin | Get audit log statistics |
| **GET** | `/admin/audit-logs/export` | 🔐 Admin | Export audit logs to CSV |
| **GET** | `/admin/audit-logs/:id` | 🔐 Admin | Get single audit log by ID |
| **DELETE** | `/admin/audit-logs/cleanup` | 🔐 Admin | Cleanup old audit logs (manual trigger) |

---

## 17. Testing Routes

**Base Path:** `/test-errors`  
**Environment:** Development/Staging Only

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **GET** | `/test-errors/400` | ❌ Public | Test BadRequestError (400) |
| **GET** | `/test-errors/401` | ❌ Public | Test UnauthorizedError (401) |
| **GET** | `/test-errors/403` | ❌ Public | Test ForbiddenError (403) |
| **GET** | `/test-errors/404` | ❌ Public | Test NotFoundError (404) |
| **GET** | `/test-errors/409` | ❌ Public | Test ConflictError (409) |
| **GET** | `/test-errors/422` | ❌ Public | Test ValidationError (422) |
| **GET** | `/test-errors/500` | ❌ Public | Test DatabaseError (500) |
| **GET** | `/test-errors/prisma` | ❌ Public | Test Prisma error handling |
| **GET** | `/test-errors/async` | ❌ Public | Test async error handling |
| **GET** | `/test-errors/success` | ❌ Public | Test successful response format |
| **GET** | `/test-errors/detailed` | ❌ Public | Test error with details array |

---

## 📊 Summary Statistics

### Total Endpoints by Category

| Category | Count |
|----------|-------|
| **Authentication** | 12 |
| **User Profile Management** | 31 |
| **Photo Management** | 4 |
| **Master Data** | 9 |
| **Search & Profile Listing** | 4 |
| **Matchmaking & Recommendations** | 5 |
| **Interests Management** | 6 |
| **Messaging System** | 8 |
| **Shortlist Management** | 5 |
| **Blocking System** | 3 |
| **Contact Views** | 2 |
| **Profile Views** | 5 |
| **Reporting System** | 3 |
| **Notifications** | 6 |
| **Subscription Management** | 9 |
| **Admin Routes** | 60+ |
| **Testing Routes** | 11 |
| **TOTAL** | **183+** |

---

## 🔑 Authentication Types

| Symbol | Type | Description |
|--------|------|-------------|
| ❌ Public | No authentication required |
| 🔐 JWT | Requires valid JWT access token |
| 🔐 Admin | Requires admin/moderator role |
| 💎 Premium | Requires premium subscription |
| 💎 Feature | Feature-gated (plan-based limits) |

---

## 📝 Common Request Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 🔄 Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "details": [ /* optional error details */ ]
}
```

---

## 🚀 Getting Started

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Access Swagger UI:**
   ```
   http://localhost:3000/api-docs
   ```

3. **Test authentication flow:**
   - Send OTP → Verify OTP → Signup → Login
   - Get access token and refresh token
   - Use access token in Authorization header

4. **Explore endpoints:**
   - Use Swagger UI for interactive testing
   - Click "Authorize" and paste your JWT token
   - Test endpoints with try-it-out feature

---

## 📚 Additional Resources

- **Main README:** [README.md](README.md)
- **Development Plan:** [BACKEND_DEVELOPMENT_PLAN.md](BACKEND_DEVELOPMENT_PLAN.md)
- **Swagger UI:** http://localhost:3000/api-docs

---

**Last Updated:** February 6, 2026  
**API Version:** 1.0  
**Backend Version:** ~85% Complete
