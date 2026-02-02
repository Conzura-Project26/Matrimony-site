# Task 3.1: Profile Listing - Quick Reference

## 📋 Overview

**Status:** ✅ Complete  
**Date:** February 2, 2026  
**Endpoint:** `GET /profiles`  
**Authentication:** Required (Bearer Token)

## 🎯 Key Features

### Auto-Applied Filters (Non-negotiable)
- ✅ Only **active users** (`is_active = true`)
- ✅ Minimum **60% profile completion**
- ✅ At least **one approved photo**
- ✅ **Excludes your own profile**

### Smart Defaults
- 🎯 **Auto-applies partner preferences** if no filters specified
- 🎯 **Opposite gender filtering** (MALE sees FEMALE, vice versa)
- 🎯 **Match score** calculated for every profile

### Search Logging
- 📊 Every search logged to `search_logs` table
- 📊 Tracks: filters, result count, execution time, IP, user agent

---

## 🚀 API Usage

### Basic Request
```bash
GET /profiles?page=1&limit=20
Authorization: Bearer <access_token>
```

### With Filters
```bash
GET /profiles?page=1&limit=20&min_age=25&max_age=35&state=Maharashtra&sort_by=match_score
Authorization: Bearer <access_token>
```

---

## 📊 Query Parameters

### Pagination
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number |
| `limit` | integer | 20 | 100 | Profiles per page |

### Sorting
| Parameter | Type | Options | Description |
|-----------|------|---------|-------------|
| `sort_by` | string | `newest`, `last_active`, `match_score` | Sort order |

**Sort Options:**
- `newest` - Recently registered (created_at DESC)
- `last_active` - Recently active (last_active_at DESC)
- `match_score` - Best matches first (based on preferences)

### Basic Filters
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `gender` | string | `FEMALE` | MALE or FEMALE |
| `min_age` | integer | `25` | Minimum age (18-100) |
| `max_age` | integer | `35` | Maximum age (18-100) |

### Location Filters (OR Match)
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `state` | string | `Maharashtra` | Living OR work state |
| `city` | string | `Mumbai` | Living OR work city |
| `work_state` | string | `Karnataka` | Work state only |
| `work_city` | string | `Bangalore` | Work city only |
| `work_location_type` | string | `Remote` | On-Site, Remote, Hybrid, etc. |

### Caste & Religion
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `religion_id` | integer | `1` | Religion ID |
| `caste_id` | integer | `5` | Caste ID |

### Personal Details
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `marital_status` | string | `Never Married` | Marital status |
| `min_height` | integer | `160` | Min height (cm) |
| `max_height` | integer | `180` | Max height (cm) |
| `mother_tongue` | string | `Hindi` | Mother tongue |

### Professional Details
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `employment_type` | string | `Salaried - Private` | Employment type |
| `income_range` | string | `5-10 Lakhs` | Annual income |

### Education
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `qualification` | string | `B.Tech` | Partial match, case-insensitive |

---

## 📤 Response Format

```json
{
  "success": true,
  "message": "Profiles retrieved successfully",
  "data": {
    "profiles": [
      {
        "profile_id": "MAT00001234",
        "full_name": "Priya Sharma",
        "age": 28,
        "gender": "FEMALE",
        "profile_completion_percentage": 85,
        "height_cm": 165,
        "marital_status": "Never Married",
        "city": "Mumbai",
        "state": "Maharashtra",
        "mother_tongue": "Hindi",
        "occupation": "Software Engineer",
        "annual_income_range": "5-10 Lakhs",
        "employment_type": "Salaried - Private",
        "qualification": "B.Tech Computer Science",
        "religion_name": "Hindu",
        "caste_name": "Maratha",
        "primary_photo": "https://utfs.io/f/abc123xyz",
        "photo_count": 3,
        "match_score": 78,
        "last_active_at": "2026-02-02T10:30:00.000Z",
        "created_at": "2026-01-15T08:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    },
    "filters_applied": {
      "gender": "FEMALE",
      "min_age": 25,
      "max_age": 35,
      "state": "Maharashtra"
    },
    "execution_time_ms": 245
  }
}
```

---

## 🗄️ Database Changes

### New Field: `last_active_at`
```sql
ALTER TABLE "users" 
ADD COLUMN "last_active_at" TIMESTAMP(3);

CREATE INDEX "idx_users_last_active" ON "users"("last_active_at" DESC);
```

**Updated on:**
- Every successful login (authController.js)

### Updated Table: `search_logs`
Already has required fields:
- `search_filters` (JSONB)
- `result_count` (INTEGER)
- `execution_time_ms` (INTEGER)
- `ip_address` (VARCHAR)
- `user_agent` (TEXT)

