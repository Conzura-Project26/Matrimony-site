# Task 5.4: Report Management - Testing Guide

**Version:** 1.0  
**Date:** February 4, 2026  
**Task:** Phase 5 - Task 5.4

---

## 🎯 Pre-Testing Setup

### 1. Run Database Migration
```bash
cd Backend
npx prisma migrate dev --name add_report_management_fields
npx prisma generate
```

### 2. Start Server
```bash
npm run dev
```

### 3. Get Admin Token
```bash
# Login as admin
POST http://localhost:5000/api/auth/login
{
  "mobile_number": "ADMIN_MOBILE",
  "password": "ADMIN_PASSWORD"
}
```

Save the `accessToken` for subsequent requests.

---

## 📋 Test Cases

### Test 1: Get All Reports (Empty State)
**Expected:** Empty array initially

```http
GET http://localhost:5000/api/admin/reports
Authorization: Bearer <admin_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "reports": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 0,
      "hasMore": false
    }
  }
}
```

---

### Test 2: Create Sample Reports (Manual DB Insert)

Use Prisma Studio or run SQL to create test reports:

```sql
-- Insert test reports
INSERT INTO user_reports (reported_by, reported_user, category, severity, status, reason, created_at, updated_at)
VALUES 
  ('uuid-of-user-1', 'uuid-of-user-2', 'HARASSMENT', 'HIGH', 'OPEN', 'Sent inappropriate messages', NOW(), NOW()),
  ('uuid-of-user-3', 'uuid-of-user-2', 'FAKE_PROFILE', 'MEDIUM', 'OPEN', 'Profile information appears to be fake', NOW(), NOW()),
  ('uuid-of-user-4', 'uuid-of-user-5', 'SPAM', 'LOW', 'IN_REVIEW', 'Sending too many interests', NOW(), NOW());
```

Or use Prisma:
```javascript
// Create test reports via Prisma
await prisma.userReport.createMany({
  data: [
    {
      reported_by: 'existing-user-uuid-1',
      reported_user: 'existing-user-uuid-2',
      category: 'HARASSMENT',
      severity: 'HIGH',
      status: 'OPEN',
      reason: 'Sent inappropriate messages repeatedly'
    },
    {
      reported_by: 'existing-user-uuid-3',
      reported_user: 'existing-user-uuid-2',
      category: 'FAKE_PROFILE',
      severity: 'MEDIUM',
      status: 'OPEN',
      reason: 'Profile details appear fabricated'
    }
  ]
});
```

---

### Test 3: Get All Reports (With Data)

```http
GET http://localhost:5000/api/admin/reports
Authorization: Bearer <admin_token>
```

**Expected:** List of reports with pagination

---

### Test 4: Filter by Status

```http
GET http://localhost:5000/api/admin/reports?status=OPEN
Authorization: Bearer <admin_token>
```

**Expected:** Only OPEN reports

---

### Test 5: Filter by Severity

```http
GET http://localhost:5000/api/admin/reports?severity=HIGH
Authorization: Bearer <admin_token>
```

**Expected:** Only HIGH severity reports

---

### Test 6: Filter by Category

```http
GET http://localhost:5000/api/admin/reports?category=HARASSMENT
Authorization: Bearer <admin_token>
```

**Expected:** Only HARASSMENT category reports

---

### Test 7: Sort by Created Date (Newest First)

```http
GET http://localhost:5000/api/admin/reports?sort_by=created_at&sort_order=desc
Authorization: Bearer <admin_token>
```

**Expected:** Reports sorted by newest first

---

### Test 8: Default Sort (Severity DESC, Created ASC)

```http
GET http://localhost:5000/api/admin/reports
Authorization: Bearer <admin_token>
```

**Expected:** CRITICAL first, then HIGH, then MEDIUM, then LOW. Within each severity, oldest first.

---

### Test 9: Pagination

```http
GET http://localhost:5000/api/admin/reports?page=1&limit=2
Authorization: Bearer <admin_token>
```

**Expected:** First 2 reports with pagination metadata

---

### Test 10: Text Search

```http
GET http://localhost:5000/api/admin/reports?q=harassment
Authorization: Bearer <admin_token>
```

**Expected:** Reports matching "harassment" in reason, notes, or user names

---

### Test 11: Get Report Statistics

```http
GET http://localhost:5000/api/admin/reports/statistics
Authorization: Bearer <admin_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Report statistics retrieved successfully",
  "data": {
    "overview": {
      "total": 3,
      "open": 2,
      "in_review": 1,
      "resolved": 0,
      "escalated": 0,
      "today": 3
    },
    "by_severity": {
      "LOW": 1,
      "MEDIUM": 1,
      "HIGH": 1
    },
    "by_category": {
      "HARASSMENT": 1,
      "FAKE_PROFILE": 1,
      "SPAM": 1
    }
  }
}
```

