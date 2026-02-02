# Profile Views & Activity - Visual Architecture
## Task 3.5 System Design

---

## 🎨 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Client                          │
│  (React/Mobile App)                                              │
│                                                                   │
│  Actions:                                                         │
│  • User opens profile                                             │
│  • Track view duration                                            │
│  • View "Who viewed me"                                           │
│  • View "Profiles I viewed"                                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTPS + JWT Auth
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  (Express.js + Middleware)                                       │
│                                                                   │
│  ├── authenticate (JWT validation)                               │
│  ├── checkPermission('view_profiles')                            │
│  ├── lastActiveMiddleware (throttled, 5 min)                     │
│  └── rateLimiter (global + route-specific)                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Routes Layer                               │
│  (viewRoutes.js)                                                 │
│                                                                   │
│  POST   /profiles/:profileId/view          → recordView          │
│  GET    /profile/viewers                   → getMyViewers        │
│  GET    /profile/viewed                    → getMyViewedProfiles │
│  GET    /profile/viewers/count             → getViewersCount     │
│  GET    /profile/viewed/count              → getViewedCount      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Controller Layer                              │
│  (viewController.js)                                             │
│                                                                   │
│  • Input validation                                               │
│  • Error handling                                                 │
│  • Request/response formatting                                    │
│  • Logging                                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
│  (viewService.js)                                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ recordProfileView()                                      │    │
│  │  1. Validate: viewer_id != viewed_user_id               │    │
│  │  2. Check: isBlocked()                                  │    │
│  │  3. Check: isRateLimitExceeded() (3/hour)              │    │
│  │  4. Verify: profile exists and is_active               │    │
│  │  5. Cap: view_duration <= 600 seconds                  │    │
│  │  6. Create: profile_views record                       │    │
│  │  7. Update: profile_views_count (async)                │    │
│  │  8. Return: { success, view_id }                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ getMyViewers()                                           │    │
│  │  1. Validate: pagination params                         │    │
│  │  2. Build: date range filters                           │    │
│  │  3. Query: DISTINCT ON (viewer_id) latest views         │    │
│  │  4. Fetch: full viewer profiles (is_active=true)        │    │
│  │  5. Format: add age, last_active, photo                 │    │
│  │  6. Count: total_views, unique_viewers                  │    │
│  │  7. Return: { viewers, pagination, stats }              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ getMyViewedProfiles()                                    │    │
│  │  1. Query: DISTINCT ON (viewed_user_id) latest          │    │
│  │  2. Fetch: profiles with photos                         │    │
│  │  3. Optional: interaction_status (interests)            │    │
│  │  4. Format: profile cards with last_active              │    │
│  │  5. Return: { profiles, pagination }                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Prisma ORM
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                                │
│  (PostgreSQL via Supabase)                                       │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  profile_views   │  │      users       │                     │
│  ├──────────────────┤  ├──────────────────┤                     │
│  │ id (PK)          │  │ id (PK)          │                     │
│  │ viewer_id (FK)───┼──┤ profile_id       │                     │
│  │ viewed_user_id───┼──┤ full_name        │                     │
│  │ viewed_at        │  │ last_active_at   │                     │
│  │ view_source      │  │ profile_views_   │                     │
│  │ view_duration    │  │   count (cache)  │                     │
│  │ search_log_id    │  │ is_active        │                     │
│  │ ip_address       │  │ photos           │                     │
│  │ user_agent       │  └──────────────────┘                     │
│  └──────────────────┘                                            │
│                                                                   │
│  Indexes:                                                         │
│  • idx_profile_views_viewed_user (viewed_user_id, viewed_at)     │
│  • idx_profile_views_viewer (viewer_id, viewed_at)               │
│  • idx_profile_views_pair (viewer_id, viewed_user_id, viewed_at) │
│  • idx_profile_views_source (view_source, viewed_at)             │
│  • idx_profile_views_search_log (search_log_id)                  │
│                                                                   │
│  Constraints:                                                     │
│  • CHECK (viewer_id != viewed_user_id)  -- No self-views         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Record Profile View

