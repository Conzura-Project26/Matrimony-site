# Task 3.1: Profile Listing - Testing Guide

## 🧪 Testing Overview

**Endpoint:** `GET /profiles`  
**Authentication:** Required  
**Base URL:** `http://localhost:3000`

---

## 🔧 Setup

### 1. Run Database Migration
```bash
cd Backend
npx prisma migrate deploy
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Start Server
```bash
npm start
```

### 4. Get Authentication Token
```bash
# Login to get token
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "identifier": "9876543210",
  "password": "YourPassword@123"
}

# Copy accessToken from response
```

---

## 📝 Test Cases

### Test 1: Basic Profile Listing (Default)

**Request:**
```bash
GET http://localhost:3000/profiles
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Returns 20 profiles (default limit)
- ✅ Page 1 of results
- ✅ Own profile excluded
- ✅ All profiles have completion >= 60%
- ✅ All profiles have at least one approved photo
- ✅ Match scores included (0-100)

**Validation:**
```javascript
{
  "success": true,
  "data": {
    "profiles": [], // Array of 0-20 profiles
    "pagination": {
      "total": number,
      "page": 1,
      "limit": 20,
      "totalPages": number
    },
    "filters_applied": {},
    "execution_time_ms": number
  }
}
```

---

### Test 2: Pagination

**Request:**
```bash
GET http://localhost:3000/profiles?page=2&limit=10
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Returns 10 profiles
- ✅ Page 2 of results
- ✅ pagination.page === 2
- ✅ pagination.limit === 10

---

### Test 3: Maximum Limit Enforcement

**Request:**
```bash
GET http://localhost:3000/profiles?limit=200
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Returns max 100 profiles (not 200)
- ✅ pagination.limit === 100

---

### Test 4: Age Range Filter

**Request:**
```bash
GET http://localhost:3000/profiles?min_age=25&max_age=35
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles have age between 25-35
- ✅ Age calculated from date_of_birth
- ✅ filters_applied.min_age === 25
- ✅ filters_applied.max_age === 35

**Validation:**
```javascript
// Check each profile
profiles.forEach(profile => {
  assert(profile.age >= 25 && profile.age <= 35);
});
```

---

### Test 5: Gender Filter

**Request:**
```bash
GET http://localhost:3000/profiles?gender=FEMALE
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles have gender === "FEMALE"
- ✅ filters_applied.gender === "FEMALE"

---

### Test 6: Location Filter (State)

**Request:**
```bash
GET http://localhost:3000/profiles?state=Maharashtra
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Profiles with state === "Maharashtra" (living OR work)
- ✅ OR-match logic: personal.state OR professional.work_state

**Validation:**
```javascript
// Each profile should match at least one
profiles.forEach(profile => {
  assert(
    profile.state === 'Maharashtra' || 
    profile.work_state === 'Maharashtra'
  );
});
```

---

### Test 7: Location Filter (City)

**Request:**
```bash
GET http://localhost:3000/profiles?city=Mumbai
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Profiles with city === "Mumbai" (living OR work)
- ✅ OR-match logic: personal.city OR professional.work_city

---

### Test 8: Combined Filters (Age + Location)

**Request:**
```bash
GET http://localhost:3000/profiles?min_age=25&max_age=35&state=Maharashtra&city=Mumbai
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All filters applied (AND logic)
- ✅ Age between 25-35
- ✅ Location in Maharashtra (state OR work_state)
- ✅ City in Mumbai (city OR work_city)

---

### Test 9: Sort by Newest

**Request:**
```bash
GET http://localhost:3000/profiles?sort_by=newest
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Profiles sorted by created_at DESC
- ✅ First profile is newest (most recent created_at)

**Validation:**
```javascript
// Check descending order
for (let i = 0; i < profiles.length - 1; i++) {
  const current = new Date(profiles[i].created_at);
  const next = new Date(profiles[i + 1].created_at);
  assert(current >= next);
}
```

---

### Test 10: Sort by Last Active

**Request:**
```bash
GET http://localhost:3000/profiles?sort_by=last_active
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Profiles sorted by last_active_at DESC
- ✅ First profile is most recently active

**Validation:**
```javascript
// Check descending order
for (let i = 0; i < profiles.length - 1; i++) {
  const current = new Date(profiles[i].last_active_at || profiles[i].created_at);
  const next = new Date(profiles[i + 1].last_active_at || profiles[i + 1].created_at);
  assert(current >= next);
}
```

---

### Test 11: Sort by Match Score

**Request:**
```bash
GET http://localhost:3000/profiles?sort_by=match_score
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Profiles sorted by match_score DESC
- ✅ First profile has highest match_score
- ✅ All profiles have match_score between 0-100

