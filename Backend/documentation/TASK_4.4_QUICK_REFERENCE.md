# 📨 TASK 4.4: CONVERSATION MANAGEMENT - QUICK REFERENCE

**Production-Ready API Reference for Conversation Management**

---

## 🚀 Quick Start

### **Base URL**
```
http://localhost:3000/messages
```

### **Authentication**
All endpoints require Bearer token:
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📡 API Endpoints

### **1. Get Global Unread Count**
```http
GET /messages/unread-count
```

**Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unread_count": 15
  }
}
```

**Use Case:** Display notification badge  
**Rate Limit:** 60/min

---

### **2. Delete Conversation (Soft Delete)**
```http
DELETE /messages/conversations/:userId
```

**Parameters:**
- `:userId` - UUID of other user

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "data": {
    "deleted_count": 47,
    "deleted_at": "2026-02-03T10:30:45.678Z",
    "other_user_id": "uuid-here"
  }
}
```

**Features:**
- ✅ One-sided deletion
- ✅ Soft delete (hidden forever)
- ✅ New messages appear normally

**Rate Limit:** 10/min

---

### **3. Delete Single Message (Soft Delete)**
```http
DELETE /messages/:messageId
```

**Parameters:**
- `:messageId` - Integer message ID

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": {
    "message_id": 12345,
    "deleted_at": "2026-02-03T12:00:00.000Z",
    "deleted_as": "sender"
  }
}
```

**Features:**
- ✅ One-sided deletion
- ✅ Can only delete your own messages
- ✅ Returns role (sender/receiver)

**Rate Limit:** 20/min

---

### **4. Archive Conversation**
```http
POST /messages/conversations/:userId/archive
```

**Parameters:**
- `:userId` - UUID of other user

**Response:**
```json
{
  "success": true,
  "message": "Conversation archived successfully",
  "data": {
    "archived_count": 47,
    "archived_at": "2026-02-03T11:15:30.123Z",
    "other_user_id": "uuid-here"
  }
}
```

**Features:**
- ✅ Hides from inbox (not deleted)
- ✅ One-sided operation
- ✅ Can unarchive anytime
- ✅ Messages still accessible

**Rate Limit:** 15/min

---

### **5. Unarchive Conversation**
```http
DELETE /messages/conversations/:userId/archive
```

**Parameters:**
- `:userId` - UUID of other user

**Response:**
```json
{
  "success": true,
  "message": "Conversation unarchived successfully",
  "data": {
    "unarchived_count": 47,
    "other_user_id": "uuid-here"
  }
}
```

**Features:**
- ✅ Restores to inbox
- ✅ Immediate effect

**Rate Limit:** 15/min

---

### **6. Get Conversations List (Updated)**
```http
GET /messages/conversations?includeArchived=true
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)
- `includeArchived` - Include archived conversations (default: false) ✅ NEW

**Response:**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "user": {
        "user_id": "uuid",
        "profile_id": "MAT00001234",
        "full_name": "Jane Doe",
        "photo_url": "https://...",
        "last_active_at": "2026-02-03T10:00:00Z"
      },
      "last_message": {
        "content": "Hello!",
        "sent_at": "2026-02-03T09:30:00Z",
        "is_own_message": true,
        "is_read": true
      },
      "unread_count": 3,
      "last_message_at": "2026-02-03T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1,
    "has_more": false
  }
}
```

**Features:**
- ✅ Excludes archived by default
- ✅ Use `?includeArchived=true` to see archived
- ✅ Excludes blocked users
- ✅ Excludes deleted messages

**Rate Limit:** 30/min

---

## 🧪 cURL Examples

### **Get Unread Count**
```bash
curl -X GET http://localhost:3000/messages/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Delete Conversation**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/17bbc1c7-9f2b-4dbe-851e-2cf321841e9c \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Delete Single Message**
```bash
curl -X DELETE http://localhost:3000/messages/12345 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Archive Conversation**
```bash
curl -X POST http://localhost:3000/messages/conversations/17bbc1c7-9f2b-4dbe-851e-2cf321841e9c/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Unarchive Conversation**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/17bbc1c7-9f2b-4dbe-851e-2cf321841e9c/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Get Conversations (Include Archived)**
```bash
curl -X GET "http://localhost:3000/messages/conversations?includeArchived=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Error Responses

### **400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid user ID format",
  "statusCode": 400
}
```

