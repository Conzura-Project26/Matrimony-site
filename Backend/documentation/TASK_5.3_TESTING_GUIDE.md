# Task 5.3: Photo Moderation - Testing Guide

## 🧪 Testing Setup

### Prerequisites
1. **Admin/Moderator account** with valid JWT token
2. **Test users** with uploaded photos (some pending, some approved)
3. **API testing tool** (Postman, Thunder Client, or curl)

### Environment Variables
```
BASE_URL=http://localhost:5000
MODERATOR_TOKEN=<your_moderator_jwt_token>
ADMIN_TOKEN=<your_admin_jwt_token>
```

---

## 📋 Test Cases

### Test 1: Get Pending Photos - Default (No Filters)
**Purpose:** Verify basic pending photos retrieval works

```http
GET {{BASE_URL}}/admin/photos/pending
Authorization: Bearer {{MODERATOR_TOKEN}}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Contains `photos` array
- ✅ Contains `pagination` object
- ✅ Contains `filters` object
- ✅ Photos have `is_approved: false`
- ✅ Sorted by `uploaded_at` ascending (oldest first)

**Validation:**
- [ ] Response structure matches expected format
- [ ] All photos have `is_approved: false`
- [ ] Pagination data is correct
- [ ] User details are included in each photo

---

### Test 2: Get Pending Photos - With Date Filters
**Purpose:** Verify date range filtering works correctly

```http
GET {{BASE_URL}}/admin/photos/pending?uploaded_from=2026-01-01&uploaded_to=2026-02-04
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Only photos uploaded between Jan 1 - Feb 4, 2026
- ✅ Filters reflected in response

**Validation:**
- [ ] All returned photos have `uploaded_at` within date range
- [ ] Filter values appear in `data.filters` object
- [ ] End date is inclusive (includes Feb 4, 23:59:59)

---

### Test 3: Get Pending Photos - Filter by User ID
**Purpose:** Troubleshoot specific user's pending photos

```http
GET {{BASE_URL}}/admin/photos/pending?user_id=<TEST_USER_UUID>
Authorization: Bearer {{MODERATOR_TOKEN}}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Only photos from specified user
- ✅ `user_id` filter in response

**Validation:**
- [ ] All photos belong to the specified user
- [ ] Other users' photos are excluded

---

### Test 4: Get Pending Photos - Sort by Newest
**Purpose:** Verify sorting options work

```http
GET {{BASE_URL}}/admin/photos/pending?sort=newest&limit=10
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Photos sorted by `uploaded_at` descending (newest first)
- ✅ `sort: "newest"` in filters

**Validation:**
- [ ] First photo is the most recently uploaded
- [ ] Photos are in descending order by upload date

---

### Test 5: Get Pending Photos - Pagination
**Purpose:** Verify pagination works correctly

```http
GET {{BASE_URL}}/admin/photos/pending?page=2&limit=5
Authorization: Bearer {{MODERATOR_TOKEN}}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Maximum 5 photos returned
- ✅ Pagination shows `page: 2`, `limit: 5`
- ✅ `totalPages` calculated correctly

**Validation:**
- [ ] Correct photos for page 2 (skips first 5)
- [ ] Pagination math is correct: `totalPages = ceil(total / limit)`

---

### Test 6: Approve Single Photo
**Purpose:** Verify individual photo approval works

```http
PATCH {{BASE_URL}}/admin/photos/123/approve
Authorization: Bearer {{MODERATOR_TOKEN}}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Photo now has `is_approved: true`
- ✅ `approved_by` set to moderator's user ID
- ✅ Audit log created

**Validation:**
- [ ] Photo status updated in database
- [ ] Audit log entry exists
- [ ] Re-fetching pending photos excludes this photo

---

### Test 7: Reject Single Photo
**Purpose:** Verify individual photo rejection works