**Validation:**
```javascript
// Check descending order
for (let i = 0; i < profiles.length - 1; i++) {
  assert(profiles[i].match_score >= profiles[i + 1].match_score);
  assert(profiles[i].match_score >= 0 && profiles[i].match_score <= 100);
}
```

---

### Test 12: Height Range Filter

**Request:**
```bash
GET http://localhost:3000/profiles?min_height=160&max_height=180
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles have height_cm between 160-180 (or null)

---

### Test 13: Marital Status Filter

**Request:**
```bash
GET http://localhost:3000/profiles?marital_status=Never%20Married
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles have marital_status === "Never Married"

---

### Test 14: Employment Type Filter

**Request:**
```bash
GET http://localhost:3000/profiles?employment_type=Salaried%20-%20Private
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles have employment_type === "Salaried - Private"

---

### Test 15: Religion Filter

**Request:**
```bash
GET http://localhost:3000/profiles?religion_id=1
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles belong to religion_id === 1

---

### Test 16: Caste Filter

**Request:**
```bash
GET http://localhost:3000/profiles?caste_id=5
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles belong to caste_id === 5

---

### Test 17: Qualification Filter

**Request:**
```bash
GET http://localhost:3000/profiles?qualification=B.Tech
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ All profiles have qualification containing "B.Tech" (case-insensitive)

---

### Test 18: No Results

**Request:**
```bash
GET http://localhost:3000/profiles?min_age=90&max_age=100
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Returns empty array
- ✅ success === true
- ✅ pagination.total === 0
- ✅ pagination.totalPages === 0

---

### Test 19: Invalid Pagination (Negative Page)

**Request:**
```bash
GET http://localhost:3000/profiles?page=-1
Authorization: Bearer <your_token>
```

**Expected:**
- ❌ Returns 400 Bad Request
- ❌ Error message: "Page and limit must be positive integers"

---

### Test 20: Invalid Pagination (Zero Limit)

**Request:**
```bash
GET http://localhost:3000/profiles?limit=0
Authorization: Bearer <your_token>
```

**Expected:**
- ❌ Returns 400 Bad Request
- ❌ Error message: "Page and limit must be positive integers"

---

### Test 21: Unauthenticated Request

**Request:**
```bash
GET http://localhost:3000/profiles
# No Authorization header
```

**Expected:**
- ❌ Returns 401 Unauthorized
- ❌ Error message: "Access token required. Please login."

---

### Test 22: Expired Token

**Request:**
```bash
GET http://localhost:3000/profiles
Authorization: Bearer <expired_token>
```

**Expected:**
- ❌ Returns 401 Unauthorized
- ❌ Error message: "Token expired. Please login again."

---

### Test 23: Own Profile Excluded

**Request:**
```bash
GET http://localhost:3000/profiles
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ Own profile NOT in results
- ✅ Verify by checking profile IDs

**Validation:**
```javascript
// Decode token to get userId
const decoded = jwt.decode(token);
const myUserId = decoded.userId;

// Check profiles don't include my ID
profiles.forEach(profile => {
  assert(profile.id !== myUserId);
});
```

---

### Test 24: Search Logging

**After Test 1, check database:**

```sql
SELECT * FROM search_logs 
ORDER BY searched_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ New entry in search_logs table
- ✅ user_id matches your user ID
- ✅ search_filters is valid JSON
- ✅ result_count matches total from response
- ✅ execution_time_ms > 0
- ✅ ip_address captured
- ✅ user_agent captured

---

### Test 25: Last Active Tracking

**Steps:**
1. Login with account A (note last_active_at is null)
2. Query /profiles with account B
3. Check if account A appears in results
4. Verify account A now has last_active_at timestamp

**SQL Check:**
```sql
SELECT id, full_name, last_active_at 
FROM users 
WHERE mobile_number = '9876543210';
```

**Expected:**
- ✅ last_active_at updated after login
- ✅ timestamp matches login time

---

## 🔍 Database Verification

### Check Profile Completion Cache

```sql
-- Verify all profiles have completion >= 60%
SELECT COUNT(*) 
FROM users 
WHERE profile_completion_percentage < 60;
-- Should be 0 in results
```

### Check Approved Photos

```sql
-- Verify profiles have approved photos
SELECT u.id, u.full_name, COUNT(p.id) as photo_count
FROM users u
LEFT JOIN user_photos p ON u.id = p.user_id AND p.is_approved = true
GROUP BY u.id, u.full_name
HAVING COUNT(p.id) = 0;
-- Should not appear in /profiles results
```

### Check Search Logs

```sql
-- View recent searches
SELECT 
  user_id, 
  search_filters, 
  result_count, 
  execution_time_ms,
  searched_at
FROM search_logs
ORDER BY searched_at DESC
LIMIT 10;
```

---

## 📊 Performance Testing

### Test 26: Response Time (20 profiles)

**Request:**
```bash
GET http://localhost:3000/profiles?limit=20
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ execution_time_ms < 500ms
- ✅ Total response time < 1000ms