---

### Test 12: Get Report Details

```http
GET http://localhost:5000/api/admin/reports/1
Authorization: Bearer <admin_token>
```

**Expected:** Complete report with:
- Reporter details
- Reported user details
- Previous reports against reported user
- Previous actions against reported user
- Action history on this report
- Reported user statistics

---

### Test 13: Update Report Status (Moderator - Valid Transition)

**Login as Moderator first**

```http
PUT http://localhost:5000/api/admin/reports/1/status
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "status": "IN_REVIEW",
  "admin_notes": "Investigating the harassment claims"
}
```

**Expected:** ✅ Success - Status updated to IN_REVIEW

---

### Test 14: Update Report Status (Moderator - Invalid Transition)

```http
PUT http://localhost:5000/api/admin/reports/1/status
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "status": "RESOLVED"
}
```

**Expected:** ❌ 403 Forbidden - Moderators cannot transition from IN_REVIEW to RESOLVED

---

### Test 15: Escalate Report (Moderator)

```http
PUT http://localhost:5000/api/admin/reports/1/status
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "status": "ESCALATED",
  "admin_notes": "Multiple similar reports - needs admin review"
}
```

**Expected:** ✅ Success - Report escalated

---

### Test 16: Take Action - Warn User (ADMIN)

```http
PUT http://localhost:5000/api/admin/reports/1/action
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "WARN_USER",
  "admin_notes": "First offense - official warning sent"
}
```

**Expected:**
- ✅ Status automatically changed to ACTION_TAKEN
- ✅ Notification sent to reported user
- ✅ Action log entry created
- ✅ Audit log entry created

---

### Test 17: Take Action - Suspend User (ADMIN)

```http
PUT http://localhost:5000/api/admin/reports/2/action
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "SUSPEND_USER",
  "metadata": {
    "suspension_days": 7,
    "notes": "Repeated harassment violations"
  },
  "admin_notes": "User suspended for 7 days"
}
```

**Expected:**
- ✅ User `is_active` set to false
- ✅ All refresh tokens revoked
- ✅ Suspension notification sent
- ✅ Status = ACTION_TAKEN
- ✅ Action log created with metadata

---

### Test 18: Take Action - Delete Content (ADMIN)

```http
PUT http://localhost:5000/api/admin/reports/3/action
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "DELETE_CONTENT",
  "metadata": {
    "content_type": "photo",
    "content_ids": [123, 456]
  },
  "admin_notes": "Removed inappropriate photos"
}
```

**Expected:**
- ✅ Specified photos deleted
- ✅ Status = ACTION_TAKEN
- ✅ Action log with deleted count

---

### Test 19: Take Action - Deactivate User (ADMIN)

```http
PUT http://localhost:5000/api/admin/reports/4/action
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "DEACTIVATE_USER",
  "admin_notes": "Serious violations - fake profile scam"
}
```

**Expected:**
- ✅ User `is_active` set to false
- ✅ All refresh tokens revoked
- ✅ All pending interests cancelled (WITHDRAWN)
- ✅ Deactivation notification sent
- ✅ Status = ACTION_TAKEN

---

### Test 20: Take Action - Moderator Attempt (Should Fail)

```http
PUT http://localhost:5000/api/admin/reports/1/action
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "action": "WARN_USER"
}
```

**Expected:** ❌ 403 Forbidden - Only ADMIN can take actions

---

### Test 21: Mark as Resolved (ADMIN)

```http
PUT http://localhost:5000/api/admin/reports/1/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "RESOLVED",
  "admin_notes": "Warning sent and case closed"
}
```

**Expected:**
- ✅ Status = RESOLVED
- ✅ `resolved_at` timestamp set
- ✅ `resolved_by` set to admin ID

---

### Test 22: Take Action on Resolved Report (Should Fail)

```http
PUT http://localhost:5000/api/admin/reports/1/action
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "WARN_USER"
}
```

**Expected:** ❌ 400 Bad Request - "Cannot take action on resolved report. Reopen it first."

---

### Test 23: Get Report Details After Action

```http
GET http://localhost:5000/api/admin/reports/1
Authorization: Bearer <admin_token>
```

**Expected:** Report with:
- `action_taken` field populated
- `actions` array with action log entries
- `status` = ACTION_TAKEN or RESOLVED
- `reported_user_stats` with counts

---

### Test 24: Filter Reports with Actions

```http
GET http://localhost:5000/api/admin/reports?has_action=true
Authorization: Bearer <admin_token>
```

