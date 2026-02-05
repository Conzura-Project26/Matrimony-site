# Task 5.3: Photo Moderation - Visual Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                  PHOTO MODERATION SYSTEM                        │
│                    Task 5.3 - Complete ✅                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 System Architecture

```
┌──────────────┐
│   ADMIN /    │
│  MODERATOR   │
└──────┬───────┘
       │
       │ JWT Token + Role Check
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHOTO MODERATION API                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 GET /admin/photos/pending                               │
│     ├─ Filters: uploaded_from, uploaded_to, user_id        │
│     ├─ Sorting: oldest (FIFO) | newest                      │
│     └─ Pagination: page, limit                              │
│                                                              │
│  ✅ PATCH /admin/photos/:photoId/approve (Individual)       │
│     └─ Approve single photo                                 │
│                                                              │
│  ❌ DELETE /admin/photos/:photoId (Individual)              │
│     └─ Reject + delete single photo with reason            │
│                                                              │
│  ⚡ PATCH /admin/photos/bulk-approve (NEW)                  │
│     ├─ Max 50 photos per request                            │
│     ├─ Fault-tolerant processing                            │
│     └─ Individual audit logs                                │
│                                                              │
│  ⚡ DELETE /admin/photos/bulk-reject (NEW)                  │
│     ├─ Max 50 photos per request                            │
│     ├─ Single reason for all photos                         │
│     ├─ Fault-tolerant processing                            │
│     ├─ Delete from UploadThing + DB                         │
│     └─ Individual audit logs with reason                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       │
       │ Prisma ORM
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  📸 user_photos                                             │
│     - id (PK)                                                │
│     - user_id (FK → users)                                  │
│     - photo_url                                              │
│     - is_approved (BOOLEAN) ← Moderation status            │
│     - approved_by (FK → users)                              │
│     - uploaded_at                                            │
│     - is_primary                                             │
│     - visibility (PUBLIC/PRIVATE)                           │
│                                                              │
│  📋 audit_logs                                              │
│     - actor_id (moderator/admin)                            │
│     - action (description)                                   │
│     - ip_address                                             │
│     - created_at                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Get Pending Photos with Filters

```
┌─────────────┐
│  Moderator  │
└──────┬──────┘
       │
       │ GET /admin/photos/pending?uploaded_from=2026-01-01&sort=newest
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  1. authenticateToken → Verify JWT                  │
│  2. authorizeRole → Check ADMIN/MODERATOR           │
│  3. adminReadRateLimiter → Check rate limit         │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  getPendingPhotos()  │
         └──────────┬───────────┘
                    │
                    ├─ Build WHERE clause (is_approved = false)
                    ├─ Add date filters (uploaded_at >= from, <= to)
                    ├─ Add user filter (user_id = ?)
                    ├─ Set sort order (asc/desc)
                    │
                    ▼
         ┌──────────────────────┐
         │  Query Database      │
         │  (with filters)      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Return JSON         │
         │  - photos[]          │
         │  - pagination        │
         │  - filters           │
         └──────────────────────┘
```

---

### Flow 2: Bulk Approve Photos (Fault-Tolerant)

```
┌─────────────┐
│    Admin    │
└──────┬──────┘
       │
       │ PATCH /admin/photos/bulk-approve
       │ Body: { photo_ids: [1, 2, 999, 4, 5] }
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  1. authenticateToken                               │
│  2. authorizeRole(['ADMIN', 'MODERATOR'])          │
│  3. adminWriteRateLimiter                           │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  bulkApprovePhotos()     │
         │  1. Validate schema      │
         │  2. Check 1-50 photos    │
         └──────────┬───────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  FOR EACH photo_id:      │
         └──────────┬───────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
   ┌─────────┐           ┌──────────────┐
   │ Valid?  │           │  Not found   │
   │ Photo 1 │           │  Photo 999   │
   └────┬────┘           └──────┬───────┘
        │                       │
        │ UPDATE                │ Log to failures[]
        │ is_approved=true      │ { photo_id: 999,
        │ approved_by=mod_id    │   error: "Not found" }
        │                       │
        │ CREATE audit_log      │
        │ results.processed++   │ results.failed++
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  Return Response:        │
         │  {                       │
         │    summary: {            │
         │      total: 5,           │
         │      processed: 4,       │
         │      failed: 1           │
         │    },                    │
         │    failures: [...]       │
         │  }                       │
         └──────────────────────────┘
