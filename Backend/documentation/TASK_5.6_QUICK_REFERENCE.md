# Task 5.6: Audit Logging - Quick Reference

**Phase 5 - Task 5.6** | Audit Logging System  
**Developer 3** | Status: ✅ COMPLETE

---

## 🚀 Quick Start

### 1. Import Required Modules
```javascript
import AuditService from '../services/auditService.js';
import { 
  AuditAction, 
  AuditActionType, 
  AuditResourceType, 
  AuditStatus 
} from '../types/enums.js';
import { getAuditContext } from '../middleware/auditContext.js';
```

### 2. Capture Audit Context (Already Global)
```javascript
// In any controller, audit context is automatically available
const { ipAddress, userAgent } = getAuditContext(req);
```

### 3. Log Actions
```javascript
// Async (non-critical) - Fire and forget
await AuditService.log({
  action: AuditAction.LOGIN_SUCCESS,
  actionType: AuditActionType.AUTH_EVENT,
  actorId: userId,
  ipAddress,
  userAgent
});

// Transactional (critical) - Part of DB transaction
await prisma.$transaction(async (tx) => {
  // Your critical operation
  await tx.user.update({ ... });
  
  // Critical audit log
  await AuditService.log({
    action: AuditAction.PASSWORD_CHANGED,
    actionType: AuditActionType.AUTH_EVENT,
    actorId: userId,
    ipAddress,
    userAgent,
    tx  // Pass transaction
  });
});
```

---

## 📋 Audit Service API

### Method: `AuditService.log(params)`

**Parameters:**
```typescript
{
  action: string,              // REQUIRED: Use AuditAction enum
  actionType: string,          // REQUIRED: Use AuditActionType enum
  actorId?: string,            // User who performed (null for system)
  targetUserId?: string,       // User affected by action
  resourceType?: string,       // Use AuditResourceType enum
  resourceId?: string,         // ID of resource
  metadata?: object,           // Additional data (PII auto-masked)
  ipAddress?: string,          // From getAuditContext(req)
  userAgent?: string,          // From getAuditContext(req)
  status?: string,             // SUCCESS (default), FAILURE, PARTIAL
  tx?: PrismaTransaction       // For transactional logging
}
```

**Returns:** 
- Async: `null` (fire-and-forget)
- Transactional: `AuditLog` object

---

## 🎯 Action Types

| Type | When to Use | Example Actions |
|------|-------------|-----------------|
| `ADMIN_ACTION` | Admin operations | ADMIN_USER_DELETED, ADMIN_PHOTO_APPROVED |
| `USER_ACTION` | User operations | PROFILE_PHOTO_UPLOADED, USER_BLOCKED |
| `AUTH_EVENT` | Authentication | LOGIN_SUCCESS, PASSWORD_CHANGED |
| `SYSTEM_ACTION` | Automated tasks | SYSTEM_AUTO_CLEANUP, SYSTEM_SUBSCRIPTION_EXPIRED |

---

## 🔑 Critical vs Non-Critical Actions

### Transactional (Critical) ⚡
**These MUST be logged within transactions:**
- Password changes
- Account deletion
- Admin moderation actions
- Subscription purchases
- Report actions

```javascript
await prisma.$transaction(async (tx) => {
  // Critical operation
  await tx.user.update({ ... });
  
  // MUST pass 'tx' parameter
  await AuditService.log({
    action: AuditAction.PASSWORD_CHANGED,
    actionType: AuditActionType.AUTH_EVENT,
    actorId: userId,
    tx  // ← Required for transactional
  });
});
```

### Asynchronous (Non-Critical) 🌊
**These can be fire-and-forget:**
- Login attempts
- Profile updates
- Photo uploads
- OTP requests
- Search activities

```javascript
// No 'tx' parameter - automatically async
await AuditService.log({
  action: AuditAction.LOGIN_SUCCESS,
  actionType: AuditActionType.AUTH_EVENT,
  actorId: userId,
  ipAddress,
  userAgent
  // No 'tx' = async
});
```

---

## 📝 Common Patterns

### Pattern 1: Authentication Events
```javascript
// Login Success
const { ipAddress, userAgent } = getAuditContext(req);
await AuditService.log({
  action: AuditAction.LOGIN_SUCCESS,
  actionType: AuditActionType.AUTH_EVENT,
  actorId: user.id,
  resourceType: AuditResourceType.SESSION,
  metadata: {
    login_method: 'password',
    role: user.role.role_name
  },
  ipAddress,
  userAgent,
  status: AuditStatus.SUCCESS
});

// Login Failure
await AuditService.log({
  action: AuditAction.LOGIN_FAILURE,
  actionType: AuditActionType.AUTH_EVENT,
  metadata: {
    mobile_number: mobile_number, // Will be masked
    reason: 'Invalid password',
    attempts: 3
  },
  ipAddress,
  userAgent,
  status: AuditStatus.FAILURE
});
```