**Expected:** Only reports where `action_taken` is not null

---

### Test 25: Combined Filters

```http
GET http://localhost:5000/api/admin/reports?status=ACTION_TAKEN&severity=HIGH&category=HARASSMENT
Authorization: Bearer <admin_token>
```

**Expected:** Reports matching ALL filters

---

### Test 26: Rate Limit Test (Read)

Make 2001 GET requests within 1 hour

**Expected:** 429 Too Many Requests after 2000 requests

---

### Test 27: Rate Limit Test (Action)

Make 101 action requests within 1 hour

**Expected:** 429 Too Many Requests after 100 requests

---

## ✅ Validation Tests

### Test 28: Invalid Status Value

```http
PUT http://localhost:5000/api/admin/reports/1/status
Content-Type: application/json

{
  "status": "INVALID_STATUS"
}
```

**Expected:** ❌ 400 Bad Request - Validation error

---

### Test 29: Invalid Action Value

```http
PUT http://localhost:5000/api/admin/reports/1/action
Content-Type: application/json

{
  "action": "DELETE_USER"
}
```

**Expected:** ❌ 400 Bad Request - Not a valid action

---

### Test 30: Invalid Report ID

```http
GET http://localhost:5000/api/admin/reports/99999
Authorization: Bearer <admin_token>
```

**Expected:** ❌ 404 Not Found - Report not found

---

### Test 31: Suspension Days Out of Range

```http
PUT http://localhost:5000/api/admin/reports/1/action
Content-Type: application/json

{
  "action": "SUSPEND_USER",
  "metadata": {
    "suspension_days": 500
  }
}
```

**Expected:** ❌ 400 Bad Request - Must be between 1-365 days

---

## 🔍 Database Verification

### Check Report Updated
```sql
SELECT * FROM user_reports WHERE id = 1;
```

Verify:
- `status` changed
- `updated_at` timestamp updated
- `admin_notes` saved
- `resolved_at` set (if RESOLVED)
- `resolved_by` set (if RESOLVED)

### Check Action Log Created
```sql
SELECT * FROM report_action_logs WHERE report_id = 1;
```

Verify:
- Action type recorded
- Metadata saved
- Actor ID correct
- Timestamp present

### Check Audit Log Created
```sql
SELECT * FROM audit_logs 
WHERE action LIKE 'REPORT%' 
ORDER BY created_at DESC 
LIMIT 10;
```

Verify:
- `REPORT_STATUS_UPDATE` entries
- `REPORT_ACTION_*` entries
- Actor ID correct

### Check User Status Changed (After Action)
```sql
SELECT is_active FROM users WHERE id = 'reported-user-uuid';
```

Verify:
- `is_active = false` (for SUSPEND/DEACTIVATE actions)

### Check Tokens Revoked (After SUSPEND/DEACTIVATE)
```sql
SELECT * FROM refresh_tokens WHERE user_id = 'reported-user-uuid';
```

Verify:
- All tokens have `is_revoked = true`

### Check Notification Sent
```sql
SELECT * FROM notifications 
WHERE user_id = 'reported-user-uuid' 
ORDER BY created_at DESC 
LIMIT 5;
```

Verify:
- Warning/Suspension/Deactivation notification created

---

## 🎭 Role-Based Testing

### Moderator Tests

#### ✅ Can Do:
- GET /admin/reports (list)
- GET /admin/reports/:id (details)
- GET /admin/reports/statistics
- PUT status: OPEN → IN_REVIEW
- PUT status: IN_REVIEW → ESCALATED
- PUT status: OPEN → DISMISSED

#### ❌ Cannot Do:
- PUT /admin/reports/:id/action (any action)
- PUT status: IN_REVIEW → RESOLVED
- PUT status: ACTION_TAKEN → RESOLVED

### Admin Tests

#### ✅ Can Do:
- All moderator actions +
- PUT /admin/reports/:id/action (all actions)
- PUT status: Any valid transition
- Resolve reports
- Take moderation actions

---

## 📊 Test Data Scenarios

### Scenario 1: First-Time Offender
1. Create report: severity=MEDIUM, category=SPAM
2. Admin reviews: status → IN_REVIEW
3. Admin warns: action → WARN_USER
4. Admin resolves: status → RESOLVED

### Scenario 2: Repeat Offender
1. Create multiple reports against same user
2. Admin reviews history via GET /admin/reports/:id
3. Sees 3+ previous warnings
4. Admin suspends: action → SUSPEND_USER (30 days)
5. Admin resolves: status → RESOLVED

