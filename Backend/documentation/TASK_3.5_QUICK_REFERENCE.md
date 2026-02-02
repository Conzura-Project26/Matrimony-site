# Profile Views & Activity - Quick Reference
## Task 3.5 Implementation Guide

---

## 🚀 Quick Start

### 1. Run Migration
```bash
cd Backend
npx prisma migrate deploy
npx prisma generate
```

### 2. Test API
```bash
# Record a view
curl -X POST http://localhost:3000/profiles/{profileId}/view \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"view_source": "SEARCH", "view_duration": 45}'

# Get who viewed me
curl http://localhost:3000/profile/viewers \
  -H "Authorization: Bearer {token}"

# Get profiles I viewed
curl http://localhost:3000/profile/viewed \
  -H "Authorization: Bearer {token}"
```

### 3. Run Tests
```bash
npm test src/tests/views/
```

---

## 📋 5 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/profiles/:profileId/view` | Required | Record view (204) |
| GET | `/profile/viewers` | Required | Who viewed me |
| GET | `/profile/viewed` | Required | Who I viewed |
| GET | `/profile/viewers/count` | Required | My viewers count |
| GET | `/profile/viewed/count` | Required | My viewed count |

---

## 🔧 Common Operations

### Record a Profile View
```javascript
// Frontend integration
const recordView = async (profileId) => {
  const startTime = Date.now();
  
  // ... user views profile ...
  
  const viewDuration = Math.floor((Date.now() - startTime) / 1000);
  
  await fetch(`/profiles/${profileId}/view`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      view_source: 'DIRECT',
      view_duration: viewDuration
    })
  });
};
```

### Get Viewers with Pagination
```javascript
const getViewers = async (page = 1) => {
  const response = await fetch(
    `/profile/viewers?page=${page}&limit=20`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  return data.data; // { viewers, pagination, stats }
};
```

### Check Last Active Status
```javascript
const getLastActiveText = (lastActive) => {
  // lastActive values:
  // "Active now" | "Active today" | "Active this week" | "Active X days ago" | null
  return lastActive || "Not recently active";
};
```

---

## ⚙️ Configuration

### Rate Limiting
```javascript
MAX_VIEWS_PER_HOUR: 3        // Max views per profile pair
RATE_LIMIT_WINDOW_HOURS: 1  // Sliding window
MAX_DURATION_SECONDS: 600    // Cap view duration at 10 min
```

### Last Active
```javascript
UPDATE_THROTTLE_MINUTES: 5   // Update frequency
MEANINGFUL_ACTIONS: [
  'LOGIN',
  'PROFILE_VIEW',
  'SEARCH',
  'MESSAGE_SEND',
  'INTEREST_SEND',
  'MATCH_VIEW'
]
```

### Pagination
```javascript
DEFAULT_VIEWERS_PER_PAGE: 20
MAX_VIEWERS_PER_PAGE: 50
```

### Caching
```javascript
CACHE_VIEWERS_TTL_MINUTES: 10      // Recent viewers cache
CACHE_VIEW_COUNT_TTL_MINUTES: 60   // View count cache
```

---

## 🛡️ Privacy Rules

### ✅ Allowed
- View any active profile
- View count visible to profile owner
- Last active visible to all

### ❌ Blocked
- Self-views (400 error)
- Viewing blocked users (403 error)
- Viewing inactive profiles (403 error)
- More than 3 views per hour (silent fail)

---

## 📊 View Sources

```javascript
SEARCH         // From search results page
MATCH          // From match/recommendation algorithm
RECOMMENDATION // From "daily matches"
DIRECT         // Direct URL access
SHORTLIST      // From saved/shortlisted profiles
INTEREST       // After sending/receiving interest
```

---

## 🎯 Response Formats

### Viewer Profile Object
```json
{
  "viewer_id": "uuid",
  "profile_id": "SV123456",
  "full_name": "John Doe",
  "age": 28,
  "gender": "MALE",
  "height_cm": 175,
  "occupation": "Software Engineer",
  "city": "Mumbai",
  "state": "Maharashtra",
  "primary_photo": "https://...",
  "viewed_at": "2025-01-15T10:30:00Z",
  "view_count": 3,
  "last_active": "Active today",
  "profile_completion": 85,
  "is_verified": true
}
```

### Pagination Object
```json
{
  "page": 1,
  "limit": 20,
  "total": 45,
  "hasMore": true
}
```

### Stats Object
```json
{
  "total_views": 127,
  "unique_viewers": 45
}
```

---

## 🐛 Troubleshooting

### Issue: Views not recording
```bash
# Check if migration ran
npx prisma migrate status

# Check for self-view
# viewer_id must NOT equal viewed_user_id

# Check rate limit
# Max 3 views per hour per pair
```

### Issue: Last active not updating
```bash
# Check middleware is applied
# Throttle: max once per 5 minutes
# Only on meaningful actions

# Clear cache (restart server)
```