```
User A opens     →    Frontend tracks    →    POST /profiles/:id/view
User B's profile      view duration            {
                                                 view_source: "SEARCH",
                                                 view_duration: 45
                                               }
                                                     │
                                                     ↓
                                          ┌──────────────────────┐
                                          │ authenticate()       │
                                          │ checkPermission()    │
                                          │ trackLastActive()    │
                                          └──────────┬───────────┘
                                                     │
                                                     ↓
                                          ┌──────────────────────┐
                                          │ viewController       │
                                          │   .recordView()      │
                                          └──────────┬───────────┘
                                                     │
                                                     ↓
                                          ┌──────────────────────────────┐
                                          │ viewService                  │
                                          │   .recordProfileView()       │
                                          │                              │
                                          │ 1. viewer != viewed? ✓       │
                                          │ 2. Not blocked? ✓            │
                                          │ 3. Rate limit OK? ✓          │
                                          │ 4. Profile active? ✓         │
                                          │ 5. Cap duration (45s) ✓      │
                                          └──────────┬───────────────────┘
                                                     │
                                                     ↓
                                          ┌──────────────────────────────┐
                                          │ Database INSERT              │
                                          │                              │
                                          │ INSERT INTO profile_views    │
                                          │ VALUES (                     │
                                          │   viewer_id: A,              │
                                          │   viewed_user_id: B,         │
                                          │   view_source: 'SEARCH',     │
                                          │   view_duration: 45,         │
                                          │   viewed_at: NOW()           │
                                          │ )                            │
                                          └──────────┬───────────────────┘
                                                     │
                                                     ↓
                                          ┌──────────────────────────────┐
                                          │ Async Cache Update           │
                                          │                              │
                                          │ UPDATE users                 │
                                          │ SET profile_views_count =    │
                                          │     profile_views_count + 1  │
                                          │ WHERE id = B                 │
                                          └──────────────────────────────┘
                                                     │
                                                     ↓
                                                204 No Content
                                            (Silent success)
```

---

## 🔍 Query Flow: Get My Viewers

```
User B requests    →    GET /profile/viewers?page=1&limit=20
"Who viewed me"              │
                             ↓
                   ┌──────────────────────────┐
                   │ viewService              │
                   │   .getMyViewers()        │
                   │                          │
                   │ Step 1: Raw SQL Query    │
                   │ ─────────────────────    │
                   │ SELECT DISTINCT ON       │
                   │   (viewer_id)            │
                   │   viewer_id,             │
                   │   MAX(viewed_at),        │
                   │   COUNT(*)               │
                   │ FROM profile_views       │
                   │ WHERE viewed_user_id=B   │
                   │ GROUP BY viewer_id       │
                   │ ORDER BY viewed_at DESC  │
                   │                          │
                   │ Returns:                 │
                   │ [                        │
                   │   {viewer_id: A,         │
                   │    viewed_at: '10:30',   │
                   │    view_count: 3},       │
                   │   {viewer_id: C, ...}    │
                   │ ]                        │
                   └──────────┬───────────────┘
                              │
                              ↓
                   ┌──────────────────────────┐
                   │ Step 2: Fetch Profiles   │
                   │                          │
                   │ SELECT * FROM users      │
                   │ WHERE id IN (A, C, ...)  │
                   │   AND is_active = true   │
                   │ INCLUDE:                 │
                   │   • personal_details     │
                   │   • photos (primary)     │
                   │   • professional_details │
                   └──────────┬───────────────┘
                              │
                              ↓
                   ┌──────────────────────────┐
                   │ Step 3: Format Response  │
                   │                          │
                   │ For each viewer:         │
                   │  • Calculate age         │
                   │  • Get last_active text  │
                   │  • Extract primary photo │
                   │  • Add view_count        │
                   │  • Add viewed_at time    │
                   └──────────┬───────────────┘
                              │
                              ↓
                   ┌──────────────────────────┐
                   │ Step 4: Add Stats        │
                   │                          │
                   │ total_views: COUNT(*)    │
                   │ unique_viewers: COUNT    │
                   │   (DISTINCT viewer_id)   │
                   └──────────┬───────────────┘
                              │
                              ↓
                   {
                     "viewers": [
                       {
                         "viewer_id": "uuid-A",
                         "profile_id": "SV123456",
                         "full_name": "User A",
                         "age": 28,
                         "viewed_at": "2025-01-15T10:30:00Z",
                         "view_count": 3,
                         "last_active": "Active today"
                       }
                     ],
                     "pagination": {...},
                     "stats": {
                       "total_views": 45,
                       "unique_viewers": 23
                     }
                   }
```

