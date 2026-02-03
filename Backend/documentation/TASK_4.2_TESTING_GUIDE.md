# Task 4.2: Testing Guide for Manage Interests

## 🧪 Complete Testing Scenarios

### Prerequisites
1. **Test Users:**
   - User A (Sender): Has sent interests
   - User B (Receiver): Has received interests
   - User C (Blocked): For blocking tests

2. **Test Data Setup:**
   - Create test interests in all statuses (PENDING, ACCEPTED, REJECTED, WITHDRAWN)
   - Set up blocking relationship between users
   - Ensure users have complete profiles with partner preferences

3. **Authentication:**
   - Obtain valid JWT tokens for test users
   - Use Authorization header: `Bearer <token>`

---

## 📋 Test Suite

### 1. GET /interests/sent

#### Test 1.1: Get All Sent Interests
```bash
GET {{baseUrl}}/interests/sent
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Response contains array of sent interests
- Pagination object present
- All statuses included
```

#### Test 1.2: Filter by PENDING
```bash
GET {{baseUrl}}/interests/sent?status=PENDING
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Only PENDING interests returned
- Other statuses excluded
```

#### Test 1.3: Filter by ACCEPTED
```bash
GET {{baseUrl}}/interests/sent?status=ACCEPTED
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Only ACCEPTED interests returned
```

#### Test 1.4: Pagination
```bash
GET {{baseUrl}}/interests/sent?page=2&limit=10
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Correct page returned
- Pagination metadata: page=2, limit=10
- has_prev=true, has_next=(depends on data)
```

#### Test 1.5: Sort Ascending
```bash
GET {{baseUrl}}/interests/sent?sort=sent_at_asc
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Results sorted by sent_at oldest first
```

#### Test 1.6: Sort Descending (Default)
```bash
GET {{baseUrl}}/interests/sent?sort=sent_at_desc
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Results sorted by sent_at newest first
```

#### Test 1.7: Blocked Users Excluded
```bash
# Pre-requisite: User A blocks User X
# User A has sent interest to User X

GET {{baseUrl}}/interests/sent
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- Interest to User X NOT in results
```

#### Test 1.8: Empty Results
```bash
# Use user with no sent interests
GET {{baseUrl}}/interests/sent
Authorization: Bearer {{newUser_token}}

Expected:
- Status: 200 OK
- data: []
- total_items: 0
```

#### Test 1.9: Response Format Validation
```javascript
// Verify each interest has:
{
  "interest_id": number,
  "profile_id": string,
  "full_name": string,
  "age": number,
  "primary_photo_url": string | null,
  "location": string | null,
  "education": string | null,
  "profession": string | null,
  "interest_status": "PENDING|ACCEPTED|REJECTED|WITHDRAWN",
  "sent_at": "ISO 8601 datetime"
}
```

---

### 2. GET /interests/received

#### Test 2.1: Default (PENDING Only)
```bash
GET {{baseUrl}}/interests/received
Authorization: Bearer {{userB_token}}

Expected:
- Status: 200 OK
- Only PENDING interests returned
- Each has match_score field (0-100)
```

#### Test 2.2: Filter by ACCEPTED
```bash
GET {{baseUrl}}/interests/received?status=ACCEPTED
Authorization: Bearer {{userB_token}}

Expected:
- Status: 200 OK
- Only ACCEPTED interests returned
- match_score present
```

#### Test 2.3: Filter by REJECTED
```bash
GET {{baseUrl}}/interests/received?status=REJECTED
Authorization: Bearer {{userB_token}}

Expected:
- Status: 200 OK
- Only REJECTED interests returned
```

#### Test 2.4: Match Score Validation
```javascript
// Verify match_score:
- Type: integer
- Range: 0-100
- Present for all results
- Calculated based on partner preferences
```

#### Test 2.5: Pagination
```bash
GET {{baseUrl}}/interests/received?page=1&limit=5
Authorization: Bearer {{userB_token}}

Expected:
- Status: 200 OK
- Limit enforced (max 5 results)
- Pagination metadata correct
```