```

---

### Flow 3: Bulk Reject Photos with File Deletion

```
┌─────────────┐
│  Moderator  │
└──────┬──────┘
       │
       │ DELETE /admin/photos/bulk-reject
       │ Body: { photo_ids: [10, 11, 12], reason: "Inappropriate" }
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  1. authenticateToken                               │
│  2. authorizeRole(['ADMIN', 'MODERATOR'])          │
│  3. adminDestructiveRateLimiter                     │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  bulkRejectPhotos()      │
         │  1. Validate schema      │
         │  2. Check reason length  │
         │  3. Check 1-50 photos    │
         └──────────┬───────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  FOR EACH photo_id:      │
         └──────────┬───────────────┘
                    │
        ┌───────────┴────────────────────┐
        │                                │
        ▼                                ▼
   ┌──────────┐                   ┌──────────────┐
   │ Photo 10 │                   │  Photo 999   │
   │  Found   │                   │  Not Found   │
   └────┬─────┘                   └──────┬───────┘
        │                                │
        │ 1. Extract fileKey             │ Log to failures[]
        │ 2. DELETE from UploadThing     │ results.failed++
        │    (best effort)               │
        │ 3. DELETE from DB              │
        │ 4. CREATE audit_log            │
        │    with reason                 │
        │ 5. results.processed++         │
        │                                │
        └────────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  Return Response:         │
         │  {                        │
         │    summary: {             │
         │      total: 4,            │
         │      processed: 3,        │
         │      failed: 1            │
         │    },                     │
         │    failures: [...]        │
         │  }                        │
         └───────────────────────────┘
```

---

## 🎯 API Endpoints Map

```
┌─────────────────────────────────────────────────────────────┐
│                  /admin/photos/*                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 GET    /pending                                         │
│     Query: page, limit, uploaded_from, uploaded_to,        │
│            user_id, sort                                    │
│     Role: ADMIN, MODERATOR                                  │
│     Rate: adminReadRateLimiter                              │
│                                                              │
│  ✅ PATCH  /:photoId/approve                                │
│     Role: ADMIN, MODERATOR                                  │
│     Rate: None                                              │
│                                                              │
│  ❌ DELETE /:photoId                                        │
│     Body: { reason }                                        │
│     Role: ADMIN, MODERATOR                                  │
│     Rate: None                                              │
│                                                              │
│  ⚡ PATCH  /bulk-approve (NEW)                              │
│     Body: { photo_ids: [1-50 IDs] }                        │
│     Role: ADMIN, MODERATOR                                  │
│     Rate: adminWriteRateLimiter                             │
│                                                              │
│  ⚡ DELETE /bulk-reject (NEW)                               │
│     Body: { photo_ids: [1-50 IDs], reason }                │
│     Role: ADMIN, MODERATOR                                  │
│     Rate: adminDestructiveRateLimiter                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authorization Matrix

```
┌──────────────────┬──────────┬────────────┬──────┐
│    Endpoint      │  ADMIN   │ MODERATOR  │ USER │
├──────────────────┼──────────┼────────────┼──────┤
│ GET pending      │    ✅    │     ✅     │  ❌  │
│ Approve (single) │    ✅    │     ✅     │  ❌  │
│ Reject (single)  │    ✅    │     ✅     │  ❌  │
│ Bulk Approve     │    ✅    │     ✅     │  ❌  │
│ Bulk Reject      │    ✅    │     ✅     │  ❌  │
└──────────────────┴──────────┴────────────┴──────┘
```

---

## ⚙️ Validation Rules

```
┌─────────────────────────────────────────────────────────────┐
│                  BULK APPROVE VALIDATION                     │
├─────────────────────────────────────────────────────────────┤
│  ✓ photo_ids must be array                                  │
│  ✓ Min: 1 photo ID                                          │
│  ✓ Max: 50 photo IDs                                        │
│  ✓ Each ID must be positive integer                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  BULK REJECT VALIDATION                      │
├─────────────────────────────────────────────────────────────┤
│  ✓ photo_ids must be array                                  │
│  ✓ Min: 1 photo ID                                          │
│  ✓ Max: 50 photo IDs                                        │
│  ✓ Each ID must be positive integer                         │
│  ✓ reason required (string)                                 │
│  ✓ reason min length: 10 characters                         │
│  ✓ reason max length: 500 characters                        │
│  ✓ Default reason: "No reason provided"                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fault-Tolerant Processing

```
Input: [1, 2, 999, 4, 5]  (Photo 999 doesn't exist)

┌─────────────────────────────────────────────────────────────┐
│                  PROCESSING FLOW                             │
└─────────────────────────────────────────────────────────────┘

Photo 1  →  ✅ Found & Pending  →  Approve  →  processed++
Photo 2  →  ✅ Found & Pending  →  Approve  →  processed++
Photo 999 → ❌ Not Found       →  Skip     →  failed++, log error
Photo 4  →  ✅ Found & Pending  →  Approve  →  processed++
Photo 5  →  ✅ Found & Pending  →  Approve  →  processed++

┌─────────────────────────────────────────────────────────────┐
│                     RESULT                                   │
├─────────────────────────────────────────────────────────────┤
│  HTTP Status: 200 OK (NOT 400/500)                         │
│  Processed: 4                                                │
│  Failed: 1                                                   │
│  Failures: [{ photo_id: 999, error: "Photo not found" }]   │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** ⭐ Operation succeeds even with partial failures

---

## 📝 Audit Trail Example

### Individual Approve
```
┌─────────────────────────────────────────────────────────────┐
│  Audit Log Entry                                            │
├─────────────────────────────────────────────────────────────┤
│  actor_id: "550e8400-..." (Moderator UUID)                 │
│  action: "Photo approved for user: John Doe"               │
│  ip_address: "192.168.1.100"                                │
│  created_at: "2026-02-04T14:30:00.000Z"                    │
└─────────────────────────────────────────────────────────────┘
```

### Bulk Approve (creates 1 entry per photo)
```
┌─────────────────────────────────────────────────────────────┐
│  Photo 1 → Audit Log Entry                                  │
├─────────────────────────────────────────────────────────────┤
│  action: "Photo approved (bulk) for user: John Doe"        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Photo 2 → Audit Log Entry                                  │
├─────────────────────────────────────────────────────────────┤
│  action: "Photo approved (bulk) for user: Jane Smith"      │
└─────────────────────────────────────────────────────────────┘

... (one per photo)
```

### Bulk Reject (includes reason)
```
┌─────────────────────────────────────────────────────────────┐
│  Photo 10 → Audit Log Entry                                 │
├─────────────────────────────────────────────────────────────┤
│  action: "Photo rejected (bulk) - User: John Doe            │
│           (+919876543210) - Reason: Inappropriate content"  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Response Format Comparison

### Individual Operations
```json
✅ Approve:
{
  "success": true,
  "message": "Photo approved successfully",
  "data": { /* photo object */ }
}

