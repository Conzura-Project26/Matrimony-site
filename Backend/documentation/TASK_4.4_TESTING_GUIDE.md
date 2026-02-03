# 🧪 TASK 4.4: CONVERSATION MANAGEMENT - TESTING GUIDE

**Comprehensive Testing Guide for Conversation Management Features**

---

## ⚠️ DEPLOYMENT INSTRUCTIONS

### **Step 1: Apply Database Migration**

Since there's schema drift detected, you have two options:

#### **Option A: Fresh Migration (Recommended for Development)**
```bash
cd Backend
npx prisma migrate reset  # ⚠️ This will delete all data!
npx prisma migrate dev
npx prisma generate
```

#### **Option B: Manual SQL (Production/Staging)**
Run this SQL directly on your database:

```sql
-- Add archive columns
ALTER TABLE "messages" 
ADD COLUMN IF NOT EXISTS "archived_by_sender_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "archived_by_receiver_at" TIMESTAMP(3);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "idx_messages_archived_sender" 
ON "messages"("sender_id", "archived_by_sender_at") 
WHERE "archived_by_sender_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_messages_archived_receiver" 
ON "messages"("receiver_id", "archived_by_receiver_at") 
WHERE "archived_by_receiver_at" IS NOT NULL;
```

Then generate Prisma client:
```bash
npx prisma generate
```

### **Step 2: Restart Server**
```bash
npm run dev
```

### **Step 3: Verify Swagger Documentation**
Open: `http://localhost:3000/api-docs`

Search for "Task 4.4" or "Conversation Management"

---

## 🧪 Testing Prerequisites

### **1. Get Access Token**

Login first:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "YOUR_MOBILE",
    "password": "YOUR_PASSWORD"
  }'
```

Save the `accessToken` from response.

### **2. Create Test Data**

You need:
- ✅ Two test users (User A and User B)
- ✅ Accepted interest between them
- ✅ Some messages exchanged

---

## 📝 Test Scenarios

### **TEST 1: Get Global Unread Count** ⭐

#### **Setup:**
1. Login as User A
2. User B sends messages to User A (unread)

#### **Test:**
```bash
curl -X GET http://localhost:3000/messages/unread-count \
  -H "Authorization: Bearer USER_A_TOKEN"
```

#### **Expected Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unread_count": 5
  }
}
```

#### **Validation:**
- ✅ Count matches number of unread messages
- ✅ Excludes deleted messages
- ✅ Excludes messages from blocked users
- ✅ Fast response (<100ms)

---

### **TEST 2: Delete Conversation (One-Sided)** ⭐

#### **Setup:**
1. User A has conversation with User B
2. Multiple messages exchanged

#### **Test:**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/USER_B_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"
```

#### **Expected Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "data": {
    "deleted_count": 47,
    "deleted_at": "2026-02-03T10:30:45.678Z",
    "other_user_id": "USER_B_UUID"
  }
}
```

#### **Validation:**
✅ **User A:**
- Conversation not in `GET /conversations` list
- Cannot see messages in `GET /messages/:userId`

✅ **User B:**
- Still sees conversation
- Can still see all messages

✅ **Database Check:**
```sql
SELECT * FROM messages 
WHERE 
  (sender_id = 'USER_A' AND receiver_id = 'USER_B')
  OR (sender_id = 'USER_B' AND receiver_id = 'USER_A');
-- Check deleted_by_sender_at and deleted_by_receiver_at
```

---

### **TEST 3: Delete Conversation - Edge Cases**

#### **Test 3.1: Invalid UUID**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/invalid-uuid \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** 400 Bad Request

---

#### **Test 3.2: Delete with Yourself**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/USER_A_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** 400 Bad Request - "Cannot delete conversation with yourself"

---

#### **Test 3.3: User Not Found**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** 404 Not Found

---

### **TEST 4: Delete Single Message** ⭐

#### **Setup:**
1. Get message ID from conversation
2. User A wants to delete one message

#### **Test 4.1: Delete Message (As Sender)**
```bash
curl -X DELETE http://localhost:3000/messages/12345 \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected Response:**
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

**Validation:**
- ✅ Message disappears from User A's view
- ✅ User B still sees the message
- ✅ `deleted_by_sender_at` is set in database

---

#### **Test 4.2: Delete Message (As Receiver)**
```bash
# Login as User B
curl -X DELETE http://localhost:3000/messages/12345 \
  -H "Authorization: Bearer USER_B_TOKEN"
```

**Expected:** 
- `deleted_as`: "receiver"
- `deleted_by_receiver_at` is set

**Validation:**
- ✅ Message disappears from User B's view
- ✅ User A (sender) doesn't see it if already deleted
- ✅ Message eligible for hard delete (both deleted)

---

#### **Test 4.3: Delete Someone Else's Message**
```bash
# User A tries to delete message from User C-D conversation
curl -X DELETE http://localhost:3000/messages/99999 \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** 403 Forbidden - "You can only delete your own messages"