### Pattern 2: Profile Updates
```javascript
// Personal Details Update
const { ipAddress, userAgent } = getAuditContext(req);
await AuditService.log({
  action: AuditAction.PERSONAL_DETAILS_UPDATED,
  actionType: AuditActionType.USER_ACTION,
  actorId: req.user.userId,
  resourceType: AuditResourceType.PROFILE,
  resourceId: req.user.userId,
  metadata: {
    fields_updated: ['height_cm', 'weight_kg', 'marital_status'],
    updated_by: 'self'
  },
  ipAddress,
  userAgent
});
```

### Pattern 3: Admin Actions (with Target User)
```javascript
// Admin User Deletion
const { ipAddress, userAgent } = getAuditContext(req);
await AuditService.log({
  action: AuditAction.ADMIN_USER_DELETED,
  actionType: AuditActionType.ADMIN_ACTION,
  actorId: req.user.userId,          // Admin (actor)
  targetUserId: userIdToDelete,       // User being deleted (target)
  resourceType: AuditResourceType.USER,
  resourceId: userIdToDelete,
  metadata: {
    reason: req.body.reason,
    admin_role: req.user.role,
    deletion_type: 'soft_delete'
  },
  ipAddress,
  userAgent,
  tx  // If within transaction
});
```

### Pattern 4: System Actions (No Actor)
```javascript
// Auto Subscription Expiry
await AuditService.log({
  action: AuditAction.SYSTEM_SUBSCRIPTION_EXPIRED,
  actionType: AuditActionType.SYSTEM_ACTION,
  actorId: null,  // No actor for system actions
  targetUserId: userId,
  resourceType: AuditResourceType.SUBSCRIPTION,
  resourceId: subscriptionId,
  metadata: {
    plan_name: 'PREMIUM_MONTHLY',
    expiry_date: new Date(),
    auto_renew: false
  },
  status: AuditStatus.SUCCESS
});
```

### Pattern 5: Privacy & Safety Actions
```javascript
// User Blocked
const { ipAddress, userAgent } = getAuditContext(req);
await AuditService.log({
  action: AuditAction.USER_BLOCKED,
  actionType: AuditActionType.USER_ACTION,
  actorId: req.user.userId,          // User blocking
  targetUserId: blockedUserId,       // User being blocked
  resourceType: AuditResourceType.BLOCK,
  resourceId: blockId.toString(),
  metadata: {
    reason: req.body.reason || 'Not specified',
    block_type: 'manual'
  },
  ipAddress,
  userAgent
});
```

---

## 🛡️ PII Masking (Automatic)

**These fields are ALWAYS masked:**
```javascript
password, password_hash, new_password, old_password
otp_code, otp, token, refresh_token, access_token
mobile_number, email, aadhaar, pan, ssn
credit_card, debit_card, bank_account
```

**Example:**
```javascript
// Input metadata
metadata: {
  password: 'secret123',
  otp_code: '123456',
  reason: 'User requested'
}

// Stored metadata (auto-masked)
metadata: {
  password: '***MASKED***',
  otp_code: '***MASKED***',
  reason: 'User requested'  // Not sensitive, not masked
}
```

---

## 📊 Available Enums

### AuditAction (90+ actions)
```javascript
// Authentication
AuditAction.LOGIN_SUCCESS
AuditAction.LOGIN_FAILURE
AuditAction.LOGOUT
AuditAction.PASSWORD_CHANGED
AuditAction.PASSWORD_RESET_SUCCESS
AuditAction.OTP_REQUESTED
AuditAction.OTP_VERIFIED_SUCCESS

// Profile Updates
AuditAction.PERSONAL_DETAILS_UPDATED
AuditAction.PROFILE_PHOTO_UPLOADED
AuditAction.CONTACT_INFO_UPDATED

// Admin Actions
AuditAction.ADMIN_USER_DELETED
AuditAction.ADMIN_USER_SUSPENDED
AuditAction.ADMIN_PHOTO_APPROVED
AuditAction.ADMIN_REPORT_ACTION_TAKEN

// Privacy & Safety
AuditAction.USER_BLOCKED
AuditAction.USER_REPORTED

// Subscriptions
AuditAction.SUBSCRIPTION_PURCHASED
AuditAction.SUBSCRIPTION_CANCELLED

// System
AuditAction.SYSTEM_AUTO_CLEANUP
AuditAction.SYSTEM_SUBSCRIPTION_EXPIRED
```