❌ Reject:
{
  "success": true,
  "message": "Photo rejected and deleted successfully"
}
```

### Bulk Operations (NEW Format)
```json
⚡ Bulk Approve/Reject:
{
  "success": true,
  "message": "Bulk approve completed: 7 processed, 3 failed",
  "data": {
    "summary": {
      "total": 10,
      "processed": 7,
      "failed": 3
    },
    "failures": [
      { "photo_id": 4, "error": "Photo already approved" },
      { "photo_id": 7, "error": "Photo not found" },
      { "photo_id": 9, "error": "Photo not found" }
    ]
  }
}
```

---

## 🎯 Filter & Sort Options

### GET Pending Photos - Query Parameters

```
┌────────────────┬──────────┬──────────┬─────────────────────┐
│   Parameter    │   Type   │ Required │     Example         │
├────────────────┼──────────┼──────────┼─────────────────────┤
│ page           │ integer  │    No    │ 1 (default)         │
│ limit          │ integer  │    No    │ 20 (default, max100)│
│ uploaded_from  │ date     │    No    │ 2026-01-01          │
│ uploaded_to    │ date     │    No    │ 2026-02-04          │
│ user_id        │ UUID     │    No    │ 550e8400-e29b...    │
│ sort           │ enum     │    No    │ oldest (default)    │
│                │          │          │ newest              │
└────────────────┴──────────┴──────────┴─────────────────────┘
```

### Filter Combinations

```
Example 1: Last month's photos, sorted by newest
?uploaded_from=2026-01-01&uploaded_to=2026-01-31&sort=newest

Example 2: Specific user's photos
?user_id=550e8400-e29b-41d4-a716-446655440000

Example 3: This week, newest first
?uploaded_from=2026-01-28&sort=newest&limit=50