### Issue: Count mismatch
```bash
# Recalculate cache
UPDATE users
SET profile_views_count = (
  SELECT COUNT(*) FROM profile_views
  WHERE viewed_user_id = users.id
);
```

### Issue: Performance slow
```bash
# Check indexes exist
\d profile_views

# Should see 5 indexes:
# idx_profile_views_viewed_user
# idx_profile_views_viewer
# idx_profile_views_pair
# idx_profile_views_source
# idx_profile_views_search_log
```

---

## 📈 Database Queries

### Get top viewed profiles
```sql
SELECT 
  u.profile_id,
  u.full_name,
  COUNT(DISTINCT pv.viewer_id) as unique_viewers,
  COUNT(*) as total_views
FROM users u
JOIN profile_views pv ON pv.viewed_user_id = u.id
WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY unique_viewers DESC
LIMIT 10;
```

### Get view sources breakdown
```sql
SELECT 
  view_source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profile_views
WHERE viewed_at >= NOW() - INTERVAL '7 days'
GROUP BY view_source
ORDER BY count DESC;
```

### Get users who viewed each other
```sql
SELECT DISTINCT
  pv1.viewer_id as user1_id,
  pv1.viewed_user_id as user2_id,
  u1.full_name as user1_name,
  u2.full_name as user2_name
FROM profile_views pv1
JOIN profile_views pv2 ON 
  pv1.viewer_id = pv2.viewed_user_id AND
  pv1.viewed_user_id = pv2.viewer_id
JOIN users u1 ON u1.id = pv1.viewer_id
JOIN users u2 ON u2.id = pv1.viewed_user_id
WHERE pv1.viewed_at >= NOW() - INTERVAL '7 days'
  AND pv2.viewed_at >= NOW() - INTERVAL '7 days';
```

---

## 🔗 Related Features

### Integration Points
- **Search** → Track view_source = 'SEARCH', link search_log_id
- **Matchmaking** → Track view_source = 'MATCH'
- **Interests** → Track view_source = 'INTEREST'
- **Shortlist** → Track view_source = 'SHORTLIST'

### Future Features
- Blocking system (prevent views)
- Anonymous viewing (admin only)
- Real-time notifications
- Premium analytics
- View heatmaps

---

## ✅ Testing Checklist

- [ ] Record view returns 204
- [ ] Self-view returns 400
- [ ] Rate limit enforced (3/hour)
- [ ] Viewers list deduplicated
- [ ] Pagination works correctly
- [ ] Date filters work
- [ ] Last active displays correctly
- [ ] View count cache updates
- [ ] Inactive profiles hidden
- [ ] All tests pass

---

## 📦 Files Modified

```
Backend/
├── prisma/
│   ├── schema.prisma                          (modified)
│   └── migrations/
│       └── 20260202120000_add_profile_views_system/
│           └── migration.sql                  (new)
├── src/
│   ├── types/
│   │   └── enums.js                          (modified)
│   ├── services/
│   │   └── viewService.js                    (new)
│   ├── controllers/
│   │   └── viewController.js                 (new)
│   ├── routes/
│   │   └── viewRoutes.js                     (new)
│   ├── middleware/
│   │   └── lastActiveMiddleware.js           (new)
│   └── tests/
│       └── views/
│           ├── viewService.test.js           (new)
│           └── viewAPI.test.js               (new)
├── index.js                                   (modified)
└── documentation/
    ├── TASK_3.5_COMPLETE_REFERENCE.md        (new)
    └── TASK_3.5_QUICK_REFERENCE.md           (new)
```

---

## 🎓 Key Concepts

### Event-Sourced Storage
- Store ALL view events
- Deduplicate at query layer
- Enables rich analytics
- Flexible reporting

### Rate Limiting Strategy
- Per viewer-profile pair
- Sliding 1-hour window
- Silent fail (204 response)
- No error shown to user

### Caching Strategy
- Count cache (profile_views_count)
- Last active cache (in-memory)
- Future: Redis for viewer lists
- Balance freshness vs performance

### Deduplication
- GROUP BY viewer_id
- MAX(viewed_at) for latest
- COUNT(*) for total views
- DISTINCT ON for PostgreSQL

---

## 💡 Pro Tips

1. **Always use indexes** - Query performance critical
2. **Async cache updates** - Don't block user requests
3. **Silent rate limiting** - Better UX than errors
4. **Throttle last active** - Prevent excessive DB writes
5. **Monitor view patterns** - Detect fraud/abuse

---

**Quick Access:**
- Full Documentation: [TASK_3.5_COMPLETE_REFERENCE.md](./TASK_3.5_COMPLETE_REFERENCE.md)
- Swagger UI: http://localhost:3000/api-docs
- Test Suite: `npm test src/tests/views/`

---

**Status: ✅ Production Ready**
**Last Updated: 2025-02-02**