---

## ⚡ Rate Limiting Flow

```
┌────────────────────────────────────────────────────────────┐
│          Rate Limiting Logic (3 views per hour)            │
└────────────────────────────────────────────────────────────┘

View Attempt #1 (10:00 AM)
  │
  ├─> Check: COUNT(*) WHERE viewer=A AND viewed=B
  │          AND viewed_at > (NOW - 1 hour)
  │   Result: 0 views
  │
  └─> ✅ ALLOWED → Create view record


View Attempt #2 (10:15 AM)
  │
  ├─> Check: COUNT(*) = 1 view in last hour
  │
  └─> ✅ ALLOWED → Create view record


View Attempt #3 (10:30 AM)
  │
  ├─> Check: COUNT(*) = 2 views in last hour
  │
  └─> ✅ ALLOWED → Create view record


View Attempt #4 (10:45 AM)
  │
  ├─> Check: COUNT(*) = 3 views in last hour
  │
  └─> ❌ RATE LIMITED → Return 204 (silent fail)
      • No error thrown
      • No DB write
      • Log warning
      • User sees success (better UX)


View Attempt #5 (11:01 AM)
  │
  ├─> Check: COUNT(*) WHERE viewed_at > 10:01 AM
  │          (Sliding window moved)
  │   Result: 2 views (View #1 fell out of window)
  │
  └─> ✅ ALLOWED → Create view record
```

---

## 🕐 Last Active Tracking

```
┌────────────────────────────────────────────────────────────┐
│         Last Active Middleware (5-minute throttle)         │
└────────────────────────────────────────────────────────────┘

Request Flow:
─────────────

1. User makes request (any endpoint)
       │
       ↓
2. authenticate() → Sets req.user
       │
       ↓
3. autoTrackLastActive() middleware
       │
       ├─> Check: Is user authenticated? ✓
       │
       ├─> Infer action from route:
       │   • /auth/login        → 'LOGIN'
       │   • /profiles/:id      → 'PROFILE_VIEW'
       │   • /search            → 'SEARCH'
       │   • /messages          → 'MESSAGE_SEND'
       │
       ├─> Check: Is meaningful action? ✓
       │
       ├─> Check in-memory cache:
       │   lastUpdate = cache.get(user.id)
       │   timeSince = NOW - lastUpdate
       │
       │   If timeSince < 5 minutes:
       │       └─> SKIP (throttled)
       │
       │   If timeSince >= 5 minutes:
       │       └─> UPDATE (proceed)
       │
       └─> Async update (non-blocking):
           UPDATE users
           SET last_active_at = NOW()
           WHERE id = user.id
           
           cache.set(user.id, NOW())
       
4. Continue to actual route handler
   (middleware doesn't block request)


Display Logic:
──────────────

last_active_at → Human-readable text

< 15 min  → "Active now"
< 24 hrs  → "Active today"
< 7 days  → "Active this week"
< 30 days → "Active X days ago"
> 30 days → null (hidden)
```

---

## 📊 Database Query Patterns

### Pattern 1: Deduplicated Viewers
```sql
-- Get latest view from each viewer
SELECT DISTINCT ON (viewer_id)
  viewer_id,
  viewed_at,
  COUNT(*) OVER (PARTITION BY viewer_id) as view_count
FROM profile_views
WHERE viewed_user_id = 'user-B-uuid'
ORDER BY viewer_id, viewed_at DESC
LIMIT 20;

-- Index used: idx_profile_views_viewed_user
-- Performance: O(log n) lookup + O(k) scan (k = viewers)
```