---

#### **Test 4.4: Delete Already-Deleted Message**
```bash
# Delete same message twice
curl -X DELETE http://localhost:3000/messages/12345 \
  -H "Authorization: Bearer USER_A_TOKEN"

# Try again
curl -X DELETE http://localhost:3000/messages/12345 \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** 409 Conflict - "Message already deleted"

---

### **TEST 5: Archive Conversation** ⭐

#### **Test 5.1: Archive**
```bash
curl -X POST http://localhost:3000/messages/conversations/USER_B_UUID/archive \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Conversation archived successfully",
  "data": {
    "archived_count": 47,
    "archived_at": "2026-02-03T11:15:30.123Z",
    "other_user_id": "USER_B_UUID"
  }
}
```

**Validation:**
✅ **Get conversations (default):**
```bash
curl -X GET http://localhost:3000/messages/conversations \
  -H "Authorization: Bearer USER_A_TOKEN"
```
- Conversation NOT in list

✅ **Get conversations (include archived):**
```bash
curl -X GET "http://localhost:3000/messages/conversations?includeArchived=true" \
  -H "Authorization: Bearer USER_A_TOKEN"
```
- Conversation IS in list

✅ **Database Check:**
```sql
SELECT * FROM messages 
WHERE 
  (sender_id = 'USER_A' AND receiver_id = 'USER_B')
  OR (sender_id = 'USER_B' AND receiver_id = 'USER_A');
-- Check archived_by_sender_at and archived_by_receiver_at
```

---

#### **Test 5.2: Unarchive**
```bash
curl -X DELETE http://localhost:3000/messages/conversations/USER_B_UUID/archive \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Conversation unarchived successfully",
  "data": {
    "unarchived_count": 47,
    "other_user_id": "USER_B_UUID"
  }
}
```

**Validation:**
- ✅ Conversation back in default list
- ✅ `archived_by_*_at` fields set to NULL

---

### **TEST 6: New Messages After Delete/Archive**

#### **Test 6.1: New Message After Delete**
```bash
# User A deletes conversation
curl -X DELETE http://localhost:3000/messages/conversations/USER_B_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"

# User B sends new message
curl -X POST http://localhost:3000/messages/USER_A_UUID \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello again!"}'

# User A gets conversations
curl -X GET http://localhost:3000/messages/conversations \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:**
- ✅ Conversation appears for User A
- ✅ Old deleted messages stay hidden
- ✅ New message is visible

---

#### **Test 6.2: New Message After Archive**
```bash
# User A archives conversation
curl -X POST http://localhost:3000/messages/conversations/USER_B_UUID/archive \
  -H "Authorization: Bearer USER_A_TOKEN"

# User B sends new message
curl -X POST http://localhost:3000/messages/USER_A_UUID \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello archived user!"}'

# User A gets conversations
curl -X GET http://localhost:3000/messages/conversations \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:**
- ✅ Conversation still archived (not auto-unarchived yet)
- ✅ New message visible in conversation
- ⚠️ **TODO:** Implement auto-unarchive on new message

---

### **TEST 7: Rate Limiting** ⭐

#### **Test 7.1: Delete Message Rate Limit**
```bash
# Send 21 delete requests in 1 minute
for i in {1..21}; do
  curl -X DELETE http://localhost:3000/messages/$i \
    -H "Authorization: Bearer USER_A_TOKEN"
done
```

**Expected:**
- First 20: Success
- 21st: 429 Too Many Requests

---

#### **Test 7.2: Delete Conversation Rate Limit**
```bash
# Send 11 delete requests in 1 minute
for i in {1..11}; do
  curl -X DELETE http://localhost:3000/messages/conversations/USER_$i_UUID \
    -H "Authorization: Bearer USER_A_TOKEN"
done
```

**Expected:**
- First 10: Success
- 11th: 429 Too Many Requests

---

### **TEST 8: Integration with Blocking** ⭐

#### **Setup:**
1. User A blocks User B
2. Existing conversation remains

#### **Test 8.1: Delete After Block**
```bash
# User A blocks User B
curl -X POST http://localhost:3000/blocks/USER_B_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"

# User A deletes conversation
curl -X DELETE http://localhost:3000/messages/conversations/USER_B_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:**
- ✅ Both operations succeed
- ✅ Conversation deleted from User A's view

---

#### **Test 8.2: Unread Count Excludes Blocked**
```bash
# User A blocks User B
curl -X POST http://localhost:3000/blocks/USER_B_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"

# Check unread count
curl -X GET http://localhost:3000/messages/unread-count \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:**
- ✅ Unread messages from User B NOT counted
- ✅ Only unread from non-blocked users

---

### **TEST 9: Audit Logging** ⭐

#### **Database Check:**
```sql
SELECT * FROM audit_logs 
WHERE actor_id = 'USER_A_UUID'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Actions:**
- `MESSAGE_CONVERSATION_DELETE:USER_B_UUID`
- `MESSAGE_DELETE:12345`
- `MESSAGE_CONVERSATION_ARCHIVE:USER_B_UUID`
- `MESSAGE_CONVERSATION_UNARCHIVE:USER_B_UUID`

