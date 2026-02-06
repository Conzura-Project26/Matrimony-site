# Task 5.5: User Reporting - Quick Reference

**Phase 5 - Task 5.5** | User Reporting System  
**Status:** ✅ Complete | **Date:** Feb 5, 2026

---

## 🚀 Quick Start

### 1. Get Report Reasons
```bash
curl -X GET http://localhost:3000/reports/reasons \
  -H "Authorization: Bearer <token>"
```

### 2. Submit Report
```bash
curl -X POST http://localhost:3000/reports/550e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "FAKE_PROFILE",
    "reason": "This user is using stolen photos and fake information"
  }'
```

### 3. View My Reports
```bash
curl -X GET "http://localhost:3000/reports/my-reports?type=all&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## 📍 API Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/reports/reasons` | Get report categories | ✅ | 100/15min |
| GET | `/master/report-reasons` | Get report categories (alt) | ✅ | 100/15min |
| POST | `/reports/:userId` | Submit report | ✅ | **5/24h** |
| GET | `/reports/my-reports` | View my reports | ✅ | 100/15min |

---

## 📊 Report Categories & Severity

| Category | Label | Severity | Description |
|----------|-------|----------|-------------|
| `UNDERAGE` | Underage User | **CRITICAL** | User appears under 18 years old |
| `SCAM` | Scam/Fraud | **CRITICAL** | Scams, fraud, money requests |
| `HARASSMENT` | Harassment | **HIGH** | Threatening, bullying behavior |
| `FAKE_PROFILE` | Fake Profile | **HIGH** | Fake info, stolen photos |
| `MARRIED` | Married/In Relationship | **HIGH** | Already married/committed |
| `INAPPROPRIATE_PHOTO` | Inappropriate Photo | **MEDIUM** | Explicit/offensive photos |
| `INAPPROPRIATE_CONTENT` | Inappropriate Content | **MEDIUM** | Offensive material/messages |
| `DUPLICATE_PROFILE` | Duplicate Profile | **MEDIUM** | Multiple accounts |
| `OFFENSIVE_BEHAVIOR` | Offensive Behavior | **MEDIUM** | Disrespectful conduct |
| `SPAM` | Spam | **LOW** | Spam messages/promotions |
| `OTHER` | Other | **LOW** | Other policy violations |

**Note:** Severity is auto-determined by system. Users cannot set it.

---

## ✅ Validation Rules

### POST /reports/:userId

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `category` | enum | ✅ Yes | Must be valid ReportCategory |
| `reason` | string | ✅ Yes | 10-1000 characters |
| `userId` (path) | UUID | ✅ Yes | Must exist, cannot be self |

### Business Rules
- ❌ Cannot report yourself
- ❌ Cannot submit duplicate report (same category + active status)
- ✅ Can report blocked users
- ✅ Can report same user for different categories
- ⏱️ Max 5 reports per 24 hours

---

## 🔍 Query Parameters (GET /reports/my-reports)

| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `type` | string | `all` | `made`, `received`, `all` |
| `page` | integer | `1` | Min: 1 |
| `limit` | integer | `20` | Min: 1, Max: 50 |
| `status` | enum | - | OPEN, IN_REVIEW, ACTION_TAKEN, RESOLVED, DISMISSED, ESCALATED |
| `category` | enum | - | Any ReportCategory |
| `created_from` | datetime | - | ISO 8601 format |
| `created_to` | datetime | - | ISO 8601 format |
| `sort_by` | string | `created_at` | `created_at`, `updated_at` |
| `sort_order` | string | `desc` | `asc`, `desc` |

**Example:**
```
/reports/my-reports?type=made&status=OPEN&sort_by=created_at&sort_order=desc&page=1&limit=20
```

---

## 📝 Response Examples

### Get Report Reasons - Success
```json
{
  "success": true,
  "message": "Report reasons retrieved successfully",
  "data": {
    "categories": [
      {
        "value": "FAKE_PROFILE",
        "label": "Fake Profile",
        "description": "Report profiles with fake information, stolen photos, or impersonation"
      }
    ]
  }
}
```

