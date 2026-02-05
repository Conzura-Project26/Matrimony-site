# Task 5.4: Report Management - Quick Reference

⚡ **Fast lookup guide for Report Management API**

---

## 📍 Endpoints

```
GET    /admin/reports              - List all reports (filters, pagination)
GET    /admin/reports/statistics   - Report statistics dashboard
GET    /admin/reports/:id          - Get report details with history
PUT    /admin/reports/:id/status   - Update report status (workflow)
PUT    /admin/reports/:id/action   - Take action on reported user (ADMIN only)
```

---

## 🔑 Access Control

| Endpoint | ADMIN | MODERATOR |
|----------|-------|-----------|
| List reports | ✅ | ✅ |
| Statistics | ✅ | ✅ |
| Get details | ✅ | ✅ |
| Update status | ✅ | ✅ (limited) |
| Take action | ✅ | ❌ |

---

## 📊 Report Statuses

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `OPEN` | New report | System (default) |
| `IN_REVIEW` | Under investigation | Moderator, Admin |
| `ACTION_TAKEN` | Action executed | System (auto) |
| `RESOLVED` | Case closed | Admin |
| `DISMISSED` | False report | Moderator, Admin |
| `ESCALATED` | Needs senior review | Moderator, Admin |

---

## 🎯 Moderation Actions

| Action | Effect | Metadata |
|--------|--------|----------|
| `NO_ACTION` | Close without punishment | - |
| `WARN_USER` | Send warning notification | - |
| `SUSPEND_USER` | Temporary ban + logout | `suspension_days` (1-365) |
| `DEACTIVATE_USER` | Indefinite ban + logout + cancel interests | - |
| `DELETE_CONTENT` | Remove photos/bio | `content_type`, `content_ids` |
| `RESTRICT_FEATURES` | Disable features | `restricted_features`, `restriction_days` |
| `FLAG_USER` | Mark for monitoring | `notes` |

---

## 🔄 Workflow Example

```
1. User reports another user
   → Status: OPEN

2. Moderator reviews
   PUT /admin/reports/1/status { "status": "IN_REVIEW" }

3. Moderator escalates (serious case)
   PUT /admin/reports/1/status { "status": "ESCALATED" }

4. Admin takes action
   PUT /admin/reports/1/action {
     "action": "SUSPEND_USER",
     "metadata": { "suspension_days": 7 }
   }
   → Status: ACTION_TAKEN (automatic)

5. Admin closes case
   PUT /admin/reports/1/status { "status": "RESOLVED" }
```

---

## 🔍 Common Queries

### Get all open high-priority reports
```
GET /admin/reports?status=OPEN&severity=HIGH&sort_by=severity&sort_order=desc
```

### Get escalated reports
```
GET /admin/reports?escalated=true
```

### Get reports against specific user
```
GET /admin/reports?reported_user=<uuid>
```

### Get reports with actions taken
```
GET /admin/reports?has_action=true
```

### Search reports
```
GET /admin/reports?q=harassment
```

---

## 💡 Decision Matrix

| Severity | First Offense | Repeat | Critical Mass (5+) |
|----------|--------------|--------|-------------------|
| LOW | NO_ACTION | WARN_USER | SUSPEND_USER (7d) |
| MEDIUM | WARN_USER | SUSPEND_USER (7d) | SUSPEND_USER (30d) |
| HIGH | SUSPEND_USER (7d) | SUSPEND_USER (30d) | DEACTIVATE_USER |
| CRITICAL | SUSPEND_USER (30d) | DEACTIVATE_USER | DEACTIVATE_USER |

---

## 🚦 Rate Limits

| Operation | Limit |
|-----------|-------|
| Read (GET) | 2000/hour |
| Status Update | 500/hour |
| User Action | 100/hour |

---

## ⚠️ Important Rules

1. **Never hard delete users** - Always use DEACTIVATE_USER
2. **Cannot action resolved reports** - Must reopen first
3. **Moderators limited** - Can only IN_REVIEW and ESCALATE
4. **All actions logged** - Permanent audit trail
5. **Status auto-updates** - ACTION_TAKEN set automatically when action taken

---

## 📝 Request Examples

### Warn User
```json
{
  "action": "WARN_USER",
  "admin_notes": "First offense - official warning"
}
```

### Suspend User
```json
{
  "action": "SUSPEND_USER",
  "metadata": {
    "suspension_days": 7,
    "notes": "Multiple harassment reports"
  },
  "admin_notes": "7-day suspension for harassment"
}
```

### Delete Photos
```json
{
  "action": "DELETE_CONTENT",
  "metadata": {
    "content_type": "photo",
    "content_ids": [123, 456]
  },
  "admin_notes": "Removed 2 inappropriate photos"
}
```

### Deactivate Account
```json
{
  "action": "DEACTIVATE_USER",
  "admin_notes": "Fake profile - fraud attempt"
}
```

---

**Quick Ref Version:** 1.0  
**Last Updated:** February 4, 2026