### Scenario 3: Escalation Path
1. Moderator receives report: status=OPEN
2. Moderator investigates: status → IN_REVIEW
3. Moderator can't decide: status → ESCALATED
4. Admin takes over: reviews details
5. Admin takes action: action → DEACTIVATE_USER
6. Admin resolves: status → RESOLVED

### Scenario 4: False Report
1. Report created: category=FAKE_PROFILE
2. Moderator reviews
3. Moderator dismisses: status → DISMISSED
4. No action needed

---

## 🧪 Integration Test Examples (Jest)

```javascript
describe('Report Management', () => {
  let adminToken, moderatorToken, reportId;

  beforeAll(async () => {
    // Setup: Login as admin and moderator
    adminToken = await getAdminToken();
    moderatorToken = await getModeratorToken();
    
    // Create test report
    reportId = await createTestReport();
  });

  describe('GET /admin/reports', () => {
    it('should return all reports for admin', async () => {
      const res = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reports).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/admin/reports?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      res.body.data.reports.forEach(report => {
        expect(report.status).toBe('OPEN');
      });
    });
  });

  describe('GET /admin/reports/:id', () => {
    it('should return report details', async () => {
      const res = await request(app)
        .get(`/api/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('reporter');
      expect(res.body.data).toHaveProperty('reported');
      expect(res.body.data).toHaveProperty('actions');
      expect(res.body.data).toHaveProperty('reported_user_stats');
    });

    it('should return 404 for invalid report ID', async () => {
      const res = await request(app)
        .get('/api/admin/reports/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /admin/reports/:id/status', () => {
    it('should allow moderator to mark as IN_REVIEW', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ status: 'IN_REVIEW', admin_notes: 'Investigating' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_REVIEW');
    });

    it('should prevent moderator from resolving', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ status: 'RESOLVED' });
      
      expect(res.status).toBe(403);
    });

    it('should allow admin to resolve', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED', admin_notes: 'Case closed' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.data.resolved_at).toBeTruthy();
      expect(res.body.data.resolved_by).toBe(adminId);
    });
  });

  describe('PUT /admin/reports/:id/action', () => {
    it('should prevent moderator from taking action', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ action: 'WARN_USER' });
      
      expect(res.status).toBe(403);
    });

    it('should allow admin to warn user', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          action: 'WARN_USER',
          admin_notes: 'First warning'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.report.status).toBe('ACTION_TAKEN');
      expect(res.body.data.report.action_taken).toBe('WARN_USER');
      expect(res.body.data.action_result.notification_sent).toBe(true);
    });

    it('should suspend user with metadata', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          action: 'SUSPEND_USER',
          metadata: { suspension_days: 7 },
          admin_notes: '7-day suspension'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.action_result.suspension_days).toBe(7);
      expect(res.body.data.action_result.tokens_revoked).toBe(true);
    });

    it('should prevent action on resolved report', async () => {
      // First resolve the report
      await request(app)
        .put(`/api/admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      // Try to take action
      const res = await request(app)
        .put(`/api/admin/reports/${reportId}/action`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'WARN_USER' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot take action on resolved report');
    });
  });
});
```

---

## 📈 Performance Tests

### Test Load (Pagination)
```http
GET /admin/reports?limit=100
```
Should complete in < 500ms for 1000 reports

### Test Complex Filter
```http
GET /admin/reports?status=OPEN&severity=HIGH&category=HARASSMENT&has_action=false
```
Should complete in < 300ms with proper indexes

---

## 🎯 Acceptance Criteria

- ✅ All 4 endpoints working
- ✅ Filters work independently and combined
- ✅ Sorting works correctly
- ✅ Pagination accurate
- ✅ Moderator restrictions enforced
- ✅ Admin full access confirmed
- ✅ Actions execute correctly
- ✅ Status auto-updates to ACTION_TAKEN
- ✅ Notifications sent
- ✅ Audit logs created
- ✅ Action logs created
- ✅ Rate limits enforced
- ✅ Cannot action resolved reports
- ✅ Reported user history visible
- ✅ Statistics accurate

---

## 🐛 Common Issues & Solutions

### Issue 1: "Report not found"
**Cause:** Invalid report ID  
**Solution:** Check ID exists in database

### Issue 2: 403 Forbidden (Moderator)
**Cause:** Moderator trying invalid transition or taking action  
**Solution:** Use admin token for those operations

### Issue 3: 400 "Cannot take action on resolved report"
**Cause:** Report already resolved  
**Solution:** Reopen report first, then take new action

### Issue 4: Empty reports array
**Cause:** No reports in database  
**Solution:** Create test reports using Prisma or SQL

---

**Testing Status:** ⬜ Pending  
**Documentation:** ✅ Complete  
**Date:** February 4, 2026
