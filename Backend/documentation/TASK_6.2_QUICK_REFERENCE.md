# Task 6.2: Feature Gating - Quick Reference

## 🚀 Quick Start

### 1. Seed the Database
```bash
cd Backend
node scripts/seedFeatureGating.js
```

### 2. Start Server in Logging Mode (Phase 0)
```bash
npm run dev
```
All features work normally, usage is logged only.

### 3. Activate Phase 1 (When Ready)
Edit `src/middleware/featureGating.js` line 30:
```javascript
const activeFeatureFlags = new Set([
  // FeatureFlag.LOGGING_ONLY,  // Comment out
  FeatureFlag.GATE_CONTACT_VIEWS,
  FeatureFlag.GATE_PROTECTED_PHOTOS,
  FeatureFlag.GATE_ADVANCED_FILTERS
]);
```

---

## 📋 Feature Limits Cheat Sheet

| Feature | FREE | BASIC | PREMIUM | GOLD |
|---------|------|-------|---------|------|
| Profile Views/Day | 50 | 200 | ∞ | ∞ |
| Contact Views/Month | 5 | 30 | 75 | ∞ |
| Interests/Day | 5 | 15 | 50 | ∞ |
| Messages/Day | 10 | ∞ | ∞ | ∞ |
| Daily Matches | 10 | 20 | 50 | ∞ |
| Protected Photos | ❌ | ❌ | ✅ | ✅ |
| Advanced Filters | ❌ | ❌ | ✅ | ✅ |
| Unlimited Chat | ❌ | ✅ | ✅ | ✅ |

---

## 🔧 How to Apply Feature Gating

### Pattern 1: Numeric Limit (with usage increment)
```javascript
router.get(
  '/contacts/:userId',
  authenticateToken,
  checkFeatureAccess(FeatureCode.CONTACT_VIEW_LIMIT_MONTHLY, {
    increment: 1,              // Increment usage after check passes
    softGate: false,           // Hard-block when limit reached
    flagKey: FeatureFlag.GATE_CONTACT_VIEWS
  }),
  contactController.viewContact
);
```

### Pattern 2: Boolean Feature (no usage tracking)
```javascript
router.post(
  '/search/advanced',
  authenticateToken,
  checkFeatureAccess(FeatureCode.ADVANCED_FILTERS, {
    increment: 0,              // No usage tracking
    softGate: false,           // Hard-block if not available
    flagKey: FeatureFlag.GATE_ADVANCED_FILTERS
  }),
  searchController.advancedSearch
);
```

### Pattern 3: Soft-Gate (warn but allow)
```javascript
router.post(
  '/profiles/:id/view',
  authenticateToken,
  checkFeatureAccess(FeatureCode.PROFILE_VIEW_LIMIT_DAILY, {
    increment: 1,
    softGate: true,            // Warn but allow action
    flagKey: FeatureFlag.GATE_PROFILE_VIEWS
  }),
  viewController.recordView
);
```

### Pattern 4: Manual Check in Controller
```javascript
import { checkUserFeatureAccess } from '../utils/subscriptionHelper.js';

async getUserPhotos(req, res) {
  const access = await checkUserFeatureAccess(
    req.user.id, 
    FeatureCode.PROTECTED_PHOTO_ACCESS
  );
  
  if (access.hasAccess && access.value === true) {
    // Show protected photos
  } else {
    // Filter out protected photos
  }
}
```

---

## 📦 Feature Codes Reference

### Daily Reset Features
```javascript
FeatureCode.PROFILE_VIEW_LIMIT_DAILY
FeatureCode.INTEREST_LIMIT_DAILY
FeatureCode.MESSAGE_LIMIT_DAILY
FeatureCode.DAILY_MATCH_LIMIT
```

### Monthly Reset Features
```javascript
FeatureCode.CONTACT_VIEW_LIMIT_MONTHLY
```

### Boolean Features
```javascript
FeatureCode.PROTECTED_PHOTO_ACCESS
FeatureCode.ADVANCED_FILTERS
FeatureCode.UNLIMITED_CHAT
FeatureCode.READ_RECEIPTS
FeatureCode.VIP_BADGE
FeatureCode.PROFILE_BOOST
FeatureCode.PRIORITY_MATCHING
FeatureCode.DEDICATED_MANAGER
```

### String Features
```javascript
FeatureCode.PRIORITY_SUPPORT  // "standard" | "priority" | "dedicated"
```

---

## 🚦 Feature Flags

```javascript
// Phase 0 - Logging only (DEFAULT)
FeatureFlag.LOGGING_ONLY

// Phase 1 - Hard-gated revenue features
FeatureFlag.GATE_CONTACT_VIEWS
FeatureFlag.GATE_PROTECTED_PHOTOS
FeatureFlag.GATE_ADVANCED_FILTERS

// Phase 2 - Soft-gated engagement features
FeatureFlag.GATE_INTERESTS
FeatureFlag.GATE_MESSAGING
FeatureFlag.GATE_PROFILE_VIEWS

// Phase 3
FeatureFlag.GATE_DAILY_MATCHES
```

---

## 🎯 Middleware Options

```javascript
checkFeatureAccess(featureCode, {
  increment: 0 | 1,          // 0 = check only, 1 = increment usage
  softGate: true | false,    // true = warn, false = block
  flagKey: FeatureFlag.XXX   // Feature flag to check
})
```