Example 4: All pending (default behavior)
No query params → Returns all pending, oldest first
```

---

## 🚀 Rate Limiting Strategy

```
┌──────────────────────┬─────────────────────────┬──────────┐
│      Endpoint        │      Rate Limiter       │  Limit   │
├──────────────────────┼─────────────────────────┼──────────┤
│ GET pending          │ adminReadRateLimiter    │  High    │
│ PATCH approve        │ None                    │  None    │
│ DELETE reject        │ None                    │  None    │
│ PATCH bulk-approve   │ adminWriteRateLimiter   │  Medium  │
│ DELETE bulk-reject   │ adminDestructiveRateLimiter │ Low  │
└──────────────────────┴─────────────────────────┴──────────┘

Rationale:
- Read operations: Liberal rate limit (frequent queries)
- Write operations: Moderate rate limit (bulk approvals)
- Destructive operations: Strict rate limit (bulk deletes)
```

---

## 🧩 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                  PHOTO MODERATION SYSTEM                    │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌────────────┐  ┌──────────────┐
│ UploadThing  │  │ User_Photos│  │  Audit_Logs  │
│              │  │   Table    │  │    Table     │
│ File Storage │  │            │  │              │
│              │  │ Approve/   │  │ Track all    │
│ Delete files │  │ Delete ops │  │ moderator    │
│ on reject    │  │            │  │ actions      │
└──────────────┘  └────────────┘  └──────────────┘
```

---

## 📊 Statistics

```
Implementation Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Files Modified:          3
   - photoController.js     (Enhanced + 2 new functions)
   - admin.js               (Added routes + Swagger docs)
   - validation.js          (Added 2 validation schemas)

📄 Files Created:           3
   - TASK_5.3_PHOTO_MODERATION_SUMMARY.md
   - TASK_5.3_QUICK_REFERENCE.md
   - TASK_5.3_TESTING_GUIDE.md

🔌 API Endpoints:           5
   - GET pending            (Enhanced)
   - PATCH approve          (Existing)
   - DELETE reject          (Existing)
   - PATCH bulk-approve     (NEW)
   - DELETE bulk-reject     (NEW)

🔒 New Features:
   - Date range filtering   ✅
   - User ID filtering      ✅
   - Sort by newest/oldest  ✅
   - Bulk approve (50 max)  ✅
   - Bulk reject (50 max)   ✅
   - Fault tolerance        ✅
   - Audit logging          ✅
   - Validation schemas     ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎓 Key Features Summary

### ✨ Enhanced Features
1. **Advanced Filtering**
   - Date range (from/to with time handling)
   - User-specific troubleshooting
   - Maintains pending status filter

2. **Flexible Sorting**
   - Default: Oldest first (fair FIFO queue)
   - Optional: Newest first (urgent cases)

3. **Fault Tolerance**
   - Partial success is valid
   - Detailed error reporting
   - No cascade failures

4. **Complete Auditability**
   - Every action logged individually
   - Reason included for rejections
   - IP address captured

5. **Performance Limits**
   - 50 photos max per bulk operation
   - Prevents timeout and abuse
   - Sequential processing for reliability

---

## 🎯 Task Completion Status

```
Task 5.3: Photo Moderation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Get pending photos (GET /admin/photos/pending)
   └─ Enhanced with filters and sorting

✅ Approve photo (PATCH /admin/photos/:id/approve)
   └─ Existing endpoint (kept as-is)

✅ Reject photo (DELETE /admin/photos/:id)
   └─ Existing endpoint (kept as-is)

✅ Bulk actions
   ├─ PATCH /admin/photos/bulk-approve (NEW)
   └─ DELETE /admin/photos/bulk-reject (NEW)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: COMPLETE ✅
Date: February 4, 2026
```

---

## 🔗 Related Systems

```
                    ┌─────────────────────┐
                    │  Photo Moderation   │
                    │     System          │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ User Photo   │    │  Admin User      │    │  Statistics  │
│   Upload     │    │  Management      │    │   & Reports  │
│              │    │                  │    │              │
│ Upload →     │    │ Role-based       │    │ Moderation   │
│ Pending      │    │ access control   │    │ queue stats  │
└──────────────┘    └──────────────────┘    └──────────────┘
```

---

**Implementation Complete:** February 4, 2026 ✅  
**Production Ready:** Yes  
**Documentation:** Complete  
**Testing Guide:** Available