**Causes:**
- Invalid UUID format
- Invalid message ID format
- Cannot delete/archive conversation with yourself

---

### **403 Forbidden**
```json
{
  "success": false,
  "message": "You can only delete your own messages or messages sent to you",
  "statusCode": 403
}
```

**Causes:**
- Trying to delete someone else's message
- Not sender or receiver of message

---

### **404 Not Found**
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

**Causes:**
- User doesn't exist
- Message doesn't exist

---

### **409 Conflict**
```json
{
  "success": false,
  "message": "Message already deleted",
  "statusCode": 409
}
```

**Causes:**
- Trying to delete already-deleted message
- Trying to delete already-deleted conversation

---

### **429 Too Many Requests**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "statusCode": 429
}
```

**Rate Limits:**
- Delete conversation: 10/min
- Delete message: 20/min
- Archive/unarchive: 15/min
- Unread count: 60/min

---

## 🗄️ Database Schema

### **Message Model**
```prisma
model Message {
  id                      Int       @id @default(autoincrement())
  sender_id               String    @db.Uuid
  receiver_id             String    @db.Uuid
  content                 String    @db.VarChar(1000)
  sent_at                 DateTime  @default(now())
  read_at                 DateTime?
  
  // Soft delete (Task 4.3)
  deleted_by_sender_at    DateTime?
  deleted_by_receiver_at  DateTime?
  
  // Archive (Task 4.4) ✅ NEW
  archived_by_sender_at   DateTime?
  archived_by_receiver_at DateTime?
}
```

---

## 🔄 Operation Flow

### **Soft Delete Behavior**

**Action:** User A deletes conversation with User B

**Database Updates:**
```sql
-- Messages A sent to B
UPDATE messages 
SET deleted_by_sender_at = NOW()
WHERE sender_id = 'A' AND receiver_id = 'B';

-- Messages B sent to A
UPDATE messages 
SET deleted_by_receiver_at = NOW()
WHERE sender_id = 'B' AND receiver_id = 'A';
```

**Result:**
- ✅ User A: Conversation disappears
- ✅ User B: Still sees conversation
- ✅ New messages: Appear normally for both

---

### **Archive Behavior**

**Action:** User A archives conversation with User B

**Database Updates:**
```sql
-- Messages A sent to B
UPDATE messages 
SET archived_by_sender_at = NOW()
WHERE sender_id = 'A' AND receiver_id = 'B'
  AND deleted_by_sender_at IS NULL;

-- Messages B sent to A
UPDATE messages 
SET archived_by_receiver_at = NOW()
WHERE sender_id = 'B' AND receiver_id = 'A'
  AND deleted_by_receiver_at IS NULL;