#### Test 2.6: Blocked Users Excluded
```bash
# Pre-requisite: User B blocks User Y
# User Y has sent interest to User B

GET {{baseUrl}}/interests/received
Authorization: Bearer {{userB_token}}

Expected:
- Status: 200 OK
- Interest from User Y NOT in results
```

#### Test 2.7: Sort Order
```bash
GET {{baseUrl}}/interests/received?sort=received_at_asc
Authorization: Bearer {{userB_token}}

Expected:
- Status: 200 OK
- Results sorted oldest first
```

#### Test 2.8: Response Format Validation
```javascript
// Verify each interest has:
{
  "interest_id": number,
  "profile_id": string,
  "full_name": string,
  "age": number,
  "primary_photo_url": string | null,
  "location": string | null,
  "education": string | null,
  "profession": string | null,
  "interest_status": "PENDING|ACCEPTED|REJECTED",
  "received_at": "ISO 8601 datetime",
  "match_score": number (0-100)
}
```

---

### 3. PUT /interests/:interestId/accept

#### Test 3.1: Accept Valid PENDING Interest
```bash
PUT {{baseUrl}}/interests/456/accept
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 200 OK
- message: "Interest accepted successfully..."
- data.status: "ACCEPTED"
- data.responded_at: present
- data.is_mutual: boolean
- Notification created for sender
```

#### Test 3.2: Mutual Interest Detection
```bash
# Pre-requisite:
# User A sent interest to User B
# User B sent interest to User A
# User A accepts User B's interest

PUT {{baseUrl}}/interests/789/accept
Authorization: Bearer {{userA_token}}

Expected:
- Status: 200 OK
- data.is_mutual: true
- Both interests now ACCEPTED
```

#### Test 3.3: Accept Already Accepted
```bash
# Try to accept same interest twice
PUT {{baseUrl}}/interests/456/accept
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 409 Conflict
- message: "Interest already accepted"
```

#### Test 3.4: Accept Non-PENDING Interest
```bash
# Try to accept REJECTED interest
PUT {{baseUrl}}/interests/111/accept
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 409 Conflict
- message: "Can only accept pending interests"
```

#### Test 3.5: Unauthorized Accept (Wrong User)
```bash
# User C tries to accept interest meant for User B
PUT {{baseUrl}}/interests/456/accept
Authorization: Bearer {{userC_token}}

Expected:
- Status: 403 Forbidden
- message: "You are not authorized to accept this interest"
```

#### Test 3.6: Invalid Interest ID
```bash
PUT {{baseUrl}}/interests/abc/accept
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 400 Bad Request
- message: "Invalid interest ID"
```

#### Test 3.7: Non-Existent Interest
```bash
PUT {{baseUrl}}/interests/99999/accept
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 404 Not Found
- message: "Interest not found"
```

#### Test 3.8: Notification Verification
```bash
# After accepting, verify notification created
GET {{baseUrl}}/notifications
Authorization: Bearer {{sender_token}}

Expected:
- New notification present
- type: "INTEREST_ACCEPTED"
- related_user_id: receiver's ID
```

---

### 4. PUT /interests/:interestId/reject

#### Test 4.1: Reject Valid PENDING Interest
```bash
PUT {{baseUrl}}/interests/789/reject
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 200 OK
- message: "Interest rejected successfully"
- data.status: "REJECTED"
- data.responded_at: present
- No notification created
```

#### Test 4.2: Reject Already Rejected
```bash
# Try to reject same interest twice
PUT {{baseUrl}}/interests/789/reject
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 409 Conflict
- message: "Interest already rejected"
```

#### Test 4.3: Reject Non-PENDING Interest
```bash
# Try to reject ACCEPTED interest
PUT {{baseUrl}}/interests/123/reject
Authorization: Bearer {{receiver_token}}

Expected:
- Status: 409 Conflict
- message: "Can only reject pending interests"
```

#### Test 4.4: Unauthorized Reject (Wrong User)
```bash
# User C tries to reject interest meant for User B
PUT {{baseUrl}}/interests/789/reject
Authorization: Bearer {{userC_token}}

Expected:
- Status: 403 Forbidden
- message: "You are not authorized to reject this interest"
```

