# Task 5.5: User Reporting - Testing Guide

**Task:** Phase 5 - Task 5.5  
**Feature:** User Reporting System  
**Date:** February 5, 2026  
**Developer:** Dev 2 - Content Moderation

---

## 📋 Overview

This guide covers comprehensive testing for the user reporting system, which allows regular users to report other users for policy violations.

---

## 🔧 Prerequisites

1. **Authentication:** All endpoints require valid JWT token
2. **Test Users:** Create multiple test users for reporting scenarios
3. **Test Environment:** Use development/staging environment
4. **Rate Limiting:** Be aware of 5 reports per 24h limit

---

## 📝 Test Cases

### **Test Suite 1: Get Report Reasons**

#### Test 5.5.1: Get Report Reasons - Success
**Endpoint:** `GET /reports/reasons`

**Request:**
```http
GET /reports/reasons HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected Response:** `200 OK`
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
      },
      {
        "value": "HARASSMENT",
        "label": "Harassment",
        "description": "Report users engaging in harassment, bullying, or threatening behavior"
      },
      {
        "value": "INAPPROPRIATE_PHOTO",
        "label": "Inappropriate Photo",
        "description": "Report profiles with inappropriate, explicit, or offensive photos"
      },
      {
        "value": "SCAM",
        "label": "Scam/Fraud",
        "description": "Report users attempting scams, fraud, or requesting money"
      },
      {
        "value": "UNDERAGE",
        "label": "Underage User",
        "description": "Report profiles of users who appear to be under 18 years old"
      }
    ]
  }
}
```

**Validation:**
- ✅ Returns 11 categories total
- ✅ Each category has value, label, description
- ✅ Accessible to all authenticated users

---

#### Test 5.5.2: Get Report Reasons - Unauthorized
**Endpoint:** `GET /reports/reasons`

**Request:**
```http
GET /reports/reasons HTTP/1.1
Authorization: Bearer <invalid_token>
```

**Expected Response:** `401 Unauthorized`

---

### **Test Suite 2: Create User Report**

#### Test 5.5.3: Create Report - Valid Submission
**Endpoint:** `POST /reports/:userId`

**Request:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440002 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "FAKE_PROFILE",
  "reason": "This user is using stolen photos and fake information. The photos don't match and profile details are inconsistent."
}
```

**Expected Response:** `201 Created`
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

**Validation:**
- ✅ Report created with OPEN status
- ✅ Severity auto-determined (FAKE_PROFILE = HIGH)
- ✅ Report ID returned
- ✅ Moderators receive in-app notification
- ✅ Reporter can view report in my-reports

---

#### Test 5.5.4: Create Report - Self Report (Blocked)
**Endpoint:** `POST /reports/:userId`

**Request:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440001 HTTP/1.1
Authorization: Bearer <token_for_user_550e8400-e29b-41d4-a716-446655440001>
Content-Type: application/json

{
  "category": "HARASSMENT",
  "reason": "Testing self-report"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "You cannot report yourself"
}
```

---

#### Test 5.5.5: Create Report - User Not Found
**Endpoint:** `POST /reports/:userId`

**Request:**
```http
POST /reports/00000000-0000-0000-0000-000000000000 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "SPAM",
  "reason": "Testing with non-existent user"
}
```

**Expected Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "User not found"
}
```

---

#### Test 5.5.6: Create Report - Duplicate Report
**Endpoint:** `POST /reports/:userId`

**Scenario:** Submit same report twice

**First Request:** ✅ Success (201)

**Second Request:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440002 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "FAKE_PROFILE",
  "reason": "Duplicate report test"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "You have already reported this user for FAKE_PROFILE. Your previous report is being reviewed."
}
```

**Note:** Duplicate check is per category. You can report same user for different categories.

---

#### Test 5.5.7: Create Report - Rate Limit Exceeded
**Endpoint:** `POST /reports/:userId`

**Scenario:** Submit 6 reports within 24 hours

**Requests 1-5:** ✅ Success (201)

**Request 6:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440006 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "SPAM",
  "reason": "Sixth report within 24h"
}
```

**Expected Response:** `429 Too Many Requests`
```json
{
  "success": false,
  "message": "You have exceeded the maximum number of reports (5) in 24 hours. Please try again later."
}
```

---

#### Test 5.5.8: Create Report - Invalid Category
**Endpoint:** `POST /reports/:userId`

**Request:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440002 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "INVALID_CATEGORY",
  "reason": "Testing invalid category"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "category",
      "message": "Invalid enum value..."
    }
  ]
}
```