```

**Result:**
- ✅ User A: Conversation hidden from inbox
- ✅ User B: Unaffected
- ✅ User A: Can view with `?includeArchived=true`
- ✅ User A: Can unarchive anytime

---

## 🎯 Use Cases

### **Use Case 1: Clear Inbox**
```javascript
// User wants to clean up old conversations
DELETE /messages/conversations/:userId
// Result: Conversation hidden forever
```

---

### **Use Case 2: Temporary Hide**
```javascript
// User wants to hide but keep accessible
POST /messages/conversations/:userId/archive
// Result: Hidden from inbox, can restore later
```

---

### **Use Case 3: Remove Embarrassing Message**
```javascript
// User sent wrong message
DELETE /messages/:messageId
// Result: Message disappears from user's view only
```

---

### **Use Case 4: Notification Badge**
```javascript
// Display unread count
GET /messages/unread-count
// Result: { "unread_count": 15 }
```

---

## 🔐 Security Notes

### **Authentication**
- ✅ All endpoints require valid JWT token
- ✅ Token verified via `authenticateToken` middleware

### **Authorization**
- ✅ Can only delete own messages
- ✅ Can only delete conversations you're part of
- ✅ Cannot affect other user's view

### **Rate Limiting**
- ✅ All endpoints rate-limited
- ✅ Prevents abuse and spam
- ✅ Configurable limits

### **Audit Logging**
- ✅ All actions logged
- ✅ Actor ID, action, IP address recorded
- ✅ Compliance and debugging

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /unread-count | 60 | 1 minute |
| DELETE /conversations/:userId | 10 | 1 minute |
| DELETE /:messageId | 20 | 1 minute |
| POST /conversations/:userId/archive | 15 | 1 minute |
| DELETE /conversations/:userId/archive | 15 | 1 minute |

---

## 🧪 Testing Checklist

- [ ] ✅ Delete conversation with valid user
- [ ] ✅ Delete conversation with invalid UUID
- [ ] ✅ Delete conversation with yourself (400)
- [ ] ✅ Delete single message (sender)
- [ ] ✅ Delete single message (receiver)
- [ ] ✅ Delete someone else's message (403)
- [ ] ✅ Delete already-deleted message (409)
- [ ] ✅ Archive conversation
- [ ] ✅ Unarchive conversation
- [ ] ✅ Get conversations (archived excluded)
- [ ] ✅ Get conversations (archived included)
- [ ] ✅ Get unread count
- [ ] ✅ Rate limit enforcement
- [ ] ✅ Audit logging verification
- [ ] ✅ Blocked user exclusion

---

## 🚀 Deployment

### **1. Run Migration**
```bash
cd Backend
npx prisma migrate deploy
npx prisma generate
```

### **2. Restart Server**
```bash
npm run dev
```

### **3. Verify Swagger**
```
http://localhost:3000/api-docs
```

---

## 📚 Related Endpoints

### **Message Service (Task 4.3)**
- `POST /messages/:userId` - Send message
- `GET /messages/:userId` - Get conversation
- `GET /messages/conversations` - Get conversations list

### **Block Service (Task 4.x)**
- `POST /blocks/:userId` - Block user
- `DELETE /blocks/:userId` - Unblock user
- `GET /blocks` - Get blocked users

---

## 💡 Pro Tips

### **Tip 1: Archive Instead of Delete**
```javascript
// Use archive for temporary hiding
// Use delete for permanent removal
```

### **Tip 2: Check Unread Count on Login**
```javascript
// Immediately after login
GET /messages/unread-count
// Update UI badge
```

### **Tip 3: Bulk Operations**
```javascript
// For multiple messages, call endpoint multiple times
// Each operation is independent and safe
```

### **Tip 4: Handle 409 Gracefully**
```javascript
// If message already deleted, just show success
// User doesn't need to know the technical details
```

---

## ✅ Quick Checklist

**Implementation:**
- [x] ✅ Delete conversation endpoint
- [x] ✅ Delete single message endpoint
- [x] ✅ Archive/unarchive endpoints
- [x] ✅ Global unread count endpoint
- [x] ✅ Updated conversations list
- [x] ✅ Rate limiters
- [x] ✅ Swagger documentation
- [x] ✅ Audit logging
- [x] ✅ Error handling

**Database:**
- [x] ✅ Migration created
- [x] ✅ Schema updated
- [x] ✅ Indexes added

**Testing:**
- [ ] 🧪 Unit tests
- [ ] 🧪 Integration tests
- [ ] 🧪 Manual testing
- [ ] 🧪 Rate limit testing

---

**🎉 Task 4.4 Quick Reference Complete!**

For detailed information, see `TASK_4.4_CONVERSATION_MANAGEMENT_SUMMARY.md`