### Test 27: Response Time (100 profiles)

**Request:**
```bash
GET http://localhost:3000/profiles?limit=100
Authorization: Bearer <your_token>
```

**Expected:**
- ✅ execution_time_ms < 1000ms
- ✅ Total response time < 2000ms

### Test 28: Response Time (Match Score Sorting)

**Request:**
```bash
GET http://localhost:3000/profiles?sort_by=match_score&limit=20
Authorization: Bearer <your_token>
```

**Expected:**
- ⚠️ May be slower (match score calculated in-memory)
- ✅ execution_time_ms < 2000ms

---

## 🔄 Integration Testing with Postman

### Collection Setup

1. Create "Profile Listing" collection
2. Add environment variable: `{{baseUrl}}` = `http://localhost:3000`
3. Add environment variable: `{{token}}` = `<your_access_token>`

### Test Scripts

Add to each request's "Tests" tab:

```javascript
// Test 1: Status Code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test 2: Response Structure
pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data).to.have.property('profiles');
    pm.expect(jsonData.data).to.have.property('pagination');
});

// Test 3: Pagination
pm.test("Pagination is correct", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.pagination).to.have.property('total');
    pm.expect(jsonData.data.pagination).to.have.property('page');
    pm.expect(jsonData.data.pagination).to.have.property('limit');
    pm.expect(jsonData.data.pagination).to.have.property('totalPages');
});

// Test 4: Profile Structure
pm.test("Profiles have required fields", function () {
    const jsonData = pm.response.json();
    if (jsonData.data.profiles.length > 0) {
        const profile = jsonData.data.profiles[0];
        pm.expect(profile).to.have.property('profile_id');
        pm.expect(profile).to.have.property('full_name');
        pm.expect(profile).to.have.property('age');
        pm.expect(profile).to.have.property('gender');
        pm.expect(profile).to.have.property('match_score');
    }
});

// Test 5: Match Score Range
pm.test("Match scores are valid", function () {
    const jsonData = pm.response.json();
    jsonData.data.profiles.forEach(profile => {
        pm.expect(profile.match_score).to.be.at.least(0);
        pm.expect(profile.match_score).to.be.at.most(100);
    });
});

// Test 6: Response Time
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

## 🐛 Bug Reporting Template

```markdown
**Bug Title:** [Brief description]

**Severity:** High / Medium / Low

**Test Case:** [Test number from above]

**Steps to Reproduce:**
1. Login with user X
2. Send GET /profiles?param=value
3. Observe incorrect behavior

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Request:**
```bash
GET http://localhost:3000/profiles?...
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": false,
  "message": "Error message"
}
```

**Environment:**
- Node.js version: 20.x
- Database: PostgreSQL 16
- OS: Windows/Mac/Linux

**Additional Context:**
[Screenshots, logs, etc.]
```

---

## ✅ Testing Checklist

### Functionality
- [ ] Basic profile listing works
- [ ] Pagination works (page, limit)
- [ ] Max limit enforced (100)
- [ ] Own profile excluded
- [ ] Age range filter works
- [ ] Gender filter works
- [ ] Location filters work (state, city)
- [ ] OR-match for locations works
- [ ] Work location type filter works
- [ ] Religion/Caste filters work
- [ ] Height range filter works
- [ ] Marital status filter works
- [ ] Employment type filter works
- [ ] Income range filter works
- [ ] Qualification filter works
- [ ] Sort by newest works
- [ ] Sort by last_active works
- [ ] Sort by match_score works
- [ ] Match scores calculated correctly
- [ ] Match scores in valid range (0-100)
- [ ] Multiple filters combine correctly (AND)
- [ ] No results handled gracefully
- [ ] Search logged to database
- [ ] Last active timestamp updated on login

### Error Handling
- [ ] Invalid pagination (400 error)
- [ ] Unauthenticated request (401 error)
- [ ] Expired token (401 error)
- [ ] Invalid token (401 error)

### Performance
- [ ] Response time < 500ms (20 profiles)
- [ ] Response time < 1000ms (100 profiles)
- [ ] Database indexes used
- [ ] No N+1 queries
- [ ] execution_time_ms tracked

### Data Validation
- [ ] Only active users returned
- [ ] Only profiles with >= 60% completion
- [ ] Only profiles with approved photos
- [ ] All fields populated correctly
- [ ] Null values handled gracefully
- [ ] Age calculated correctly
- [ ] Photo count accurate
- [ ] Primary photo selected correctly

### Documentation
- [ ] Swagger docs accessible
- [ ] All parameters documented
- [ ] Examples provided
- [ ] Error responses documented

---

## 📞 Support

**Issues:** Report bugs with template above  
**Questions:** Check documentation first  
**Performance:** Monitor logs/database  

---

**End of Testing Guide**
