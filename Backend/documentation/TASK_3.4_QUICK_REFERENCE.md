# Task 3.4: Matchmaking Algorithm - Quick Reference

## 🚀 Quick Start

### 1. Run Database Migration
```bash
cd Backend
# Connect to your database and run:
psql -U your_user -d your_database -f prisma/migrations/manual_add_matchmaking_tables.sql
```

### 2. Test the APIs
```bash
# Update test credentials first
nano src/tests/test-matchmaking.js

# Run tests
node src/tests/test-matchmaking.js
```

### 3. Access Swagger Docs
```
http://localhost:3000/api-docs
# Navigate to "Matchmaking" section
```

---

## 📋 API Endpoints Summary

| Method | Endpoint | Description | Min Score |
|--------|----------|-------------|-----------|
| GET | `/profiles/recommended` | General recommendations | 50% |
| GET | `/profiles/daily-matches` | Daily curated matches (10) | 60% |
| GET | `/profiles/new-matches` | New unseen matches | 40% |
| GET | `/profiles/new-matches/count` | Notification badge count | - |
| POST | `/matches/:matchId/view` | Track profile view | - |

---

## 🔑 Key Parameters

### GET /profiles/recommended
```
?page=1              # Page number (default: 1)
&limit=20            # Results per page (max: 50)
&min_score=50        # Minimum match % (0-100)
&regenerate=false    # Force regenerate
```

### GET /profiles/new-matches
```
?page=1              # Page number
&limit=20            # Results per page (max: 50)
```

---

## 📊 Match Response Format

```json
{
  "match_id": "uuid",
  "user_id": "uuid",
  "profile_id": "MAT00001234",
  "full_name": "John Doe",
  "age": 28,
  "gender": "Male",
  "height_cm": 175,
  "occupation": "Software Engineer",
  "city": "Mumbai",
  "state": "Maharashtra",
  "religion": "Hindu",
  "caste": "Maratha",
  "education": "B.Tech",
  "match_score": 85,          // 0-100
  "primary_photo": "url",
  "is_viewed": false,
  "profile_completion": 95
}
```

**Note**: `mobile_number` and `email` are NEVER included.

---

## ⚙️ Configuration Constants

```javascript
// Match Types
DAILY_MATCH      // Daily curated (≥60% score)
RECOMMENDATION   // General recs (≥50% score)
NEW_MATCH        // New profiles (≥40% score)

// Profile Completion
TO_APPEAR_IN_MATCHES: 70%   // To be shown to others
TO_VIEW_MATCHES: 50%        // To see recommendations

// Timing
DAILY_MATCHES_COUNT: 10
COOLDOWN_DAYS: 30
CACHE_TTL_MINUTES: 30
```

---

## 🔒 Security Features

✅ Contact info (mobile, email) always hidden  
✅ Only minimal card data in responses  
✅ Authentication required for all endpoints  
✅ Profile completion requirements enforced

---

## 🧪 Test Checklist

Before deploying:
- [ ] Run migration script
- [ ] Test all 5 endpoints
- [ ] Verify contact info hidden
- [ ] Check pagination works
- [ ] Test with multiple users
- [ ] Verify match scores accurate
- [ ] Test profile completion checks
- [ ] Review Swagger documentation

---

## 🐛 Troubleshooting

### No matches found
1. Check user has partner preferences set
2. Verify profile completion ≥50%
3. Ensure opposite gender profiles exist
4. Try lowering min_score threshold

### Migration fails
1. Check database connection
2. Verify user has CREATE TABLE permissions
3. Ensure MatchType enum doesn't exist yet
4. Check for naming conflicts

### Contact info exposed
1. Review formatMatchProfile() function
2. Check response serialization
3. Never select mobile_number/email fields

---

## 📞 Support

- **Documentation**: TASK_3.4_MATCHMAKING_ALGORITHM_SUMMARY.md
- **Test File**: src/tests/test-matchmaking.js
- **Service Layer**: src/services/matchmakingService.js
- **Swagger Docs**: http://localhost:3000/api-docs

---

## ✅ Done!

Task 3.4 is complete and ready for production! 🎉