**When to use each option:**
- `increment: 1` - Use when action consumes the resource (contact view, interest send)
- `increment: 0` - Use for boolean features or read-only checks
- `softGate: true` - Use for engagement features (warn near limit)
- `softGate: false` - Use for monetization features (hard block)

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Action completed",
  "data": { ... },
  "feature_usage": {
    "feature": "CONTACT_VIEW_LIMIT_MONTHLY",
    "limit": 20,
    "used": 5,
    "remaining": 15,
    "reset_period": "MONTHLY",
    "window_end": "2026-03-01T00:00:00Z"
  },
  "warning": {
    "type": "LIMIT_NEAR",
    "remaining": 2
  }
}
```

### Error Response (Limit Reached)
```json
{
  "success": false,
  "error_code": "FEATURE_LIMIT_REACHED",
  "message": "You've reached your contact view limit",
  "feature": "CONTACT_VIEW_LIMIT_MONTHLY",
  "limit": { "monthly": 20 },
  "used": { "monthly": 20 },
  "reset_period": "MONTHLY",
  "window_end": "2026-03-01T00:00:00Z",
  "current_plan": "BASIC",
  "upgrade_required": true,
  "recommended_plan": "PREMIUM"
}
```

### Error Response (Feature Not Available)
```json
{
  "success": false,
  "error_code": "FEATURE_NOT_AVAILABLE",
  "message": "Advanced filters require PREMIUM plan",
  "feature": "ADVANCED_FILTERS",
  "current_plan": "BASIC",
  "upgrade_required": true,
  "recommended_plan": "PREMIUM"
}
```

---

## 🔍 Useful Queries

### Check User's Current Plan
```sql
SELECT 
  u.full_name,
  sp.code AS plan,
  sp.display_name,
  s.status,
  s.end_date
FROM users u
JOIN subscriptions s ON u.id = s.user_id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE u.id = 'USER_UUID' AND s.status = 'ACTIVE';
```

### Check Feature Usage
```sql
SELECT 
  f.code AS feature,
  fu.used_count AS used,
  pf.value_number AS limit,
  fu.window_start,
  fu.window_end
FROM feature_usage fu
JOIN features f ON fu.feature_id = f.id
JOIN subscriptions s ON fu.user_id = s.user_id
JOIN plan_features pf ON s.plan_id = pf.plan_id AND f.id = pf.feature_id
WHERE fu.user_id = 'USER_UUID'
  AND fu.window_end > NOW()
ORDER BY fu.window_start DESC;
```

### Find Users at Limit
```sql
SELECT 
  u.full_name,
  u.email,
  f.code AS feature,
  fu.used_count AS used,
  pf.value_number AS limit,
  sp.code AS current_plan
FROM feature_usage fu
JOIN features f ON fu.feature_id = f.id
JOIN users u ON fu.user_id = u.id
JOIN subscriptions s ON u.id = s.user_id AND s.status = 'ACTIVE'
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN plan_features pf ON sp.id = pf.plan_id AND f.id = pf.feature_id
WHERE fu.used_count >= pf.value_number
  AND pf.value_number > 0
  AND fu.window_end > NOW()
ORDER BY u.full_name;
```

---

## 🧪 Testing Commands

### Test Contact View (should work in logging mode)
```bash
curl -X GET http://localhost:5000/api/contacts/USER_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Advanced Search (should work in logging mode)
```bash
curl -X POST http://localhost:5000/api/search/advanced \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "engineer"}'
```

### Check Logs
```bash
# Watch feature gating logs
tail -f logs/combined.log | grep -E "Feature|LOGGING MODE"

# Count blocks today
grep "Feature blocked" logs/combined.log | grep $(date +%Y-%m-%d) | wc -l
```

---

## ⚠️ Important Notes

1. **Admin Bypass**: Users with role ADMIN or SUPER_ADMIN bypass ALL feature limits
2. **FREE Plan Auto-Assignment**: All users get FREE plan by default on signup
3. **Expired Subscriptions**: Auto-downgrade to FREE plan when paid subscription expires
4. **Feature Flags**: Require server restart to take effect (in-memory storage)
5. **Logging Mode**: All features work normally, blocks are only logged
6. **Timezone**: All reset windows use UTC (no user timezone support yet)

---

## 🚨 Troubleshooting

### Issue: User blocked but shouldn't be
1. Check their subscription status
2. Verify feature usage in database
3. Check if feature flag is enabled
4. Verify plan has the feature

### Issue: Feature flag not working
1. Restart server after changing flags
2. Check flag is in activeFeatureFlags Set
3. Verify middleware is applied to route

### Issue: Usage not incrementing
1. Check `increment: 1` in middleware options
2. Verify feature ID exists in database
3. Check for errors in logs

### Issue: FREE plan not assigned
1. Run seed script: `node scripts/seedFeatureGating.js`
2. Check FREE plan exists in database
3. Verify user has no active subscription

---

## 📚 Related Files

- **Middleware:** `src/middleware/featureGating.js`
- **Utilities:** `src/utils/subscriptionHelper.js`
- **Enums:** `src/types/enums.js`
- **Seed Script:** `scripts/seedFeatureGating.js`
- **Feature Data:** `prisma/seeds/featureData.js`
- **Plan Mappings:** `prisma/seeds/planFeatureData.js`
- **Documentation:** `documentation/TASK_6.2_FEATURE_GATING_SUMMARY.md`

---

## 🎓 Best Practices

1. ✅ Always use feature flags for new gates
2. ✅ Start with logging mode, then activate
3. ✅ Use soft-gate for engagement features first
4. ✅ Monitor metrics after activation
5. ✅ Provide clear upgrade messages
6. ✅ Test with different plan users
7. ✅ Have rollback plan ready

---

**For detailed implementation guide, see:** `documentation/TASK_6.2_FEATURE_GATING_SUMMARY.md`
