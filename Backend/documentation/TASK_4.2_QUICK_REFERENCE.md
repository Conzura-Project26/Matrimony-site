# Task 4.2: Manage Interests - Quick Reference

## 🚀 Quick Start

### Endpoints Overview
```
GET    /interests/sent              - Get my sent interests
GET    /interests/received          - Get interests I received (Inbox)
PUT    /interests/:id/accept        - Accept interest
PUT    /interests/:id/reject        - Reject interest
DELETE /interests/:id               - Withdraw sent interest
```

---

## 📋 API Endpoints

### 1. GET /interests/sent
**Purpose:** View interests you've sent

**Query Params:**
```
?status=PENDING|ACCEPTED|REJECTED|WITHDRAWN   (optional)
?page=1                                        (default: 1)
?limit=20                                      (default: 20, max: 50)
?sort=sent_at_desc|sent_at_asc                (default: sent_at_desc)
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "interest_id": 123,
    "profile_id": "MAT00001234",
    "full_name": "Priya Sharma",
    "age": 26,
    "primary_photo_url": "...",
    "location": "Mumbai, Maharashtra",
    "education": "Bachelor's Degree",
    "profession": "Software Engineer",
    "interest_status": "PENDING",
    "sent_at": "2026-02-03T10:30:00.000Z"
  }],
  "pagination": { ... }
}
```

---

### 2. GET /interests/received
**Purpose:** View interests received (Inbox view)

**Default:** Returns only PENDING interests

**Query Params:**
```
?status=PENDING|ACCEPTED|REJECTED   (optional, default: PENDING)
?page=1                             (default: 1)
?limit=20                           (default: 20, max: 50)
?sort=received_at_desc|received_at_asc  (default: received_at_desc)
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "interest_id": 456,
    "profile_id": "MAT00005678",
    "full_name": "Rahul Kumar",
    "age": 28,
    "primary_photo_url": "...",
    "location": "Bangalore, Karnataka",
    "education": "Master's Degree",
    "profession": "Data Scientist",
    "interest_status": "PENDING",
    "received_at": "2026-02-03T12:45:00.000Z",
    "match_score": 78
  }],
  "pagination": { ... }
}
```

**Key Feature:** Includes `match_score` (0-100) for prioritization

---

### 3. PUT /interests/:interestId/accept
**Purpose:** Accept a pending interest request

**Validation:**
- Must be the receiver
- Status must be PENDING

**Response:**
```json
{
  "success": true,
  "message": "Interest accepted successfully. You can now message Rahul Kumar.",
  "data": {
    "interest_id": 456,
    "status": "ACCEPTED",
    "responded_at": "2026-02-03T14:20:00.000Z",
    "sender": {
      "id": "uuid",
      "full_name": "Rahul Kumar",
      "profile_id": "MAT00005678"
    },
    "is_mutual": true
  }
}
```

**Side Effects:**
- ✅ Creates notification for sender
- ✅ Enables messaging
- ✅ Detects mutual interest

---

### 4. PUT /interests/:interestId/reject
**Purpose:** Reject a pending interest request

**Validation:**
- Must be the receiver
- Status must be PENDING

**Response:**
```json
{
  "success": true,
  "message": "Interest rejected successfully",
  "data": {
    "interest_id": 789,
    "status": "REJECTED",
    "responded_at": "2026-02-03T15:10:00.000Z"
  }
}
```

**Side Effects:**
- ❌ No notification (silent rejection)
- ⏰ 30-day cooldown before re-send

---

### 5. DELETE /interests/:interestId
**Purpose:** Withdraw a sent interest

**Validation:**
- Must be the sender
- Status must be PENDING

**Response:**
```json
{
  "success": true,
  "message": "Interest withdrawn successfully",
  "data": {
    "interest_id": 123,
    "status": "WITHDRAWN",
    "receiver": {
      "id": "uuid",
      "full_name": "Priya Sharma",
      "profile_id": "MAT00001234"
    }
  }
}
```

**Side Effects:**
- ❌ No notification (silent)
- ✅ Status updated (not deleted)
- ✅ Can re-send immediately

---

## 🔐 Authentication

All endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

---

## 📊 Status Flow

```
PENDING
   ↓
   ├─ Accept  → ACCEPTED (final)
   ├─ Reject  → REJECTED (30-day cooldown)
   └─ Withdraw → WITHDRAWN (immediate re-send allowed)
```

---

## ⚠️ Error Codes

| Code | Error | Scenario |
|------|-------|----------|
| 400 | Bad Request | Invalid interest ID format |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not your interest |
| 404 | Not Found | Interest doesn't exist |
| 409 | Conflict | Already actioned, or invalid status |

---

## 🎯 Key Features

### Sent Interests
- ✅ View all sent interests
- ✅ Filter by status
- ✅ Track history
- ✅ Withdraw pending interests

### Received Interests
- ✅ Inbox view (PENDING by default)
- ✅ **Match scores** for prioritization
- ✅ Filter by status
- ✅ Accept/reject actions

### Security
- ✅ Authorization checks (sender/receiver validation)
- ✅ Blocked users excluded
- ✅ Audit logging
- ✅ JWT authentication

### Privacy
- ✅ Silent rejections (no notification)
- ✅ Silent withdrawals (no notification)
- ✅ Blocked users hidden

---

## 💡 Usage Tips

### For Viewing Inbox
```bash
# Get pending interests (default inbox view)
GET /interests/received

# Get all received interests
GET /interests/received?status=ACCEPTED
```

### For Managing Sent
```bash
# View all sent
GET /interests/sent

# View only pending sent
GET /interests/sent?status=PENDING

# Withdraw a sent interest
DELETE /interests/123
```

### For Responding
```bash
# Accept interest
PUT /interests/456/accept

# Reject interest
PUT /interests/789/reject
```

---

## 🧪 Testing Checklist

- [ ] Get sent interests - all statuses
- [ ] Get sent interests - filter by PENDING
- [ ] Get received interests - default (PENDING)
- [ ] Get received interests - filter by ACCEPTED
- [ ] Match score calculation working
- [ ] Accept pending interest
- [ ] Mutual interest detection
- [ ] Reject pending interest
- [ ] Withdraw pending interest
- [ ] Authorization validation (403 errors)
- [ ] Status validation (409 errors)
- [ ] Pagination working
- [ ] Sorting working
- [ ] Blocked users excluded
- [ ] Notifications created (accept only)

---

## 📂 Files Modified

1. **Backend/src/services/interestService.js**
   - Added 5 service functions
   - Match score integration
   - Blocking checks
   - Pagination logic

2. **Backend/src/controllers/interestController.js**
   - Added 5 controller functions
   - Validation logic
   - Audit logging

3. **Backend/src/routes/interestRoutes.js**
   - Added 5 routes
   - Swagger documentation
   - Authentication middleware

4. **Backend/documentation/TASK_4.2_MANAGE_INTERESTS_SUMMARY.md**
   - Complete implementation documentation

5. **Backend/documentation/TASK_4.2_QUICK_REFERENCE.md** (this file)
   - Quick reference guide

---

## 🎉 Status

✅ **COMPLETED** - All endpoints functional and documented