#### Test 4.5: No Notification Created
```bash
# After rejecting, verify NO notification
GET {{baseUrl}}/notifications
Authorization: Bearer {{sender_token}}

Expected:
- No "INTEREST_REJECTED" notification
- Silent rejection maintained
```

#### Test 4.6: Cooldown Period Check
```bash
# Sender tries to re-send after rejection
POST {{baseUrl}}/interests/{{rejectedReceiverId}}
Authorization: Bearer {{sender_token}}

Expected:
- Status: 409 Conflict
- message: "Cannot send interest yet. Please wait X more day(s)..."
```

---

### 5. DELETE /interests/:interestId

#### Test 5.1: Withdraw Valid PENDING Interest
```bash
DELETE {{baseUrl}}/interests/123
Authorization: Bearer {{sender_token}}

Expected:
- Status: 200 OK
- message: "Interest withdrawn successfully"
- data.status: "WITHDRAWN"
- Record still exists in database
```

#### Test 5.2: Withdraw Non-PENDING Interest
```bash
# Try to withdraw ACCEPTED interest
DELETE {{baseUrl}}/interests/456
Authorization: Bearer {{sender_token}}

Expected:
- Status: 409 Conflict
- message: "Can only withdraw pending interests"
```

#### Test 5.3: Unauthorized Withdraw (Wrong User)
```bash
# User B tries to withdraw interest sent by User A
DELETE {{baseUrl}}/interests/123
Authorization: Bearer {{userB_token}}

Expected:
- Status: 403 Forbidden
- message: "You are not authorized to withdraw this interest"
```

#### Test 5.4: Invalid Interest ID
```bash
DELETE {{baseUrl}}/interests/xyz
Authorization: Bearer {{sender_token}}

Expected:
- Status: 400 Bad Request
- message: "Invalid interest ID"
```

#### Test 5.5: Non-Existent Interest
```bash
DELETE {{baseUrl}}/interests/99999
Authorization: Bearer {{sender_token}}

Expected:
- Status: 404 Not Found
- message: "Interest not found"
```

#### Test 5.6: No Notification Created
```bash
# After withdrawing, verify NO notification
GET {{baseUrl}}/notifications
Authorization: Bearer {{receiver_token}}

Expected:
- No notification about withdrawal
- Silent withdrawal maintained
```

#### Test 5.7: Re-send After Withdrawal
```bash
# Sender can immediately re-send after withdrawal
POST {{baseUrl}}/interests/{{previousReceiverId}}
Authorization: Bearer {{sender_token}}

Expected:
- Status: 201 Created
- New interest created (or existing updated)
- No cooldown period
```

---

## 🔒 Security Tests

### Test S1: Missing Authentication
```bash
GET {{baseUrl}}/interests/sent
# No Authorization header

Expected:
- Status: 401 Unauthorized
```

### Test S2: Invalid Token
```bash
GET {{baseUrl}}/interests/sent
Authorization: Bearer invalid_token_here

Expected:
- Status: 401 Unauthorized
```

### Test S3: Expired Token
```bash
# Use expired JWT token
GET {{baseUrl}}/interests/sent
Authorization: Bearer {{expired_token}}

Expected:
- Status: 401 Unauthorized
- message: "Token expired..."
```

### Test S4: Cross-User Access Prevention
```bash
# User A tries to accept User B's interest
PUT {{baseUrl}}/interests/{{userB_interest_id}}/accept
Authorization: Bearer {{userA_token}}

Expected:
- Status: 403 Forbidden
```

---

## 📊 Performance Tests

### Test P1: Large Result Set
```bash
# User with 100+ sent interests
GET {{baseUrl}}/interests/sent?limit=50
Authorization: Bearer {{heavyUser_token}}

Expected:
- Response time < 2 seconds
- Pagination working correctly
- No timeout errors
```

### Test P2: Match Score Calculation Performance
```bash
# User with 50+ received interests
GET {{baseUrl}}/interests/received
Authorization: Bearer {{receiver_token}}

Expected:
- Match scores calculated for all
- Response time < 3 seconds
- No calculation errors
```