```http
DELETE {{BASE_URL}}/admin/photos/456
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "reason": "Inappropriate content violating community guidelines"
}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Photo deleted from database
- ✅ Audit log created with reason

**Validation:**
- [ ] Photo no longer exists in database
- [ ] Audit log contains rejection reason
- [ ] File deleted from UploadThing (check logs)

---

### Test 8: Bulk Approve - All Valid Photos
**Purpose:** Verify bulk approve with all valid photo IDs

```http
PATCH {{BASE_URL}}/admin/photos/bulk-approve
Authorization: Bearer {{MODERATOR_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [1, 2, 3, 4, 5]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulk approve completed: 5 processed, 0 failed",
  "data": {
    "summary": {
      "total": 5,
      "processed": 5,
      "failed": 0
    },
    "failures": []
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] All 5 photos approved in database
- [ ] 5 audit log entries created
- [ ] `processed: 5`, `failed: 0`
- [ ] `failures` array is empty

---

### Test 9: Bulk Approve - With Invalid Photo IDs (Fault Tolerance)
**Purpose:** Verify fault-tolerant processing

```http
PATCH {{BASE_URL}}/admin/photos/bulk-approve
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [10, 11, 999, 13, 14, 1000, 16]
}
```

**Assumptions:**
- Photo IDs 999 and 1000 don't exist
- Other photos are valid and pending

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulk approve completed: 5 processed, 2 failed",
  "data": {
    "summary": {
      "total": 7,
      "processed": 5,
      "failed": 2
    },
    "failures": [
      { "photo_id": 999, "error": "Photo not found" },
      { "photo_id": 1000, "error": "Photo not found" }
    ]
  }
}
```

**Validation:**
- [ ] Status: 200 OK (NOT 400 or 500)
- [ ] Valid photos (10, 11, 13, 14, 16) are approved
- [ ] Invalid photos reported in `failures` array
- [ ] 5 audit logs created (only for successful approvals)

---

### Test 10: Bulk Approve - Already Approved Photos
**Purpose:** Verify idempotency and error handling

```http
PATCH {{BASE_URL}}/admin/photos/bulk-approve
Authorization: Bearer {{MODERATOR_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [20, 21, 22]
}
```

**Assumptions:**
- Photo 21 is already approved

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulk approve completed: 2 processed, 1 failed",
  "data": {
    "summary": {
      "total": 3,
      "processed": 2,
      "failed": 1
    },
    "failures": [
      { "photo_id": 21, "error": "Photo is already approved" }
    ]
  }
}
```

**Validation:**
- [ ] Photos 20 and 22 are approved
- [ ] Photo 21 reported as already approved
- [ ] No duplicate approval in database

---

### Test 11: Bulk Reject - All Valid Photos
**Purpose:** Verify bulk reject with all valid photo IDs

```http
DELETE {{BASE_URL}}/admin/photos/bulk-reject
Authorization: Bearer {{MODERATOR_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [30, 31, 32],
  "reason": "Photos contain inappropriate content that violates our community standards"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulk reject completed: 3 processed, 0 failed",
  "data": {
    "summary": {
      "total": 3,
      "processed": 3,
      "failed": 0
    },
    "failures": []
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] All 3 photos deleted from database
- [ ] 3 audit log entries created (each with reason)
- [ ] Files deleted from UploadThing (check logs)
- [ ] Same reason applied to all photos in audit logs

---

### Test 12: Bulk Reject - Mixed Valid/Invalid
**Purpose:** Verify fault tolerance for bulk reject

```http
DELETE {{BASE_URL}}/admin/photos/bulk-reject
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [40, 999, 42, 1000, 44],
  "reason": "Violates photo upload guidelines regarding appropriate content"
}
```

**Assumptions:**
- Photo IDs 999 and 1000 don't exist

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulk reject completed: 3 processed, 2 failed",
  "data": {
    "summary": {
      "total": 5,
      "processed": 3,
      "failed": 2
    },
    "failures": [
      { "photo_id": 999, "error": "Photo not found" },
      { "photo_id": 1000, "error": "Photo not found" }
    ]
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] Photos 40, 42, 44 deleted
- [ ] Invalid photo IDs reported in failures
- [ ] 3 audit logs created (with reason)

---

### Test 13: Bulk Approve - Validation (Too Many Photos)
**Purpose:** Verify 50-photo limit enforcement

```http
PATCH {{BASE_URL}}/admin/photos/bulk-approve
Authorization: Bearer {{MODERATOR_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [1, 2, 3, ... 51 photo IDs]
}
```

**Expected Response:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Maximum 50 photos can be approved at once"

**Validation:**
- [ ] Request rejected before processing
- [ ] No database changes
- [ ] Clear error message

---

### Test 14: Bulk Approve - Validation (Empty Array)
**Purpose:** Verify empty array validation

```http
PATCH {{BASE_URL}}/admin/photos/bulk-approve
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "photo_ids": []
}
```

**Expected Response:**
- ✅ Status: 400 Bad Request
- ✅ Error: "photo_ids must be a non-empty array"

---

### Test 15: Bulk Reject - Validation (Short Reason)
**Purpose:** Verify reason length validation

```http
DELETE {{BASE_URL}}/admin/photos/bulk-reject
Authorization: Bearer {{MODERATOR_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [1, 2],
  "reason": "Bad"
}
```

**Expected Response:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Reason must be at least 10 characters"

---

### Test 16: Bulk Reject - Validation (Long Reason)
**Purpose:** Verify reason max length validation

```http
DELETE {{BASE_URL}}/admin/photos/bulk-reject
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "photo_ids": [1, 2],
  "reason": "<501 character string>"
}
```

**Expected Response:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Reason must not exceed 500 characters"

---

### Test 17: Unauthorized Access - Regular User
**Purpose:** Verify regular users cannot access photo moderation

```http
GET {{BASE_URL}}/admin/photos/pending
Authorization: Bearer {{USER_TOKEN}}
```

**Expected Response:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Access denied. Required role: ADMIN or MODERATOR"

---

### Test 18: Bulk Approve - Rate Limiting
**Purpose:** Verify rate limiting works

**Steps:**
1. Send bulk approve request
2. Immediately send another bulk approve request
3. Repeat rapidly

**Expected:**
- ✅ Eventually receive 429 Too Many Requests
- ✅ Rate limit error message

---

### Test 19: Bulk Operations - Audit Trail Verification
**Purpose:** Verify all operations are logged to audit trail

**Steps:**
1. Bulk approve 5 photos
2. Query audit logs table

**Expected:**
- ✅ 5 audit log entries created
- ✅ Each entry shows: `"Photo approved (bulk) for user: <name>"`
- ✅ Moderator ID recorded
- ✅ IP address captured

**SQL Query:**
```sql
SELECT * FROM audit_logs 
WHERE action LIKE '%Photo approved (bulk)%' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### Test 20: Bulk Reject - File Deletion Verification
**Purpose:** Verify photos are deleted from UploadThing

**Steps:**
1. Note photo URLs from pending photos
2. Bulk reject those photos
3. Check if URLs are accessible

**Expected:**
- ✅ Photos deleted from database
- ✅ UploadThing deletion attempted (check logs)
- ✅ Old URLs return 404 (if deletion succeeded)

---

## 🔍 Manual Testing Workflow

### Step 1: Setup Test Data
```bash
# Login as regular user and upload photos
POST /users/:userId/photos
Body: { "fileUrl": "https://utfs.io/f/test1.jpg", "visibility": "PUBLIC" }

# Upload 10 test photos to different users
# All will be is_approved: false by default
```

---

### Step 2: Test Filtering
```bash
# Get all pending photos
GET /admin/photos/pending

# Get photos from last week
GET /admin/photos/pending?uploaded_from=2026-01-28&uploaded_to=2026-02-04

# Get specific user's pending photos
GET /admin/photos/pending?user_id=<USER_UUID>

# Get newest photos first
GET /admin/photos/pending?sort=newest&limit=10
```

---

### Step 3: Test Individual Operations
```bash
# Approve one photo
PATCH /admin/photos/1/approve

# Verify it's approved
GET /users/<USER_ID>/photos
# Should see is_approved: true

# Reject one photo
DELETE /admin/photos/2
Body: { "reason": "Inappropriate image content" }

# Verify it's deleted
GET /admin/photos/pending
# Photo 2 should not appear
```

---

### Step 4: Test Bulk Approve
```bash
# Bulk approve 5 valid photos
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [3, 4, 5, 6, 7] }

# Expected: All 5 approved, summary shows 5 processed

# Try with mixed valid/invalid
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [8, 999, 10, 1000, 12] }

# Expected: 3 processed (8, 10, 12), 2 failed (999, 1000)
```

---

### Step 5: Test Bulk Reject
```bash
# Bulk reject 3 photos
DELETE /admin/photos/bulk-reject
Body: {
  "photo_ids": [13, 14, 15],
  "reason": "Photos violate our content policy on appropriate imagery"
}

# Expected: All 3 deleted, audit logs created
```

---

### Step 6: Test Validation Errors
```bash
# Too many photos (51)
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [1, 2, 3, ... 51 IDs] }
# Expected: 400 Bad Request

# Empty array
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [] }
# Expected: 400 Bad Request

# Short reason
DELETE /admin/photos/bulk-reject
Body: { "photo_ids": [1], "reason": "Bad" }
# Expected: 400 Bad Request

# Long reason (501+ chars)
DELETE /admin/photos/bulk-reject
Body: { "photo_ids": [1], "reason": "<501 characters>" }
# Expected: 400 Bad Request
```

---

### Step 7: Test Authorization
```bash
# Try with USER role token
GET /admin/photos/pending
Authorization: Bearer <USER_TOKEN>
# Expected: 403 Forbidden

# Try without token
GET /admin/photos/pending
# Expected: 401 Unauthorized
```

---

## 📊 Verification Checklist

### Database Verification
After running tests, verify in database:

```sql
-- Check approved photos
SELECT * FROM user_photos WHERE is_approved = true;

-- Check audit logs for bulk operations
SELECT * FROM audit_logs 
WHERE action LIKE '%bulk%' 
ORDER BY created_at DESC;

-- Count pending photos
SELECT COUNT(*) FROM user_photos WHERE is_approved = false;
```

---

### Log Verification
Check application logs for:
- [ ] `"Pending photos retrieved"` with filter details
- [ ] `"Photo approved in bulk operation"` for each approved photo
- [ ] `"Photo rejected in bulk operation"` for each rejected photo
- [ ] `"Bulk approve photos completed"` with summary
- [ ] `"Bulk reject photos completed"` with summary
- [ ] `"Rejected photo deleted from UploadThing (bulk)"`

---

## 🎯 Success Criteria

### ✅ All Tests Pass If:
1. Pending photos endpoint returns correct filtered/sorted results
2. Individual approve/reject work as before (no regression)
3. Bulk approve processes up to 50 photos
4. Bulk reject processes up to 50 photos with reason
5. Fault tolerance works (partial success allowed)
6. Validation catches invalid inputs
7. Authorization blocks unauthorized users
8. Audit logs created for every photo operation
9. Rate limiting prevents abuse
10. Response format matches specification

---

## 🐛 Known Edge Cases

### Edge Case 1: All Photos Invalid
```http
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [999, 998, 997] }
```
**Result:** 200 OK, `processed: 0, failed: 3`, all in failures array

---

### Edge Case 2: Already Approved Photos in Bulk
```http
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [1, 2, 3] }
# Run twice
```
**First run:** All approved  
**Second run:** All reported as "already approved" in failures

---

### Edge Case 3: UploadThing Deletion Fails
If UploadThing API is down during bulk reject:
- ✅ Database deletion still proceeds
- ✅ Error logged but operation continues
- ✅ Photo marked as deleted
- ⚠️ File might remain on UploadThing (orphaned)

---

### Edge Case 4: Concurrent Moderation
Two moderators approve same photo simultaneously:
- ✅ First one succeeds
- ✅ Second one gets "already approved" error
- ✅ No duplicate processing

---

## 🚀 Performance Testing

### Bulk Operation Performance
Test with maximum allowed photos:

```http
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [1, 2, 3, ... 50 IDs] }
```

**Measure:**
- Response time (should be < 5 seconds)
- Database connections
- Memory usage
- Audit log creation time

**Expected:**
- ~50 database queries (find + update per photo)
- ~50 audit log inserts
- Sequential processing (not parallelized)

---

## 📝 Postman Collection Structure

### Folder: Admin - Photo Moderation
```
📁 Photo Moderation
  📄 Get Pending Photos (Default)
  📄 Get Pending Photos (Date Filter)
  📄 Get Pending Photos (User Filter)
  📄 Get Pending Photos (Sort Newest)
  📄 Approve Photo (Single)
  📄 Reject Photo (Single)
  📄 Bulk Approve Photos (Valid)
  📄 Bulk Approve Photos (Fault Tolerance)
  📄 Bulk Reject Photos (Valid)
  📄 Bulk Reject Photos (Fault Tolerance)
  📄 Bulk Approve (Validation Error - Too Many)
  📄 Bulk Approve (Validation Error - Empty)
  📄 Bulk Reject (Validation Error - Short Reason)
```

### Environment Variables for Postman
```
BASE_URL=http://localhost:5000
ADMIN_TOKEN=<admin_jwt_token>
MODERATOR_TOKEN=<moderator_jwt_token>
USER_TOKEN=<user_jwt_token>
TEST_USER_ID=<uuid>
```

---

## 🎓 Tips for Testing

1. **Create test photos first:** Upload several photos as regular users
2. **Use different moderators:** Test with both ADMIN and MODERATOR tokens
3. **Mix valid and invalid IDs:** Test fault tolerance thoroughly
4. **Check audit logs:** Verify every action is logged
5. **Test edge cases:** Already approved, not found, etc.
6. **Monitor logs:** Watch console logs during testing
7. **Verify database:** Check actual database state after operations

---

**Last Updated:** February 4, 2026  
**Status:** Ready for Testing ✅