### Create Report - Success
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "report_id": 123,
    "status": "OPEN",
    "created_at": "2026-02-05T10:30:00.000Z"
  }
}
```

### View My Reports - Success
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "reports": [
      {
        "id": 123,
        "category": "FAKE_PROFILE",
        "severity": "HIGH",
        "status": "OPEN",
        "reason": "Detailed reason...",
        "created_at": "2026-02-05T10:30:00.000Z",
        "updated_at": "2026-02-05T10:30:00.000Z",
        "resolved_at": null,
        "report_type": "made",
        "other_party": {
          "id": "uuid",
          "full_name": "User Name",
          "profile_id": "SAR12345"
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasMore": false
    },
    "filters": {
      "type": "all",
      "status": null,
      "category": null
    }
  }
}
```

---

## ⚠️ Error Responses

### 400 - Self Report
```json
{
  "success": false,
  "message": "You cannot report yourself"
}
```

### 400 - Duplicate Report
```json
{
  "success": false,
  "message": "You have already reported this user for FAKE_PROFILE. Your previous report is being reviewed."
}
```

### 400 - Rate Limit (Service)
```json
{
  "success": false,
  "message": "You have exceeded the maximum number of reports (5) in 24 hours. Please try again later."
}
```

### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "reason",
      "message": "Reason must be at least 10 characters"
    }
  ]
}
```

### 404 - User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 429 - Rate Limit (Middleware)
```json
{
  "success": false,
  "message": "You have exceeded the maximum number of reports (5) in 24 hours. Please try again later.",
  "statusCode": 429,
  "retryAfter": "24 hours"
}
```

---

## 🤖 Pattern Detection & Auto-Flagging

### Trigger Condition
**3 or more reports within 7 days**

### Automatic Actions
1. ✅ User flagged (`is_flagged = true`)
2. ✅ Moderation flags updated:
   ```json
   {
     "auto_flagged": true,
     "reason": "Multiple reports received",
     "flagged_at": "2026-02-05T10:30:00.000Z",
     "report_count": 3
   }
   ```
3. ✅ Feature restrictions applied:
   - **CHAT**: Restricted for 7 days
   - **INTEREST**: Restricted for 7 days
4. ✅ Warning log created

### Admin Review
- Admins can view flagged users via `/admin/users?is_flagged=true`
- Restrictions can be modified/lifted via admin panel
- Pattern visible in user's report history

---

## 🔔 Moderator Notifications

### When Triggered
Every new report submission

### Notification Details
- **Type:** `NEW_REPORT`
- **Title:** `"New [SEVERITY] Report: [CATEGORY]"`
- **Message:** `"A new report has been submitted against user [PROFILE_ID]"`
- **Recipients:** All active MODERATOR role users
- **Delivery:** In-app only (no email)

### Metadata
```json
{
  "report_id": 123,
  "category": "FAKE_PROFILE",
  "severity": "HIGH"
}
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | JWT required on all endpoints |
| **Self-Report Prevention** | `reported_by !== reported_user` |
| **Rate Limiting** | 5 reports per 24h (middleware + service) |
| **Duplicate Prevention** | Check active reports for same category |
| **Input Validation** | Zod schemas validate all inputs |
| **Privacy Protection** | Admin data not exposed to users |
| **Audit Trail** | All reports logged with timestamps |

---

## 📂 Code Locations

```
Backend/src/
├── routes/reportRoutes.js              # User report routes
├── controllers/reportController.js     # User report handlers
├── services/reportService.js           # Business logic
├── middleware/rateLimiter.js           # Rate limiting
└── utils/validation.js                 # Input validation

Backend/documentation/
├── TASK_5.5_USER_REPORTING_SUMMARY.md  # Full documentation
├── TASK_5.5_TESTING_GUIDE.md           # Testing guide
└── TASK_5.5_QUICK_REFERENCE.md         # This file
```

---

## 🧪 Testing Checklist

