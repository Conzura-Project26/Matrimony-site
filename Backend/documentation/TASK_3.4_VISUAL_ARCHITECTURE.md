# Task 3.4: Matchmaking Algorithm - Visual Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║                    MATCHMAKING SYSTEM ARCHITECTURE               ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 Mobile App    💻 Web App    🖥️  Desktop App                 │
│                                                                  │
│  [Recommended]   [Daily Matches]   [New Matches]   [Profile]    │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │ Bearer Token Auth
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET  /profiles/recommended       ─┐                            │
│  GET  /profiles/daily-matches      │  Routes                    │
│  GET  /profiles/new-matches        ├─ (matchmaking.js)          │
│  GET  /profiles/new-matches/count  │                            │
│  POST /matches/:matchId/view      ─┘                            │
│                                                                  │
│  🔒 authenticateToken                                            │
│  ✅ Validation (Zod)                                             │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  matchmakingController                                           │
│  ├── getRecommended()        → Query params validation          │
│  ├── getDailyMatches()       → Fetch today's matches            │
│  ├── getNewMatches()         → Filter unseen profiles           │
│  ├── getNewMatchesCount()    → Badge notification               │
│  └── recordView()            → Track interaction                │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  matchmakingService                                              │
│                                                                  │
│  ┌────────────────────────────────────────────┐                 │
│  │  generateMatches()                         │                 │
│  │  ├─ Get user + preferences                 │                 │
│  │  ├─ Build filter (exclude interests)       │                 │
│  │  ├─ Fetch candidates                       │                 │
│  │  ├─ Calculate bidirectional scores         │                 │
│  │  ├─ Filter by threshold                    │                 │
│  │  ├─ Sort with randomness                   │                 │
│  │  └─ Store in database                      │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  ┌────────────────────────────────────────────┐                 │
│  │  calculateBidirectionalScore()             │                 │
│  │  ├─ Score A → B (B matches A's prefs)      │                 │
│  │  ├─ Score B → A (A matches B's prefs)      │                 │
│  │  └─ Average = Mutual compatibility         │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  Other Functions:                                                │
│  • getRecommendedProfiles()                                      │
│  • getDailyMatches()                                             │
│  • getNewMatches()                                               │
│  • getNewMatchesCount()                                          │
│  • recordMatchInteraction()                                      │
│  • relaxPreferences()         (Progressive)                      │
│  • generateSmartDefaults()    (No prefs)                         │
│  • formatMatchProfile()       (Hide contact)                     │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILS & ALGORITHMS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  preferenceMatching.js                                           │
│  ├── calculateEnhancedMatchScore()                              │
│  │   ├─ Age (Hard Filter)          FAIL → 0%                    │
│  │   ├─ Religion (16%)                                          │
│  │   ├─ Location (16%)                                          │
│  │   ├─ Profession (13%)                                        │
│  │   ├─ Education (10%)                                         │
│  │   ├─ Caste (10%)                                             │
│  │   ├─ Height (5%)                                             │
│  │   ├─ Weight (5%)                                             │
│  │   ├─ Income (5%)                                             │
│  │   └─ Physical Status (5%)                                    │
│  │   TOTAL = 85% base + 15% bonus                               │
│  │                                                               │
│  └── calculateAge(), parseIncomeRange()                         │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🗄️  PostgreSQL (Supabase)                                      │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │     matches      │      │ match_interactions│               │
│  ├──────────────────┤      ├──────────────────┤                │
│  │ id               │◄─┐   │ id               │                │
│  │ user_id          │  └───│ match_id         │                │
│  │ matched_user_id  │      │ is_viewed        │                │
│  │ match_score      │      │ viewed_at        │                │
│  │ match_type       │      │ action           │                │
│  │ generated_at     │      │ acted_at         │                │
│  │ expires_at       │      └──────────────────┘                │
│  └──────────────────┘                                           │
│                                                                  │
│  Indexes:                                                        │
│  • idx_users_matchmaking (gender, is_active, is_verified)       │
│  • idx_matches_user_match_type                                  │
│  • idx_matches_generated_at                                     │
│  • idx_matches_expires_at                                       │
│  • idx_match_interactions_match_id                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════╗
║                       MATCH FLOW DIAGRAM                         ║
╚══════════════════════════════════════════════════════════════════╝

User Requests Matches
        │
        ├──> Check Auth ✅
        │
        ├──> Check Profile Completion (≥50%) ✅
        │
        ├──> Get Partner Preferences
        │    └──> If none → Generate Smart Defaults
        │
        ├──> Build Filter Query
        │    ├── Exclude: Self, Interests, Rejections
        │    ├── Include: Active, Verified, Opposite Gender
        │    └── Profile Completion ≥70%
        │
        ├──> Fetch Candidate Profiles (Limit × 3)
        │
        ├──> Calculate Match Scores
        │    └──> For each candidate:
        │         ├── Check Cooldown (30 days)
        │         ├── Calculate Bidirectional Score
        │         │   ├─ User → Candidate
        │         │   └─ Candidate → User
        │         ├── Average Scores
        │         └── Filter by Threshold
        │
        ├──> Sort by Score (with randomness)
        │
        ├──> Take Top N Matches
        │
        ├──> Store in Database
        │    ├── matches table (immutable)
        │    └── Set expires_at (daily matches only)
        │
        └──> Format Response (Hide Contact Info)
             └── Return to Client


╔══════════════════════════════════════════════════════════════════╗
║                     MATCH TYPES EXPLAINED                        ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│  📅 DAILY_MATCH                                                  │
├─────────────────────────────────────────────────────────────────┤
│  • Count: 10 matches                                             │
│  • Threshold: ≥60% score                                         │
│  • Refresh: Daily at midnight                                    │
│  • Expires: End of day                                           │
│  • Quality: Highest                                              │
│  • Use Case: "Today's Top Picks"                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🎯 RECOMMENDATION                                               │
├─────────────────────────────────────────────────────────────────┤
│  • Count: 20 per page (paginated)                                │
│  • Threshold: ≥50% score                                         │
│  • Refresh: On-demand or cached                                  │
│  • Expires: Never                                                │
│  • Quality: Medium-High                                          │
│  • Use Case: "Browse All Matches"                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ✨ NEW_MATCH                                                    │
├─────────────────────────────────────────────────────────────────┤
│  • Count: Variable (based on availability)                       │
│  • Threshold: ≥40% score                                         │
│  • Refresh: Since last check                                     │
│  • Expires: After viewed                                         │
│  • Quality: Medium                                               │
│  • Use Case: "New Profiles for You"                             │
└─────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════╗
║                    SECURITY & PRIVACY LAYER                      ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│  🔒 ALWAYS HIDDEN IN RESPONSES                                   │
├─────────────────────────────────────────────────────────────────┤
│  ❌ mobile_number                                                │
│  ❌ email                                                        │
│  ❌ password_hash                                                │
│  ❌ otp_code                                                     │
│  ❌ refresh_tokens                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ✅ INCLUDED IN MATCH RESPONSES                                  │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Basic Info (name, age, gender)                               │
│  ✓ Physical (height)                                             │
│  ✓ Location (city, state)                                        │
│  ✓ Professional (occupation)                                     │
│  ✓ Religious (religion, caste)                                   │
│  ✓ Education (qualification)                                     │
│  ✓ Photo (primary only)                                          │
│  ✓ Match Score                                                   │
│  ✓ Profile Completion %                                          │
└─────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════╗
║                   FUTURE ENHANCEMENTS ROADMAP                    ║
╚══════════════════════════════════════════════════════════════════╝

Phase 1 (Immediate)
├── Redis Caching
├── Batch Job (Daily Match Pre-generation)
└── Analytics Dashboard

Phase 2 (Short-term)
├── ML Model Training
├── A/B Testing Framework
└── Personalized Ranking

Phase 3 (Long-term)
├── Deep Learning Models
├── Real-time Updates (WebSocket)
└── Advanced AI Filters
```

---

**Legend:**
- 📱 Mobile/Client
- 🔒 Security/Auth
- 🗄️  Database
- ✅ Validation
- 📊 Data Flow
- ❌ Hidden/Excluded
- ✓ Included/Allowed
