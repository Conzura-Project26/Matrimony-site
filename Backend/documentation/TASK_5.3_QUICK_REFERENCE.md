# Task 5.3: Photo Moderation - Quick Reference

## 📍 API Endpoints

### 1️⃣ Get Pending Photos
```
GET /admin/photos/pending
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `uploaded_from` (date, optional) - YYYY-MM-DD
- `uploaded_to` (date, optional) - YYYY-MM-DD
- `user_id` (UUID, optional)
- `sort` (enum, default: oldest) - `oldest` | `newest`

**Example:**
```bash
GET /admin/photos/pending?uploaded_from=2026-01-01&sort=oldest&limit=50
```

---

### 2️⃣ Approve Single Photo
```
PATCH /admin/photos/:photoId/approve
```

**Example:**
```bash
PATCH /admin/photos/123/approve
```

---

### 3️⃣ Reject Single Photo
```
DELETE /admin/photos/:photoId
Body: { "reason": "Inappropriate content" }
```

**Example:**
```bash
DELETE /admin/photos/456
Content-Type: application/json

{
  "reason": "Inappropriate content violating guidelines"
}
```

---

### 4️⃣ Bulk Approve Photos ⭐ NEW
```
PATCH /admin/photos/bulk-approve
Body: { "photo_ids": [1, 2, 3, 4, 5] }
```

**Limits:**
- Min: 1 photo
- Max: 50 photos

**Example:**
```bash
PATCH /admin/photos/bulk-approve
Content-Type: application/json

{
  "photo_ids": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk approve completed: 9 processed, 1 failed",
  "data": {
    "summary": {
      "total": 10,
      "processed": 9,
      "failed": 1
    },
    "failures": [
      { "photo_id": 12, "error": "Photo already approved" }
    ]
  }
}
```

---

### 5️⃣ Bulk Reject Photos ⭐ NEW
```
DELETE /admin/photos/bulk-reject
Body: { "photo_ids": [1, 2, 3], "reason": "Reason here" }
```

**Limits:**
- Min: 1 photo
- Max: 50 photos
- Reason: 10-500 characters (applies to ALL photos)

**Example:**
```bash
DELETE /admin/photos/bulk-reject
Content-Type: application/json

{
  "photo_ids": [20, 21, 22, 23, 24],
  "reason": "Photos contain inappropriate content that violates our community standards"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk reject completed: 5 processed, 0 failed",
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

---

## 🔐 Authorization

**All endpoints require:**
- ✅ Valid JWT token
- ✅ Role: `ADMIN` or `MODERATOR`

**Permissions:**
- `view_all_photos_pending`
- `approve_photos`
- `reject_photos`

---

## ⚡ Rate Limiting

| Endpoint | Rate Limiter |
|----------|-------------|
| GET `/admin/photos/pending` | `adminReadRateLimiter` |
| PATCH `/admin/photos/:id/approve` | None |
| DELETE `/admin/photos/:id` | None |
| PATCH `/admin/photos/bulk-approve` | `adminWriteRateLimiter` |
| DELETE `/admin/photos/bulk-reject` | `adminDestructiveRateLimiter` |

---

## 🎯 Fault Tolerance

### Bulk Operations are Fault-Tolerant ✅

**Scenario:** Submit 10 photo IDs, 3 are invalid (not found/already approved)

**Result:**
- ✅ 7 valid photos are processed
- ❌ 3 invalid photos are reported in `failures` array
- ✅ HTTP 200 OK (not 400 or 500)
- ✅ Detailed error messages for each failure

**Example:**
```json
{
  "data": {
    "summary": {
      "total": 10,
      "processed": 7,
      "failed": 3
    },
    "failures": [
      { "photo_id": 4, "error": "Photo not found" },
      { "photo_id": 7, "error": "Photo already approved" },
      { "photo_id": 9, "error": "Photo not found" }
    ]
  }
}
```

---

## 📊 Audit Logging

### All operations are logged ✅

**Bulk Approve:**
- Creates **1 audit log per photo**
- Action: `"Photo approved (bulk) for user: John Doe"`

**Bulk Reject:**
- Creates **1 audit log per photo**
- Action: `"Photo rejected (bulk) - User: Jane Smith (+919876543210) - Reason: Inappropriate content"`

---

## 🧪 Quick Test Commands

### Get pending photos
```bash
curl -X GET "http://localhost:5000/admin/photos/pending?sort=oldest&limit=20" \
  -H "Authorization: Bearer YOUR_MODERATOR_TOKEN"
```

### Bulk approve
```bash
curl -X PATCH "http://localhost:5000/admin/photos/bulk-approve" \
  -H "Authorization: Bearer YOUR_MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"photo_ids": [1, 2, 3, 4, 5]}'
```

### Bulk reject
```bash
curl -X DELETE "http://localhost:5000/admin/photos/bulk-reject" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "photo_ids": [10, 11, 12],
    "reason": "Inappropriate content violating community guidelines"
  }'
```

---

## ⚠️ Important Notes

1. **Bulk limit:** Maximum 50 photos per request
2. **Reason required:** For bulk reject, reason must be 10-500 characters
3. **No notifications:** Users are NOT notified of approvals/rejections
4. **File deletion:** UploadThing deletion is "best effort" (doesn't fail the operation)
5. **Sorting default:** Always use `oldest` first for fair moderation queue
6. **Audit logs:** Every action is logged individually for compliance

---

## 🔗 Related Documentation

- [TASK_5.1_ADMIN_USER_MANAGEMENT.md](TASK_5.1_ADMIN_USER_MANAGEMENT.md)
- [AUTHORIZATION_MIDDLEWARE_GUIDE.md](AUTHORIZATION_MIDDLEWARE_GUIDE.md)
- [PHOTO_UPLOAD_TESTING.md](PHOTO_UPLOAD_TESTING.md)
- [BACKEND_DEVELOPMENT_PLAN.md](BACKEND_DEVELOPMENT_PLAN.md)

---

**Task Status:** ✅ Complete  
**Date Completed:** February 4, 2026
