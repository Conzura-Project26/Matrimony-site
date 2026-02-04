# Task 5.1: Admin User Management - Quick Reference

## 🚀 Quick Start

### Base URL
```
http://localhost:5000/admin
```

### Authentication
All endpoints require:
```http
Authorization: Bearer <admin_token>
```

---

## 📌 Endpoints at a Glance

| Method | Endpoint | Access | Rate Limit | Purpose |
|--------|----------|--------|------------|---------|
| GET | `/users` | ADMIN + MOD | 500/hr | List users with filters |
| GET | `/users/analytics` | ADMIN + MOD | 500/hr | Dashboard stats |
| GET | `/users/:id` | ADMIN + MOD | 500/hr | User details |
| PUT | `/users/:id/status` | ADMIN | 100/hr | Change status |
| PUT | `/users/:id/verify` | ADMIN | 100/hr | Verify profile |
| DELETE | `/users/:id` | ADMIN | 20/hr | Soft delete |
| POST | `/users/export` | ADMIN | 100/hr | Export data |
| POST | `/users/bulk` | ADMIN | 20/hr | Bulk operations |

---

## 🔍 Common Use Cases

### 1. Search for User by Name
```http
GET /admin/users?q=john&page=1&limit=20
```

### 2. Filter Active Verified Users
```http
GET /admin/users?is_active=true&is_profile_verified=true
```

### 3. Get Today's Registrations
```http
GET /admin/users?created_from=2026-02-04T00:00:00Z&sort_by=created_at&sort_order=desc
```

### 4. Suspend User
```http
PUT /admin/users/<user_id>/status
{
  "status": "SUSPENDED",
  "reason": "Policy violation"
}
```

### 5. Bulk Verify Profiles
```http
POST /admin/users/bulk
{
  "action": "VERIFY_PROFILE",
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "reason": "Manual verification batch"
}
```

---

## 🎯 Query Parameters (GET /admin/users)

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Search
- `q` - Search term (searches name, email, profile_id, mobile)

### Status Filters
- `is_active` - true/false
- `is_profile_verified` - true/false
- `is_email_verified` - true/false
- `is_mobile_verified` - true/false

### Role & Demographics
- `role` - USER | ADMIN | MODERATOR
- `gender` - Male | Female | Other
- `age_min` - Minimum age (18-100)
- `age_max` - Maximum age (18-100)
- `profile_completion_min` - Min completion % (0-100)

### Date Filters
- `created_from` - ISO datetime
- `created_to` - ISO datetime
- `last_active_from` - ISO datetime
- `last_active_to` - ISO datetime

### Sorting
- `sort_by` - created_at | last_active_at | profile_completion_percentage | full_name
- `sort_order` - asc | desc

---

## 📋 Request Bodies

### Update Status
```json
{
  "status": "ACTIVE | INACTIVE | SUSPENDED",
  "reason": "Min 10 characters"
}
```

### Verify Profile
```json
{
  "is_profile_verified": true
}
```

### Delete User
```json
{
  "reason": "Min 10 characters"
}
```

### Export Users
```json
{
  "format": "CSV",
  "filters": {
    "is_active": true,
    "role": "USER"
  }
}
```

### Bulk Operations
```json
{
  "action": "ACTIVATE | DEACTIVATE | SUSPEND | VERIFY_PROFILE",
  "user_ids": ["uuid1", "uuid2"],
  "reason": "Min 10 characters"
}
```

---

## 🛡️ Security Rules

### Access Control
- ✅ ADMIN can perform all operations
- ✅ MODERATOR can only VIEW (read-only)
- ❌ Cannot modify another admin's status
- ❌ Cannot delete admin accounts

### Rate Limits
- **Read (GET):** 500 requests/hour
- **Write (PUT/POST):** 100 requests/hour
- **Destructive (DELETE/bulk):** 20 requests/hour

### Validation
- All inputs validated with Zod schemas
- Required `reason` for destructive operations (min 10 chars)
- Max 100 users per bulk operation
- Max 100 items per page

---

## 📊 Response Format

### Success (200/202)
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## 🔗 Related Endpoints

### Photo Moderation
- GET `/admin/photos/pending` - Pending photos
- PATCH `/admin/photos/:photoId/approve` - Approve photo
- DELETE `/admin/photos/:photoId` - Reject photo

---

## 💻 Environment Setup

### Required ENV Variables
```env
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://...
NODE_ENV=development|production
```

### Start Server
```bash
cd Backend
npm run dev
```

### Access Swagger Docs
```
http://localhost:5000/api-docs
```

---

## 🧪 Testing Checklist

- [ ] Create admin user (use POST /auth/create-admin)
- [ ] Get admin JWT token (use POST /auth/login)
- [ ] Test list users with various filters
- [ ] Test analytics endpoint
- [ ] Test user details retrieval
- [ ] Test status update (ACTIVE → SUSPENDED)
- [ ] Test profile verification
- [ ] Test soft delete
- [ ] Test bulk operations
- [ ] Test export (should return job ID)
- [ ] Verify rate limiting works
- [ ] Verify MODERATOR can only read
- [ ] Verify audit logs are created

---

## 📝 Notes

- All timestamps in ISO 8601 format (UTC)
- User IDs are UUIDs
- Soft delete preserves all data
- Export is async (returns job ID)
- All admin actions logged in `audit_logs` table
- Deactivating user revokes all tokens and cancels interests

---

## 🆘 Troubleshooting

### 403 Forbidden
- Check if user has ADMIN/MODERATOR role
- Verify JWT token is valid
- Check if trying to modify another admin

### 429 Too Many Requests
- Wait for rate limit window to reset
- Check rate limit headers in response

### 404 Not Found
- Verify user ID is correct UUID format
- Check if user exists in database

### 400 Validation Error
- Check request body matches schema
- Verify all required fields present
- Check field formats (dates, UUIDs)

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