### Pattern 2: View Count (Cached)
```sql
-- Fast count from cache
SELECT profile_views_count
FROM users
WHERE id = 'user-B-uuid';

-- No table scan needed!
-- Performance: O(1) - index lookup
```

### Pattern 3: Rate Limit Check
```sql
-- Count recent views from same viewer
SELECT COUNT(*)
FROM profile_views
WHERE viewer_id = 'user-A-uuid'
  AND viewed_user_id = 'user-B-uuid'
  AND viewed_at > NOW() - INTERVAL '1 hour';

-- Index used: idx_profile_views_pair
-- Performance: O(log n) - indexed lookup
```

---

## 🎯 Event-Sourced Storage Model

```
┌──────────────────────────────────────────────────────────────┐
│            Event-Sourced View Storage Strategy               │
└──────────────────────────────────────────────────────────────┘

Traditional Approach (Update):
───────────────────────────────
viewer_interactions
├─ user_a_viewed_user_b_count: 3
└─ last_view: '2025-01-15 10:30'

❌ Problems:
   • Lost history (can't see view timeline)
   • Can't analyze patterns
   • Can't track view sources
   • Can't undo/audit


Our Approach (Event Log):
──────────────────────────
profile_views (all events stored)
├─ [1] user_a → user_b @ 10:00 (SEARCH, 30s)
├─ [2] user_a → user_b @ 10:15 (DIRECT, 45s)
├─ [3] user_a → user_b @ 10:30 (MATCH, 60s)
└─ [4] user_c → user_b @ 11:00 (SHORTLIST, 20s)

✅ Benefits:
   • Complete history preserved
   • Rich analytics possible
   • Can aggregate any way
   • Audit trail included
   • Flexible reporting


Deduplication at Query Layer:
──────────────────────────────
SELECT DISTINCT ON (viewer_id)  ← Deduplicate here
  viewer_id,
  MAX(viewed_at) as last_view,  ← Latest timestamp
  COUNT(*) as total_views       ← Aggregate count
FROM profile_views
GROUP BY viewer_id;

Result for "Who viewed User B":
└─ User A (3 views, last: 10:30)
└─ User C (1 view, last: 11:00)
```

---

## 🔐 Security & Privacy Layers

```
┌──────────────────────────────────────────────────────────────┐
│                 Multi-Layer Security Model                    │
└──────────────────────────────────────────────────────────────┘

Layer 1: Database Constraints
─────────────────────────────
CHECK (viewer_id != viewed_user_id)
  ↳ Prevents self-views at DB level
  ↳ Cannot be bypassed


Layer 2: Service Validation
────────────────────────────
if (viewerId === viewedUserId) {
  throw BadRequestError('Cannot view own profile');
}
  ↳ Explicit business logic check
  ↳ Returns clear error message


Layer 3: Blocking Check (Future)
─────────────────────────────────
const isBlocked = await checkBlockStatus(viewer, viewed);
if (isBlocked) {
  throw ForbiddenError('Blocked');
}
  ↳ User privacy control
  ↳ Hard stop on view attempt


Layer 4: Rate Limiting
───────────────────────
if (recentViews >= 3) {
  return { success: true, rateLimited: true };
}
  ↳ Prevents spam/harassment
  ↳ Silent fail (better UX)


Layer 5: Active Profile Filter
───────────────────────────────
if (!user.is_active) {
  throw ForbiddenError('Profile inactive');
}
  ↳ No viewing deactivated accounts
  ↳ Privacy respected


Layer 6: Authentication
────────────────────────
authenticate() middleware
  ↳ JWT validation
  ↳ No anonymous viewing (v1)


Layer 7: Authorization
───────────────────────
checkPermission('view_profiles')
  ↳ Permission-based access
  ↳ Can revoke per user
```

---

## 📈 Analytics & Insights

