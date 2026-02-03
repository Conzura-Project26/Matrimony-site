# 📨 TASK 4.3: MESSAGE SERVICE - QUICK REFERENCE

## 🎯 One-Line Summary
Complete REST API messaging system with interest validation, blocking protection, and multi-layer rate limiting.

---

## 📋 API ENDPOINTS

### 1️⃣ Send Message
```http
POST /messages/:userId
Authorization: Bearer {token}
Content-Type: application/json

{"content": "Message text (1-1000 chars)"}
```
**Response:** 201 Created
**Rate Limits:** 30/min, 100/hour, 5 new conversations/hour

---

### 2️⃣ Get Conversation (Chat History)
```http
GET /messages/:userId?cursor={msgId}&limit=20
Authorization: Bearer {token}
```
**Response:** 200 OK (messages in ASC order)
**Rate Limit:** 60/min

---

### 3️⃣ Get All Conversations (Inbox)
```http
GET /messages/conversations?page=1&limit=20
Authorization: Bearer {token}
```
**Response:** 200 OK (ordered by latest message)
**Rate Limit:** 30/min

---

## ✅ VALIDATION RULES

### Interest Requirement (Option A)
```
✅ If User A → User B is ACCEPTED: Both can message
✅ If User B → User A is ACCEPTED: Both can message
❌ Only ONE direction needs ACCEPTED
```

### Other Validations
- ❌ Cannot message yourself
- ❌ Cannot message blocked users (bidirectional)
- ❌ Cannot message if no accepted interest
- ✅ Content: 1-1000 characters (trimmed)

---

## 🗄️ DATABASE SCHEMA

```prisma
model Message {
  id                     Int       @id @default(autoincrement())
  sender_id              String    @db.Uuid
  receiver_id            String    @db.Uuid
  content                String    @db.VarChar(1000)
  sent_at                DateTime  @default(now())
  read_at                DateTime?
  deleted_by_sender_at   DateTime?
  deleted_by_receiver_at DateTime?
  
  @@index([sender_id, sent_at])
  @@index([receiver_id, read_at])
  @@index([sender_id, receiver_id, sent_at])
}
```

---

## 📁 FILE STRUCTURE

```
Backend/
├── src/
│   ├── config/
│   │   └── messageConfig.js          ✨ NEW - Rate limiters & constants
│   ├── services/
│   │   └── messageService.js         ✨ NEW - Business logic
│   ├── controllers/
│   │   └── messageController.js      ✨ NEW - HTTP handlers
│   └── routes/
│       └── messageRoutes.js          ✨ NEW - Route definitions
├── prisma/
│   └── schema.prisma                 ✏️ MODIFIED - Message model updated
├── index.js                          ✏️ MODIFIED - Routes registered
└── documentation/
    └── TASK_4.3_MESSAGE_SERVICE_SUMMARY.md  📄 Full docs
```

---

## 🛡️ RATE LIMITING (3 Layers)

```
┌───────────────────────────────────────┐
│ Layer 1: Global (100 req/15min)      │
└───────────────┬───────────────────────┘
                │
┌───────────────▼───────────────────────┐
│ Layer 2: Endpoint-Specific           │
│  ├─ POST /messages/:userId (30/min)  │
│  ├─ GET /messages/:userId (60/min)   │
│  └─ GET /conversations (30/min)      │
└───────────────┬───────────────────────┘
                │
┌───────────────▼───────────────────────┐
│ Layer 3: Business Logic              │
│  ├─ 100 messages per hour (hourly)   │
│  └─ 5 new conversations per hour     │
└────────────────────────────────────────┘
```

---

## 🔑 KEY FUNCTIONS

### messageService.js
- `canUsersMessage(userId1, userId2)` - Check if messaging allowed
- `sendMessage(sender, receiver, content, name)` - Send message
- `getConversation(currentUserId, otherUserId, opts)` - Fetch chat history
- `getConversationsList(currentUserId, opts)` - Fetch inbox

### messageController.js
- `sendMessage(req, res)` - POST /messages/:userId
- `getConversation(req, res)` - GET /messages/:userId
- `getConversationsList(req, res)` - GET /messages/conversations

---

## 🧪 QUICK TESTING

### Test 1: Send Message
```bash
curl -X POST http://localhost:3000/messages/{receiver-uuid} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!"}'
```

### Test 2: Get Conversation
```bash
curl -X GET http://localhost:3000/messages/{other-user-uuid} \
  -H "Authorization: Bearer {token}"
```

### Test 3: Get Inbox
```bash
curl -X GET http://localhost:3000/messages/conversations \
  -H "Authorization: Bearer {token}"
```

---

## 🚨 COMMON ERRORS

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Cannot send message to yourself | Self-message | Use different receiver UUID |
| 403 | No accepted interest | Interest not ACCEPTED | Accept interest first |
| 403 | Unable to send message | Blocked user | Unblock or choose different user |
| 404 | User not found | Invalid UUID or deleted | Verify user exists |
| 429 | Rate limit exceeded | Too many requests | Wait for rate limit reset |

---

## 📊 NOTIFICATIONS

Every sent message creates:
```json
{
  "type": "MESSAGE_RECEIVED",
  "title": "New Message",
  "message": "{Sender Name} sent you a message",
  "related_user_id": "{sender-uuid}",
  "related_id": {message-id}
}
```

---

## 🎯 FEATURES CHECKLIST

- [x] Send messages (POST /messages/:userId)
- [x] Get conversation (GET /messages/:userId)
- [x] Get inbox (GET /messages/conversations)
- [x] Interest validation (Option A: ANY acceptance)
- [x] Blocking integration (bidirectional)
- [x] Multi-layer rate limiting
- [x] Read receipts (auto-mark as read)
- [x] Soft delete support (per-user)
- [x] Notifications (MESSAGE_RECEIVED)
- [x] Audit logging
- [x] Cursor-based pagination (conversations)
- [x] Offset-based pagination (inbox)
- [x] Comprehensive error handling
- [x] Swagger documentation

---

## 🚀 PRODUCTION DEPLOYMENT

### Pre-Deployment
1. Run migration: `npx prisma migrate deploy`
2. Generate client: `npx prisma generate`
3. Verify environment variables
4. Test all endpoints

### Post-Deployment
1. Monitor rate limit hits
2. Check notification creation
3. Verify audit logs
4. Monitor query performance

---

## 📖 DOCUMENTATION

- **Full Summary:** `Backend/documentation/TASK_4.3_MESSAGE_SERVICE_SUMMARY.md`
- **Quick Reference:** This file
- **Swagger UI:** `http://localhost:3000/api-docs` (dev only)

---

## 🔗 RELATED TASKS

- **Task 4.1:** Send Interest (prerequisite)
- **Task 4.2:** Manage Interests (prerequisite)
- **Task 4.x:** User Blocking (integrated)
- **Task 4.4:** File Attachments (next)
- **Task 4.5:** Real-Time Messaging (future)

---

## 💡 QUICK TIPS

1. **Testing:** Use two users with ACCEPTED interest in either direction
2. **Pagination:** Use `cursor` from response for next page (conversations)
3. **Rate Limits:** Per-minute limits reset faster than per-hour
4. **Blocking:** Check if 403 error - might be blocked or no interest
5. **Unread Count:** Automatically calculated in inbox endpoint

---

**Task 4.3 Complete! 🎉**

Need help? Check full documentation or contact developer.