### AuditResourceType
```javascript
AuditResourceType.USER
AuditResourceType.PHOTO
AuditResourceType.REPORT
AuditResourceType.SUBSCRIPTION
AuditResourceType.INTEREST
AuditResourceType.MESSAGE
AuditResourceType.PROFILE
AuditResourceType.SHORTLIST
AuditResourceType.BLOCK
AuditResourceType.MATCH
AuditResourceType.PLAN
AuditResourceType.SESSION
AuditResourceType.SYSTEM
```

### AuditStatus
```javascript
AuditStatus.SUCCESS   // Default
AuditStatus.FAILURE
AuditStatus.PARTIAL
```

---

## 🔍 Admin Endpoints

### 1. Get Audit Logs
```bash
GET /admin/audit-logs

# Query Parameters
?action_type=ADMIN_ACTION
&action=ADMIN_USER_DELETED
&actor_id=<uuid>
&target_user_id=<uuid>
&resource_type=USER
&status=SUCCESS
&date_from=2026-01-01T00:00:00Z
&date_to=2026-02-01T00:00:00Z
&ip_address=192.168.1.1
&search=deleted
&page=1
&limit=50
&sort_by=created_at
&sort_order=desc
```

### 2. Get Statistics
```bash
GET /admin/audit-logs/statistics?date_from=2026-01-01T00:00:00Z
```

### 3. Export to CSV
```bash
GET /admin/audit-logs/export?action_type=ADMIN_ACTION
```

### 4. Get Single Log
```bash
GET /admin/audit-logs/:id
```

### 5. Cleanup Old Logs
```bash
DELETE /admin/audit-logs/cleanup
Content-Type: application/json

{
  "retention_months": 24
}
```

---

## ⚡ Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| GET /audit-logs | 200 requests | 1 hour |
| GET /audit-logs/export | 10 requests | 1 hour |
| DELETE /audit-logs/cleanup | 5 requests | 24 hours |

---

## 🎯 Integration Checklist

When adding audit logging to a controller:

- [ ] Import `AuditService`
- [ ] Import action enums (`AuditAction`, `AuditActionType`, etc.)
- [ ] Import `getAuditContext`
- [ ] Capture `ipAddress` and `userAgent` from request
- [ ] Choose appropriate `AuditAction` from enum
- [ ] Determine if critical (transactional) or non-critical (async)
- [ ] Include `actorId` (who performed action)
- [ ] Include `targetUserId` if action affects another user
- [ ] Include `resourceType` and `resourceId` if applicable
- [ ] Add meaningful `metadata` (will be PII-masked automatically)
- [ ] Set `status` based on operation result
- [ ] Pass `tx` if transactional logging
- [ ] Test PII masking
- [ ] Handle audit logging errors appropriately

---

## 🧪 Testing Checklist

- [ ] Verify audit log created in database
- [ ] Check `actor` and `target_user` populated correctly
- [ ] Verify `metadata` contains expected data
- [ ] Confirm PII is masked (passwords, OTPs, tokens)
- [ ] Test IP address captured correctly
- [ ] Test user agent captured correctly
- [ ] Verify transactional rollback on critical actions
- [ ] Confirm async actions don't block operations
- [ ] Test filtering by various criteria
- [ ] Test CSV export functionality
- [ ] Check rate limiting works

---

## 🐛 Troubleshooting

### Audit log not created
- Check if action is critical but `tx` not passed
- Verify actor_id is valid UUID
- Check database connection
- Review async logging errors in logs

### PII not masked
- Verify field name contains PII keyword
- Check nested object masking
- Update `PII_FIELDS` in auditService.js if needed

### Transaction rollback unexpected
- Verify action is truly critical
- Check if audit logging should be async instead
- Review error logs for audit failure details

### Rate limit hit
- Increase rate limit if legitimate usage
- Check for infinite loops or excessive logging
- Review admin usage patterns

---

## 📚 Full Documentation

See [TASK_5.6_AUDIT_LOGGING_SUMMARY.md](./TASK_5.6_AUDIT_LOGGING_SUMMARY.md) for:
- Complete action list (90+ actions)
- Detailed integration examples
- Database schema details
- Performance optimization
- Monitoring and alerts
- Cron job setup

---

**Task 5.6: Audit Logging** ✅ COMPLETE

---

*Quick Reference | Generated by GitHub Copilot | Feb 6, 2026*