```
┌──────────────────────────────────────────────────────────────┐
│              Analytics Capabilities (Built-in)                │
└──────────────────────────────────────────────────────────────┘

1. View Source Analysis
───────────────────────
SELECT view_source, COUNT(*) as count
FROM profile_views
GROUP BY view_source;

Results:
└─ SEARCH: 1,245 (45%)
└─ MATCH: 876 (32%)
└─ DIRECT: 432 (16%)
└─ RECOMMENDATION: 187 (7%)


2. Engagement Patterns
───────────────────────
SELECT 
  DATE_TRUNC('hour', viewed_at) as hour,
  COUNT(*) as views
FROM profile_views
WHERE viewed_at > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;

Result: Hourly heatmap of views


3. Conversion Funnel
────────────────────
SELECT
  view_source,
  COUNT(DISTINCT pv.viewer_id) as viewers,
  COUNT(DISTINCT i.sender_id) as interest_sent,
  ROUND(100.0 * COUNT(DISTINCT i.sender_id) / 
        COUNT(DISTINCT pv.viewer_id), 2) as conversion_rate
FROM profile_views pv
LEFT JOIN interests i ON i.sender_id = pv.viewer_id
GROUP BY view_source;

Result: Which sources convert best


4. Popular Profiles
───────────────────
SELECT
  u.profile_id,
  u.full_name,
  COUNT(DISTINCT pv.viewer_id) as unique_viewers,
  COUNT(*) as total_views
FROM users u
JOIN profile_views pv ON pv.viewed_user_id = u.id
WHERE pv.viewed_at > NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY unique_viewers DESC
LIMIT 10;

Result: Top 10 most viewed profiles


5. Mutual Views Detection
──────────────────────────
SELECT
  pv1.viewer_id as user_a,
  pv1.viewed_user_id as user_b
FROM profile_views pv1
JOIN profile_views pv2 ON
  pv1.viewer_id = pv2.viewed_user_id AND
  pv1.viewed_user_id = pv2.viewer_id
WHERE pv1.viewed_at > NOW() - INTERVAL '7 days';

Result: Users who viewed each other


6. Average View Duration
─────────────────────────
SELECT
  view_source,
  AVG(view_duration_seconds) as avg_duration,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY view_duration_seconds
  ) as median_duration
FROM profile_views
WHERE view_duration_seconds IS NOT NULL
GROUP BY view_source;

Result: Engagement quality by source
```

---

## 🎨 UI/UX Patterns

```
┌──────────────────────────────────────────────────────────────┐
│                Frontend Integration Patterns                  │
└──────────────────────────────────────────────────────────────┘

Pattern 1: Silent View Tracking
────────────────────────────────
useEffect(() => {
  const startTime = Date.now();
  
  // Track view on mount
  trackProfileView(profileId, 'DIRECT');
  
  // Track duration on unmount
  return () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    updateViewDuration(profileId, duration);
  };
}, [profileId]);


Pattern 2: Viewers List (Infinite Scroll)
──────────────────────────────────────────
const { data, fetchNextPage, hasMore } = useInfiniteQuery({
  queryKey: ['viewers'],
  queryFn: ({ pageParam = 1 }) => 
    api.get(`/profile/viewers?page=${pageParam}`),
  getNextPageParam: (lastPage) => 
    lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
});


Pattern 3: Last Active Badge
─────────────────────────────
function LastActiveBadge({ lastActive }) {
  const colorMap = {
    'Active now': 'green',
    'Active today': 'blue',
    'Active this week': 'gray'
  };
  
  return (
    <Badge color={colorMap[lastActive]}>
      {lastActive || 'Not recently active'}
    </Badge>
  );
}


Pattern 4: View Count Display
──────────────────────────────
function ProfileStats({ userId }) {
  const { data } = useQuery(['viewersCount'], () =>
    api.get(`/profile/viewers/count`)
  );
  
  return (
    <StatCard
      icon={<EyeIcon />}
      label="Profile Views"
      value={data.total_views}
      subtitle={`${data.unique_viewers} unique viewers`}
    />
  );
}
```

---

**Document Status**: Complete  
**Last Updated**: February 2, 2025  
**Version**: 1.0.0