---

## 🔄 Integration Tests

### Test I1: Accept → Messaging Enabled
```bash
# 1. Accept interest
PUT {{baseUrl}}/interests/456/accept

# 2. Try sending message
POST {{baseUrl}}/messages/{{sender_id}}
Body: { "message": "Hello!" }

Expected:
- Message send successful
- No "Interest not accepted" error
```

### Test I2: Block → Interest Hidden
```bash
# 1. Block user
POST {{baseUrl}}/blocks/{{userId}}

# 2. Check sent interests
GET {{baseUrl}}/interests/sent

# 3. Check received interests
GET {{baseUrl}}/interests/received

Expected:
- Blocked user not in sent list
- Interests from blocked user not in received list
```

### Test I3: Reject → Cooldown → Re-send
```bash
# 1. Reject interest
PUT {{baseUrl}}/interests/789/reject

# 2. Try immediate re-send (sender)
POST {{baseUrl}}/interests/{{receiverId}}

# 3. Wait 30+ days, try re-send
POST {{baseUrl}}/interests/{{receiverId}}

Expected:
- Step 2: 409 Conflict with cooldown message
- Step 3: 201 Created (success)
```

---

## ✅ Test Checklist

### Functionality
- [ ] Get sent interests - all statuses
- [ ] Get sent interests - filtered
- [ ] Get received interests - default PENDING
- [ ] Get received interests - filtered
- [ ] Match score calculated correctly
- [ ] Accept pending interest
- [ ] Mutual interest detected
- [ ] Reject pending interest
- [ ] Withdraw pending interest
- [ ] Pagination works all endpoints
- [ ] Sorting works correctly
- [ ] Blocked users excluded

### Security
- [ ] Authentication required
- [ ] Authorization validated (sender/receiver)
- [ ] Invalid tokens rejected
- [ ] Cross-user access prevented
- [ ] Input validation (IDs)

### Notifications
- [ ] Accept creates notification
- [ ] Reject does NOT create notification
- [ ] Withdraw does NOT create notification
- [ ] Mutual accept creates for both

### Error Handling
- [ ] 400 for invalid input
- [ ] 401 for auth issues
- [ ] 403 for authorization failures
- [ ] 404 for not found
- [ ] 409 for conflicts
- [ ] Error messages clear

### Business Logic
- [ ] 30-day rejection cooldown
- [ ] Immediate re-send after withdrawal
- [ ] Status transitions valid
- [ ] Audit logs created
- [ ] Data integrity maintained

---

## 📝 Postman Collection

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "userA_token": "<jwt_token>",
  "userB_token": "<jwt_token>",
  "userC_token": "<jwt_token>"
}
```

### Sample Requests

**Get Sent Interests:**
```
GET {{baseUrl}}/interests/sent?status=PENDING&page=1&limit=20
Authorization: Bearer {{userA_token}}
```

**Get Received Interests:**
```
GET {{baseUrl}}/interests/received
Authorization: Bearer {{userB_token}}
```

**Accept Interest:**
```
PUT {{baseUrl}}/interests/456/accept
Authorization: Bearer {{userB_token}}
```

**Reject Interest:**
```
PUT {{baseUrl}}/interests/789/reject
Authorization: Bearer {{userB_token}}
```

**Withdraw Interest:**
```
DELETE {{baseUrl}}/interests/123
Authorization: Bearer {{userA_token}}
```

---

## 🎯 Test Results Template

```markdown
## Test Results - Task 4.2

**Date:** YYYY-MM-DD
**Tester:** Name
**Environment:** Development/Staging

### Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

### Failed Tests
| Test ID | Test Case | Error | Status |
|---------|-----------|-------|--------|
| T2.3 | Filter by REJECTED | 500 error | Investigating |

### Notes
- Performance acceptable (<2s response)
- All security tests passed
- Match score calculation accurate
```

---

## 🚀 Ready to Test!

Use this guide to systematically test all Task 4.2 endpoints. Report any issues found.