---

## 📁 Files Created/Modified

### New Files
1. ✅ `src/services/profileListingService.js` (324 lines)
   - Build WHERE/ORDER clauses
   - Format profile data
   - Get partner preferences
   - Log searches

2. ✅ `src/controllers/profileListingController.js` (264 lines)
   - Main profile listing logic
   - Match score calculation
   - Pagination handling

3. ✅ `src/routes/profileListing.js` (466 lines)
   - Route definition
   - Comprehensive Swagger docs

4. ✅ `prisma/migrations/20260202140000_add_last_active_at/migration.sql`
   - Add last_active_at field
   - Create index

### Modified Files
1. ✅ `prisma/schema.prisma`
   - Added `last_active_at DateTime?` to User model
   - Added index

2. ✅ `index.js`
   - Imported profileListingRoutes
   - Registered `/profiles` route

3. ✅ `src/controllers/authController.js`
   - Update `last_active_at` on login

---

## 🎯 Match Score Algorithm

Uses existing `calculateEnhancedMatchScore()` utility:

**Categories (Weighted):**
- Age: 15%
- Height: 10%
- Religion/Caste: 20%
- Education: 15%
- Occupation: 15%
- Income: 10%
- Location: 10%
- Lifestyle: 5%

**Hard Filters (Must Match):**
- Age range
- Marital status (if specified)

**Score Range:** 0-100

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Get profiles without filters (uses partner preferences)
- [ ] Pagination works (page=1&limit=20)
- [ ] Maximum limit enforced (100)
- [ ] Own profile excluded

### Filters
- [ ] Gender filter (opposite gender auto-applied)
- [ ] Age range filter (min_age, max_age)
- [ ] Location filters (state, city, work_state, work_city)
- [ ] Religion/Caste filters
- [ ] Height range filter
- [ ] Employment type filter
- [ ] Marital status filter

### Sorting
- [ ] Sort by newest (created_at DESC)
- [ ] Sort by last_active (last_active_at DESC)
- [ ] Sort by match_score (calculated and sorted)

### Match Score
- [ ] Match score calculated for each profile
- [ ] Scores range 0-100
- [ ] Sorting by match_score works correctly

### Search Logging
- [ ] Search logged to search_logs table
- [ ] Filters captured correctly (JSON)
- [ ] Result count accurate
- [ ] Execution time recorded
- [ ] IP and user_agent captured

### Performance
- [ ] Query execution < 500ms for 20 profiles
- [ ] Proper indexes used (EXPLAIN ANALYZE)
- [ ] No N+1 queries

### Edge Cases
- [ ] No profiles found (empty array)
- [ ] Invalid page/limit (400 error)
- [ ] Unauthenticated request (401 error)
- [ ] User with no partner preferences
- [ ] Profiles with incomplete data (nulls handled)

---

## 🔐 Authentication

**Required:** Bearer token in Authorization header

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token contains:**
- `userId` - Used to exclude own profile
- `role` - For authorization

---

## ⚡ Performance Optimizations

### Indexes
- ✅ `idx_users_profile_completion` (profile_completion_percentage)
- ✅ `idx_users_last_active` (last_active_at)
- ✅ `idx_users_profile_id` (profile_id)
- ✅ `idx_personal_details_height` (height_cm)
- ✅ `idx_personal_details_mother_tongue` (mother_tongue)
- ✅ `idx_horoscope_rasi` (rasi)
- ✅ `idx_horoscope_nakshatra` (nakshatra)

### Query Optimization
- Single query with joins (not N+1)
- Selective field fetching
- Prisma query optimization
- COUNT query in parallel

---

## 🔄 Future Enhancements (Not in Scope)

- [ ] Redis caching for popular searches
- [ ] Elasticsearch for full-text search
- [ ] Faceted search (count by filter options)
- [ ] Saved searches
- [ ] Search history
- [ ] Recently viewed profiles
- [ ] Profile recommendations (ML-based)

---

## 📞 Support

For issues or questions:
- Check Swagger docs: `http://localhost:3000/api-docs`
- Review logs: `logs/combined.log`
- Database queries: Check `search_logs` table

---

## ✅ Completion Checklist

- [x] Add last_active_at field to schema
- [x] Create migration for last_active_at
- [x] Create profile listing service
- [x] Create profile listing controller
- [x] Create profile routes with Swagger docs
- [x] Register routes in index.js
- [x] Update auth controller for last_active_at
- [x] Match score integration
- [x] Search logging implementation
- [x] Partner preference auto-fill
- [x] Comprehensive documentation

**Status:** ✅ **COMPLETE** - Ready for Testing