---

#### Test 5.5.9: Create Report - Reason Too Short
**Endpoint:** `POST /reports/:userId`

**Request:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440002 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "SPAM",
  "reason": "Too short"
}
```

**Expected Response:** `400 Bad Request`
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

---

#### Test 5.5.10: Create Report - Missing Required Fields
**Endpoint:** `POST /reports/:userId`

**Request:**
```http
POST /reports/550e8400-e29b-41d4-a716-446655440002 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "category": "HARASSMENT"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "reason",
      "message": "Required"
    }
  ]
}
```

---

### **Test Suite 3: Severity Auto-Determination**

#### Test 5.5.11: CRITICAL Severity - UNDERAGE
**Request:**
```json
{
  "category": "UNDERAGE",
  "reason": "This user appears to be under 18 years old based on their photos and profile information."
}
```

**Expected:** Report created with `severity: "CRITICAL"`

---

#### Test 5.5.12: CRITICAL Severity - SCAM
**Request:**
```json
{
  "category": "SCAM",
  "reason": "This user is requesting money and appears to be running a scam operation."
}
```

**Expected:** Report created with `severity: "CRITICAL"`

---

#### Test 5.5.13: HIGH Severity - HARASSMENT
**Request:**
```json
{
  "category": "HARASSMENT",
  "reason": "This user has been sending threatening and harassing messages repeatedly."
}
```

**Expected:** Report created with `severity: "HIGH"`

---

#### Test 5.5.14: MEDIUM Severity - INAPPROPRIATE_PHOTO
**Request:**
```json
{
  "category": "INAPPROPRIATE_PHOTO",
  "reason": "Profile contains inappropriate and explicit photos that violate community guidelines."
}
```

**Expected:** Report created with `severity: "MEDIUM"`

---

#### Test 5.5.15: LOW Severity - SPAM
**Request:**
```json
{
  "category": "SPAM",
  "reason": "User is sending spam messages with promotional content."
}
```

**Expected:** Report created with `severity: "LOW"`

---

### **Test Suite 4: View My Reports**

#### Test 5.5.16: Get My Reports - All (Default)
**Endpoint:** `GET /reports/my-reports`

**Request:**
```http
GET /reports/my-reports HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected Response:** `200 OK`
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
        "reason": "This user is using stolen photos...",
        "created_at": "2026-02-05T10:30:00.000Z",
        "updated_at": "2026-02-05T10:30:00.000Z",
        "resolved_at": null,
        "report_type": "made",
        "other_party": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "full_name": "Reported User",
          "profile_id": "SAR12345"
        }
      },
      {
        "id": 124,
        "category": "HARASSMENT",
        "severity": "HIGH",
        "status": "IN_REVIEW",
        "reason": "Received harassment report",
        "created_at": "2026-02-04T15:20:00.000Z",
        "updated_at": "2026-02-05T09:00:00.000Z",
        "resolved_at": null,
        "report_type": "received",
        "other_party": {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "full_name": "Reporter User",
          "profile_id": "SAR67890"
        }
      }
    ],
    "pagination": {
      "total": 2,
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

**Validation:**
- ✅ Shows both reports made and received
- ✅ `report_type` indicates "made" or "received"
- ✅ `other_party` shows relevant user info
- ✅ Admin notes NOT visible to users
- ✅ Action taken NOT visible to users

---

#### Test 5.5.17: Get My Reports - Only Reports I Made
**Endpoint:** `GET /reports/my-reports?type=made`

**Request:**
```http
GET /reports/my-reports?type=made HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Only shows reports where current user is reporter

---

#### Test 5.5.18: Get My Reports - Only Reports Against Me
**Endpoint:** `GET /reports/my-reports?type=received`

**Request:**
```http
GET /reports/my-reports?type=received HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Only shows reports where current user is reported user

---

#### Test 5.5.19: Get My Reports - Filter by Status
**Endpoint:** `GET /reports/my-reports?status=OPEN`

**Request:**
```http
GET /reports/my-reports?status=OPEN&type=all HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Only shows reports with OPEN status

---

#### Test 5.5.20: Get My Reports - Filter by Category
**Endpoint:** `GET /reports/my-reports?category=HARASSMENT`

**Request:**
```http
GET /reports/my-reports?category=HARASSMENT HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Only shows HARASSMENT reports

---

#### Test 5.5.21: Get My Reports - Date Range Filter
**Endpoint:** `GET /reports/my-reports?created_from=2026-02-01T00:00:00Z&created_to=2026-02-05T23:59:59Z`

**Request:**
```http
GET /reports/my-reports?created_from=2026-02-01T00:00:00Z&created_to=2026-02-05T23:59:59Z HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Only shows reports within date range

---

#### Test 5.5.22: Get My Reports - Pagination
**Endpoint:** `GET /reports/my-reports?page=1&limit=10`

**Request:**
```http
GET /reports/my-reports?page=1&limit=10 HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Returns paginated results with correct metadata

---

#### Test 5.5.23: Get My Reports - Sorting (Most Recent First)
**Endpoint:** `GET /reports/my-reports?sort_by=created_at&sort_order=desc`

**Request:**
```http
GET /reports/my-reports?sort_by=created_at&sort_order=desc HTTP/1.1
Authorization: Bearer <valid_jwt_token>
```

**Expected:** Reports sorted by created_at descending (newest first)

---

### **Test Suite 5: Pattern Detection & Auto-Flagging**

#### Test 5.5.24: Auto-Flag Trigger - 3 Reports in 7 Days
**Scenario:** User receives 3rd report within 7 days

**Setup:**
1. Create User A
2. User B reports User A (Day 1)
3. User C reports User A (Day 2)
4. User D reports User A (Day 3) ← Auto-flag triggers

**Expected Results:**
- ✅ User A's `is_flagged` = true
- ✅ User A's `moderation_flags` updated with auto-flag info
- ✅ Feature restrictions applied:
  - CHAT restricted for 7 days
  - INTEREST restricted for 7 days
- ✅ Restrictions have `reason: "Auto-flagged due to multiple reports"`
- ✅ Log entry created with warning level

---

#### Test 5.5.25: Pattern Detection - Below Threshold
**Scenario:** User receives 2 reports in 7 days

**Expected:**
- ❌ No auto-flagging
- ❌ No feature restrictions
- ✅ Pattern count tracked

---

#### Test 5.5.26: Pattern Detection - Old Reports Excluded
**Scenario:** User has 2 reports from 10 days ago, receives 1 new report today

**Expected:**
- ❌ Old reports not counted (outside 7-day window)
- ❌ No auto-flagging
- ✅ Only recent reports counted

---

### **Test Suite 6: Moderator Notifications**

#### Test 5.5.27: Moderator Notification - Report Created
**Scenario:** User submits a report

**Expected:**
1. ✅ Report created successfully
2. ✅ All active moderators receive in-app notification
3. ✅ Notification includes:
   - Type: 'NEW_REPORT'
   - Title: "New [SEVERITY] Report: [CATEGORY]"
   - Message with reported user info
   - Metadata with report_id, category, severity
4. ✅ Notification visible in moderator's notification list

---

#### Test 5.5.28: Moderator Notification - CRITICAL Severity
**Scenario:** CRITICAL report (UNDERAGE or SCAM)

**Expected:**
- ✅ Notification title includes "CRITICAL"
- ✅ Higher visibility/priority in notification system

---

### **Test Suite 7: Integration with Blocking**

#### Test 5.5.29: Report User Who Blocked Me
**Scenario:** User A blocks User B, then User B reports User A

**Expected:** ✅ Report allowed (no restriction)

---

#### Test 5.5.30: Report User I Blocked
**Scenario:** User A blocks User B, then User A reports User B

**Expected:** ✅ Report allowed (no restriction)

---

### **Test Suite 8: Edge Cases**

#### Test 5.5.31: Report Inactive User
**Scenario:** Report a user whose account is deactivated

**Expected:** ✅ Report allowed (admins can still review)

---

#### Test 5.5.32: Multiple Categories for Same User
**Scenario:** Report same user for different categories

**Request 1:** FAKE_PROFILE ✅ Success
**Request 2:** HARASSMENT ✅ Success (different category)

**Expected:** Both reports created successfully

---

#### Test 5.5.33: Concurrent Reports
**Scenario:** Multiple users report same user simultaneously

**Expected:**
- ✅ All reports created
- ✅ Pattern detection works correctly
- ✅ No race conditions

---

#### Test 5.5.34: Very Long Reason Text
**Request:**
```json
{
  "category": "HARASSMENT",
  "reason": "[1000 character string]"
}
```

**Expected:** ✅ Accepted (max 1000 chars)

**Request with 1001 chars:**
**Expected:** ❌ Validation error

---

## 🔄 End-to-End Workflow Test

### Test 5.5.35: Complete User Report Workflow

**Step 1:** User browses profiles
```http
GET /profiles?page=1&limit=20
```

**Step 2:** User finds suspicious profile and gets report reasons
```http
GET /reports/reasons
```

**Step 3:** User submits report
```http
POST /reports/550e8400-e29b-41d4-a716-446655440002
{
  "category": "FAKE_PROFILE",
  "reason": "Detailed reason..."
}
```

**Step 4:** Moderators receive notification
```http
GET /notifications (as moderator)
```

**Step 5:** User checks their reports
```http
GET /reports/my-reports?type=made
```

**Step 6:** Admin reviews report (Task 5.4)
```http
GET /admin/reports/:id (admin endpoint)
```

**Validation:**
- ✅ Complete flow works seamlessly
- ✅ All notifications delivered
- ✅ Data consistent across endpoints

---

## 📊 Performance Testing

### Test 5.5.36: Bulk Report Submissions
**Scenario:** 5 users each submit 5 reports (25 total)

**Expected:**
- ✅ All reports processed correctly
- ✅ Rate limiting works per user
- ✅ Pattern detection accurate
- ✅ Notifications sent to moderators
- ✅ Response time < 500ms per request

---

### Test 5.5.37: Large My Reports List
**Scenario:** User with 100+ reports

**Expected:**
- ✅ Pagination works correctly
- ✅ Query performance acceptable
- ✅ No timeout issues

---

## 🐛 Known Issues & Limitations

1. **Rate Limiter:** Uses IP-based limiting; multiple users on same IP may share limit
2. **Notification Failure:** Report creation succeeds even if notification fails (by design)
3. **Pattern Detection:** Checks reports in last 7 days only; older reports ignored

---

## ✅ Acceptance Criteria

### Must Pass
- ✅ All validation tests pass
- ✅ Rate limiting enforced correctly
- ✅ Self-report blocked
- ✅ Duplicate reports blocked (per category)
- ✅ Severity auto-determined correctly
- ✅ Pattern detection triggers at threshold
- ✅ Moderator notifications sent
- ✅ My reports endpoint returns correct data
- ✅ Privacy maintained (no admin_notes exposed)

### Should Pass
- ✅ Performance tests meet benchmarks
- ✅ Concurrent operations handled correctly
- ✅ Edge cases handled gracefully

---

## 📝 Testing Checklist

```
User Reporting Core:
[ ] Get report reasons - success
[ ] Get report reasons - unauthorized
[ ] Create report - valid submission
[ ] Create report - self report blocked
[ ] Create report - user not found
[ ] Create report - duplicate blocked
[ ] Create report - rate limit enforced
[ ] Create report - invalid category
[ ] Create report - reason too short
[ ] Create report - missing fields

Severity Auto-Determination:
[ ] CRITICAL - UNDERAGE
[ ] CRITICAL - SCAM
[ ] HIGH - HARASSMENT, FAKE_PROFILE
[ ] MEDIUM - INAPPROPRIATE_PHOTO
[ ] LOW - SPAM

My Reports:
[ ] Get all reports (made + received)
[ ] Filter by type (made/received)
[ ] Filter by status
[ ] Filter by category
[ ] Date range filter
[ ] Pagination works
[ ] Sorting works
[ ] Privacy maintained (no admin data)

Pattern Detection:
[ ] Auto-flag at 3 reports in 7 days
[ ] Feature restrictions applied
[ ] Below threshold - no action
[ ] Old reports excluded

Moderator Notifications:
[ ] Notification sent on report
[ ] All moderators notified
[ ] Notification content correct
[ ] CRITICAL severity highlighted

Integration:
[ ] Report blocked user - allowed
[ ] Multiple categories - allowed
[ ] Inactive user - allowed
[ ] End-to-end workflow

Performance:
[ ] Bulk submissions handled
[ ] Large report lists paginate
[ ] Response times acceptable
```

---

## 🎯 Next Steps

After completing testing:
1. ✅ All test cases pass
2. ✅ Document any issues found
3. ✅ Admin review functionality tested (Task 5.4)
4. ✅ Deploy to staging
5. ✅ User acceptance testing

---

**Testing Complete:** Task 5.5 User Reporting ✅