---

### **TEST 10: Hard Delete Eligibility** ⭐

#### **Setup:**
1. User A deletes conversation with User B
2. User B deletes conversation with User A

#### **Test:**
```sql
-- Check messages eligible for hard delete
SELECT 
  id,
  sender_id,
  receiver_id,
  deleted_by_sender_at,
  deleted_by_receiver_at,
  CASE 
    WHEN deleted_by_sender_at IS NOT NULL 
      AND deleted_by_receiver_at IS NOT NULL 
    THEN 'ELIGIBLE' 
    ELSE 'NOT_ELIGIBLE' 
  END as hard_delete_status
FROM messages
WHERE 
  (sender_id IN ('USER_A', 'USER_B') 
   AND receiver_id IN ('USER_A', 'USER_B'))
  OR (sender_id IN ('USER_A', 'USER_B') 
      AND receiver_id IN ('USER_A', 'USER_B'));
```

**Expected:**
- ✅ Messages show `ELIGIBLE` when both deleted
- ✅ Cleanup job can safely remove these

---

## 📊 Performance Testing

### **Test 1: Unread Count Performance**
```bash
# Measure response time
time curl -X GET http://localhost:3000/messages/unread-count \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** < 100ms (with proper indexes)

---

### **Test 2: Delete Conversation Performance**
```bash
# Measure response time for large conversation (500+ messages)
time curl -X DELETE http://localhost:3000/messages/conversations/USER_B_UUID \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** < 500ms

---

### **Test 3: Archive Conversation Performance**
```bash
# Measure response time
time curl -X POST http://localhost:3000/messages/conversations/USER_B_UUID/archive \
  -H "Authorization: Bearer USER_A_TOKEN"
```

**Expected:** < 500ms

---

## ✅ Test Coverage Checklist

### **Feature Tests:**
- [ ] Get global unread count
- [ ] Delete conversation (valid)
- [ ] Delete conversation (invalid UUID)
- [ ] Delete conversation (with yourself)
- [ ] Delete single message (sender)
- [ ] Delete single message (receiver)
- [ ] Delete message (not yours - forbidden)
- [ ] Delete message (already deleted - conflict)
- [ ] Archive conversation
- [ ] Unarchive conversation
- [ ] Get conversations (archived excluded)
- [ ] Get conversations (archived included)

### **Edge Cases:**
- [ ] New message after delete
- [ ] New message after archive
- [ ] Delete already-deleted conversation
- [ ] Archive already-archived conversation
- [ ] Operations with blocked users

### **Integration Tests:**
- [ ] Delete + Block integration
- [ ] Archive + Unread count
- [ ] Delete + New message flow

### **Security Tests:**
- [ ] Rate limiting enforcement
- [ ] Authentication required
- [ ] Authorization (own messages only)
- [ ] Audit logging

### **Performance Tests:**
- [ ] Unread count speed
- [ ] Delete large conversation
- [ ] Archive large conversation
- [ ] Get conversations with pagination

---

## 🐛 Known Issues / TODOs

### **TODO 1: Auto-Unarchive on New Message**
Currently, archived conversations don't auto-unarchive when new message arrives.

**Implementation:**
```javascript
// In messageService.sendMessage()
if (message created) {
  // Check if conversation is archived for receiver
  const isArchived = await checkIfArchived(receiverId, senderId);
  if (isArchived) {
    await unarchiveConversation(receiverId, senderId);
  }
}
```

---

### **TODO 2: Hard Delete Cleanup Job**
Implement scheduled job to permanently delete messages where both users deleted.

**Implementation:**
```javascript
// Cron job (weekly)
const cleanupOldDeletedMessages = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await prisma.message.deleteMany({
    where: {
      deleted_by_sender_at: { lt: thirtyDaysAgo, not: null },
      deleted_by_receiver_at: { lt: thirtyDaysAgo, not: null }
    }
  });
};
```

---

### **TODO 3: Bulk Delete Operations**
Add endpoint to delete multiple messages/conversations at once.

---

## 🚀 Final Verification

### **Before Deployment:**
1. ✅ Run all test scenarios
2. ✅ Verify database migration applied
3. ✅ Check Swagger documentation
4. ✅ Verify rate limiters working
5. ✅ Test with blocked users
6. ✅ Performance testing passed
7. ✅ Audit logging verified

### **Post-Deployment:**
1. Monitor error logs
2. Track API response times
3. Check database query performance
4. Monitor rate limit hits
5. Verify user feedback

---

**🎉 Task 4.4 Testing Guide Complete!**

For API reference, see `TASK_4.4_QUICK_REFERENCE.md`  
For implementation details, see `TASK_4.4_CONVERSATION_MANAGEMENT_SUMMARY.md`
