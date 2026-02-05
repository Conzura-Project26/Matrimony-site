# Task 6.1: Plan Management - Quick Reference

## 🚀 Quick Start

### 1. Setup Database
```bash
# Run Prisma migration
npx prisma migrate dev --name add_subscription_plans
npx prisma generate

# Seed default plans
node prisma/seeds/subscriptionPlans.js

# Migrate existing subscriptions (if needed)
node scripts/migrateSubscriptions.js
```

### 2. Test APIs
```bash
# Start server
npm run dev

# Access Swagger docs
http://localhost:3000/api-docs
```

---

## 📍 API Endpoints Cheat Sheet

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get all active plans |
| GET | `/plans/:planId` | Get plan by ID |
| GET | `/plans/code/:code` | Get plan by code |

### Admin (ADMIN Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/plans` | Create new plan |
| PUT | `/admin/plans/:id` | Update plan |
| DELETE | `/admin/plans/:id` | Deactivate plan |
| PATCH | `/admin/plans/:id/reactivate` | Reactivate plan |
| POST | `/admin/plans/:id/version` | Create version |
| GET | `/admin/features` | List features (MODERATOR too) |
| POST | `/admin/features` | Create feature |

---

## 💰 Default Plans

| Plan | Price | Priority | Features |
|------|-------|----------|----------|
| FREE | ₹0 | 0 | 5 matches/day, 3 interests/day |
| BASIC | ₹999 | 1 | Unlimited matches, profile boost |
| PREMIUM | ₹2499 | 2 | + Advanced filters, read receipts |
| GOLD | ₹4999 | 3 | + VIP badge, dedicated manager |

---

## 🔑 Feature Codes

| Code | Type | Reset | Description |
|------|------|-------|-------------|
| `MATCH_LIMIT` | NUMBER | DAILY | Daily match views |
| `INTEREST_LIMIT` | NUMBER | DAILY | Daily interests |
| `MESSAGE_LIMIT` | NUMBER | DAILY | Daily messages |
| `CONTACT_VIEW_LIMIT` | NUMBER | MONTHLY | Contact views |
| `PRIORITY_SUPPORT` | STRING | NONE | Support level |
| `PROFILE_BOOST` | BOOLEAN | NONE | Visibility boost |
| `ADVANCED_FILTERS` | BOOLEAN | NONE | Search filters |
| `READ_RECEIPTS` | BOOLEAN | NONE | Message receipts |
| `VIP_BADGE` | BOOLEAN | NONE | VIP badge |
| `DEDICATED_MANAGER` | BOOLEAN | NONE | Manager support |
| `PRIORITY_MATCHING` | BOOLEAN | NONE | Priority algo |

---

## 📝 Quick Examples

### Create Plan (ADMIN)
```bash
curl -X POST http://localhost:3000/admin/plans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PLATINUM",
    "display_name": "Platinum",
    "price_amount": 799900,
    "billing_cycle": "MONTHLY",
    "duration_days": 30,
    "priority": 4,
    "trial_period_days": 14,
    "features": [
      {
        "feature_code": "MATCH_LIMIT",
        "value_number": -1,
        "value_string": "unlimited"
      }
    ]
  }'
```

### Get All Plans (Public)
```bash
curl http://localhost:3000/plans
```

### Get Plan by Code
```bash
curl http://localhost:3000/plans/code/GOLD
```

### Check Feature Access (Service)
```javascript
import featureService from './src/services/featureService.js';

const access = await featureService.checkFeatureAccess(userId, 'MATCH_LIMIT');

if (access.has_access) {
  // Allow action
  await featureService.incrementFeatureUsage(userId, 'MATCH_LIMIT');
} else {
  throw new Error(access.message); // "5 per day limit reached"
}
```

---

## ⚡ Common Tasks

### Deactivate Plan
```bash
curl -X DELETE http://localhost:3000/admin/plans/{planId} \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Change Plan Price
```bash
# Don't update price directly - create new version!
curl -X POST http://localhost:3000/admin/plans/{planId}/version \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"price_amount": 599900}'
```

### Reactivate Plan
```bash
curl -X PATCH http://localhost:3000/admin/plans/{planId}/reactivate \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## ✅ Validation Rules

### Plan Creation
- ✅ Code: UPPERCASE, alphanumeric + underscore
- ✅ Price: ₹0 to ₹1,00,000 (in paise)
- ✅ FREE plans (priority 0) → price = 0
- ✅ PAID plans (priority > 0) → price > 0
- ✅ Trial only for paid plans

### Plan Updates
- ❌ Cannot change: code, price (use versioning)
- ✅ Can change: display_name, description, features

---

## 🛠️ Troubleshooting

### Issue: Plan not showing in public API
**Solution:** Check if `is_active = true` and `version = 1`

### Issue: Can't deactivate plan
**Solution:** Check if it's the last active plan (prevented)

### Issue: Price change rejected
**Solution:** Use versioning API, not update API

### Issue: Feature not found
**Solution:** Run seed script: `node prisma/seeds/subscriptionPlans.js`

---

## 📊 Database Queries

### Get all active plans
```sql
SELECT * FROM subscription_plans 
WHERE is_active = true AND version = 1 
ORDER BY priority ASC;
```

### Get plan with features
```sql
SELECT sp.*, pf.*, f.* 
FROM subscription_plans sp
LEFT JOIN plan_features pf ON sp.id = pf.plan_id
LEFT JOIN features f ON pf.feature_id = f.id
WHERE sp.code = 'GOLD';
```

### Get user's feature usage
```sql
SELECT f.code, fu.used_count, fu.window_end
FROM feature_usage fu
JOIN features f ON fu.feature_id = f.id
WHERE fu.user_id = 'user-uuid' 
AND fu.window_end > NOW();
```

---

## 🔐 Authorization Matrix

| Endpoint | Public | USER | MODERATOR | ADMIN |
|----------|--------|------|-----------|-------|
| View plans | ✅ | ✅ | ✅ | ✅ |
| Create plan | ❌ | ❌ | ❌ | ✅ |
| Update plan | ❌ | ❌ | ❌ | ✅ |
| Delete plan | ❌ | ❌ | ❌ | ✅ |
| View features | ❌ | ❌ | ✅ | ✅ |
| Create feature | ❌ | ❌ | ❌ | ✅ |

---

## 📞 Support

For issues or questions:
- Check documentation: `/documentation/TASK_6.1_PLAN_MANAGEMENT_SUMMARY.md`
- View Swagger docs: `http://localhost:3000/api-docs`
- Run tests: `npm test src/tests/planManagementTest.js`

---

**Last Updated:** February 5, 2026  
**Status:** ✅ Production Ready