```bash
# Get report reasons
✅ Success (200)
✅ Unauthorized (401)

# Create report
✅ Valid submission (201)
✅ Self-report blocked (400)
✅ User not found (404)
✅ Duplicate blocked (409)
✅ Rate limit (429)
✅ Invalid category (400)
✅ Reason too short (400)
✅ Missing fields (400)

# Severity auto-determination
✅ CRITICAL: UNDERAGE, SCAM
✅ HIGH: HARASSMENT, FAKE_PROFILE, MARRIED
✅ MEDIUM: INAPPROPRIATE_PHOTO, etc.
✅ LOW: SPAM, OTHER

# View my reports
✅ Get all (made + received)
✅ Filter by type
✅ Filter by status
✅ Filter by category
✅ Date range filter
✅ Pagination
✅ Sorting
✅ Privacy maintained

# Pattern detection
✅ Auto-flag at 3 reports in 7 days
✅ Feature restrictions applied
✅ Below threshold - no action

# Moderator notifications
✅ Notification sent
✅ All moderators notified
✅ Content correct
```

---

## 🎯 Common Use Cases

### Use Case 1: User Reports Fake Profile
```javascript
// 1. User views suspicious profile
GET /profiles/550e8400-e29b-41d4-a716-446655440002

// 2. User gets report reasons
GET /reports/reasons

// 3. User submits report
POST /reports/550e8400-e29b-41d4-a716-446655440002
{
  "category": "FAKE_PROFILE",
  "reason": "Photos are stolen from Instagram account @realuser"
}

// 4. User checks report status
GET /reports/my-reports?type=made
```

### Use Case 2: User Checks Reports Against Them
```javascript
// User wants to see if they've been reported
GET /reports/my-reports?type=received&status=OPEN
```

### Use Case 3: Moderator Reviews New Report
```javascript
// 1. Moderator receives notification
GET /notifications

// 2. Moderator views report details (admin endpoint)
GET /admin/reports/123

// 3. Moderator takes action (admin endpoint)
PUT /admin/reports/123/status
{
  "status": "IN_REVIEW",
  "admin_notes": "Investigating..."
}
```

---

## 💡 Best Practices

### For Frontend Developers
1. ✅ Show report reasons before submission
2. ✅ Display character count for reason (10-1000)
3. ✅ Handle rate limit gracefully (show countdown)
4. ✅ Confirm before submission
5. ✅ Show success message after report
6. ✅ Provide "View My Reports" link

### For Backend Developers
1. ✅ Monitor pattern detection accuracy
2. ✅ Review auto-flagging decisions weekly
3. ✅ Check notification delivery rate
4. ✅ Analyze report category distribution
5. ✅ Investigate rate limit violations

### For Moderators
1. ✅ Review CRITICAL reports immediately
2. ✅ Check auto-flagged users daily
3. ✅ Document resolution decisions
4. ✅ Look for abuse patterns
5. ✅ Communicate with admins on trends

---

## 🔗 Related Endpoints

| Endpoint | Purpose | Task |
|----------|---------|------|
| `GET /admin/reports` | Admin view all reports | 5.4 |
| `GET /admin/reports/:id` | Admin report details | 5.4 |
| `PUT /admin/reports/:id/status` | Update report status | 5.4 |
| `PUT /admin/reports/:id/action` | Take moderation action | 5.4 |
| `GET /notifications` | View notifications | 4.6 |
| `GET /admin/users?is_flagged=true` | View flagged users | 5.1 |

---

## 📞 Support

### Questions?
- **Documentation:** See [TASK_5.5_USER_REPORTING_SUMMARY.md](./TASK_5.5_USER_REPORTING_SUMMARY.md)
- **Testing:** See [TASK_5.5_TESTING_GUIDE.md](./TASK_5.5_TESTING_GUIDE.md)
- **Admin Features:** See [TASK_5.4_REPORT_MANAGEMENT_SUMMARY.md](./TASK_5.4_REPORT_MANAGEMENT_SUMMARY.md)

### Issues?
- Check logs: `Backend/logs/`
- Review rate limits in `rateLimiter.js`
- Verify notification service is running
- Confirm moderator roles assigned correctly

---

## ✅ Status

**Task 5.5: User Reporting - ✅ COMPLETE**

**Implemented:**
- ✅ 3 API endpoints
- ✅ Auto-severity determination
- ✅ Pattern detection & auto-flagging
- ✅ Moderator notifications
- ✅ Rate limiting (5/24h)
- ✅ Duplicate prevention
- ✅ Comprehensive filtering

**Next:** Task 5.6 - Audit Logging

---

**Last Updated:** February 5, 2026  
**Version:** 1.0.0
