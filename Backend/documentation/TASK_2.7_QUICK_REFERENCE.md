# Partner Preferences API - Quick Reference

## 🚀 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/:userId/preferences` | Create partner preferences |
| PUT | `/api/users/:userId/preferences` | Update partner preferences |
| GET | `/api/users/:userId/preferences` | Get partner preferences |
| POST | `/api/users/:userId/preferences/match/:targetUserId` | Calculate match score |

---

## 📝 Request Examples

### Create Preferences
```bash
curl -X POST http://localhost:3000/api/users/USER_ID/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "min_age": 24,
    "max_age": 30,
    "min_height": 155,
    "max_height": 170,
    "religion_preference": [1, 2],
    "education_preference": ["Bachelors Degree", "Masters Degree"],
    "location_preference": ["Mumbai", "Pune"],
    "marital_status_preference": ["Never Married"],
    "diet_preference": ["Vegetarian"]
  }'
```

### Update Preferences
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employment_type_preference": ["Government Job", "Private Job"]
  }'
```

### Get Preferences
```bash
curl -X GET http://localhost:3000/api/users/USER_ID/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Calculate Match
```bash
# Basic match
curl -X POST http://localhost:3000/api/users/USER_ID/preferences/match/TARGET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enhanced match (with bonus scoring)
curl -X POST "http://localhost:3000/api/users/USER_ID/preferences/match/TARGET_ID?enhanced=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Matching Algorithm

### Scoring Breakdown

| Category | Weight | Type | Logic |
|----------|--------|------|-------|
| Age | N/A | Hard Filter | Must match or fails |
| Religion | 18% | Scored | Array match |
| Location | 18% | Scored | Array match |
| Profession | 15% | Scored | Array match |
| Caste | 12% | Scored | Array match |
| Education | 12% | Scored | Array match |
| Height | 5% | Soft Scored | Range match (±10cm buffer) |
| **Total Base** | **80%** | | |

### Bonus Categories (Enhanced Mode)
| Category | Weight |
|----------|--------|
| Marital Status | 5% |
| Mother Tongue | 3% |
| Diet | 3% |
| Drinking | 2% |
| Smoking | 2% |
| **Total Bonus** | **15%** |
| **Grand Total** | **95%** |

### How It Works

1. **Age Check (Hard Filter)**
   - If target age ∉ [min_age, max_age] → Match fails (0%)
   - If passes → Continue to scoring

2. **Scored Categories**
   - Empty preference = "Open to all" → Full score
   - Value in preference array → Full score
   - Value not in array → 0 score

3. **Height (Soft Score)**
   - In range → 5%
   - Within 10cm → 2.5%
   - Outside → 0%

4. **Final Score**
   - Sum all category scores
   - Divide by max possible score
   - Convert to percentage (0-100%)

---

## 🔑 Field Reference

### Numeric Ranges
```json
{
  "min_age": 18-100,        // Required min < max
  "max_age": 18-100,
  "min_height": 120-250,    // cm, Required min < max
  "max_height": 120-250     // cm
}
```

### ID Arrays (References Master Data)
```json
{
  "religion_preference": [1, 2, 3],  // Religion IDs
  "caste_preference": [5, 8, 12]     // Caste IDs
}
```

### String Arrays
```json
{
  "education_preference": ["Bachelor's Degree", "Master's Degree"],
  "employment_type_preference": ["Government Job", "Private Job", "Business"],
  "location_preference": ["Mumbai", "Pune", "Delhi"],
  "mother_tongue_preference": ["Hindi", "English"]
}
```

### Enum Arrays
```json
{
  "marital_status_preference": [
    "Never Married",
    "Divorced",
    "Widowed",
    "Awaiting Divorce",
    "Separated",
    "Annulled"
  ],
  "diet_preference": [
    "Vegetarian",
    "Non-Vegetarian",
    "Eggetarian",
    "Vegan"
  ],
  "drinking_habit_preference": [
    "Never",
    "Occasionally",
    "Socially",
    "Regularly"
  ],
  "smoking_habit_preference": [
    "Never",
    "Occasionally",
    "Socially",
    "Regularly"
  ]
}
```

### Income Range
```json
{
  "income_preference_min": "5 - 10 Lakhs",
  "income_preference_max": "20 - 30 Lakhs"
}
```

**Valid Values:**
- "Below 2 Lakhs"
- "2 - 5 Lakhs"
- "5 - 10 Lakhs"
- "10 - 15 Lakhs"
- "15 - 20 Lakhs"
- "20 - 30 Lakhs"
- "30 - 50 Lakhs"
- "Above 50 Lakhs"

---

## ⚠️ Common Errors

### 409 Conflict
```json
{
  "success": false,
  "message": "Partner preferences already exist for this user. Use PUT /users/:userId/preferences to update."
}
```
**Solution:** Use PUT instead of POST to update existing preferences.

### 404 Not Found
```json
{
  "success": false,
  "message": "Partner preferences not found for this user. Use POST /users/:userId/preferences to create."
}
```
**Solution:** Use POST to create preferences first.

### 400 Bad Request - Age Validation
```json
{
  "success": false,
  "message": "Minimum age must be less than maximum age"
}
```
**Solution:** Ensure min_age < max_age.

### 400 Bad Request - Invalid Religion ID
```json
{
  "success": false,
  "message": "One or more religion IDs are invalid"
}
```
**Solution:** Use valid religion IDs from master data. Get list via `/api/master-data/religions`.

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```
**Solution:** Include valid Bearer token in Authorization header.

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to modify this user's partner preferences"
}
```
**Solution:** Users can only modify their own preferences (unless Admin).

---

## 💡 Pro Tips

### 1. Flexible Preferences
Leave fields empty for "open to all":
```json
{
  "min_age": 24,
  "max_age": 30
  // All other fields empty = open to all
}
```

### 2. Multiple Values
Use arrays for OR logic:
```json
{
  "religion_preference": [1, 2],  // Hindu OR Islam
  "location_preference": ["Mumbai", "Pune", "Bangalore"]
}
```

### 3. Matching Workflow
```
1. User A creates preferences
2. Search for potential matches
3. For each potential match:
   POST /users/A/preferences/match/B
4. Sort by matchPercentage
5. Display top matches to user
```

### 4. Enhanced Mode
Use enhanced=true for detailed matching:
```bash
# Includes bonus scoring for lifestyle attributes
?enhanced=true
```

### 5. Understanding Match Results
```json
{
  "match": true,                    // Passed hard filter
  "matchPercentage": 78,            // Overall compatibility
  "breakdown": {
    "age": { "status": "pass" },    // Passed hard filter
    "religion": { 
      "score": 18,                  // Full score (18/18)
      "status": "match" 
    },
    "caste": { 
      "score": 0,                   // No match (0/12)
      "status": "no-match" 
    }
  }
}
```

---

## 🔗 Related Endpoints

- **Get Religions:** `GET /api/master-data/religions`
- **Get Castes:** `GET /api/master-data/religions/:id/castes`
- **Get User Profile:** `GET /api/users/:id/profile`

---

## 📚 Documentation

- **Full Summary:** [TASK_2.7_PARTNER_PREFERENCES_SUMMARY.md](./TASK_2.7_PARTNER_PREFERENCES_SUMMARY.md)
- **Swagger UI:** http://localhost:3000/api-docs
- **Test File:** [src/tests/partnerPreferencesTest.js](../src/tests/partnerPreferencesTest.js)

---

**Last Updated:** January 30, 2026
