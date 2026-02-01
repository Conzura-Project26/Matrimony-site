# Task 2.7: Partner Preferences CRUD - Implementation Summary

## 📋 Overview

Implemented a comprehensive partner preferences system with CRUD operations and an advanced weighted matching algorithm for the SARVVIVAH matrimonial platform.

**Implementation Date:** January 30, 2026  
**Status:** ✅ Complete

---

## 🎯 Features Implemented

### 1. **Partner Preferences CRUD**
- ✅ Create partner preferences (POST /users/:id/preferences)
- ✅ Update partner preferences (PUT /users/:id/preferences)
- ✅ Get partner preferences (GET /users/:id/preferences)
- ✅ Calculate match score (POST /users/:id/preferences/match/:targetId)

### 2. **Preference Fields**
- **Age Range**: min_age, max_age (18-100 years) - **Hard Filter**
- **Height Range**: min_height, max_height (120-250 cm) - **Soft Score (5%)**
- **Religion**: Array of religion IDs - **Scored (18%)**
- **Caste**: Array of caste IDs - **Scored (12%)**
- **Education**: Array of qualifications - **Scored (12%)**
- **Profession**: Array of occupations - **Scored (15%)**
- **Location**: Array of locations - **Scored (18%)**
- **Marital Status**: Array of acceptable statuses
- **Mother Tongue**: Array of languages
- **Income Range**: min and max income preferences
- **Diet Preference**: Array of acceptable diets
- **Drinking Habit**: Array of acceptable habits
- **Smoking Habit**: Array of acceptable habits

### 3. **Advanced Matching Algorithm**
- **Hard Filter**: Age range must match (fails immediately if outside range)
- **Weighted Scoring**: 
  - Religion: 18%
  - Location: 18%
  - Profession: 15%
  - Caste: 12%
  - Education: 12%
  - Height: 5% (soft scoring)
- **Open Preferences**: Unspecified preferences = "open to all" (full score)
- **Enhanced Mode**: Optional bonus scoring for additional attributes

---

## 📁 Files Created/Modified

### New Files
1. **src/utils/preferenceMatching.js** - Matching algorithm implementation
2. **src/tests/partnerPreferencesTest.js** - Comprehensive test suite
3. **prisma/migrations/20260130135422_update_partner_preferences_with_arrays/** - Database migration

### Modified Files
1. **prisma/schema.prisma** - Updated PartnerPreferences model
2. **src/utils/validation.js** - Added partnerPreferencesSchema
3. **src/controllers/profileController.js** - Added CRUD methods + matching
4. **src/routes/profile.js** - Added 4 new routes with Swagger docs
5. **prisma/seeds/permissionData.js** - Added 3 new permissions
6. **prisma/seeds/roleData.js** - Updated role-permission mappings

---

## 🗄️ Database Schema

```prisma
model PartnerPreferences {
  user_id                     String   @id @db.Uuid
  min_age                     Int?
  max_age                     Int?
  min_height                  Int?
  max_height                  Int?
  religion_preference         Int[]    @default([])
  caste_preference            Int[]    @default([])
  education_preference        String[] @default([])
  employment_type_preference  String[] @default([])
  location_preference         String[] @default([])
  marital_status_preference   String[] @default([])
  mother_tongue_preference    String[] @default([])
  income_preference_min       String?
  income_preference_max       String?
  diet_preference             String[] @default([])
  drinking_habit_preference   String[] @default([])
  smoking_habit_preference    String[] @default([])
  created_at                  DateTime @default(now())
  updated_at                  DateTime @default(now()) @updatedAt
  user                        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("partner_preferences")
}
```

---

## 🔐 Permissions

### New Permissions Added
- `create_own_partner_preferences` - USER, MODERATOR, ADMIN
- `edit_own_partner_preferences` - USER, MODERATOR, ADMIN
- `view_partner_preferences` - USER, MODERATOR, ADMIN (all users can view for matching)
- `manage_partner_preferences` - ADMIN only

---

## 🛣️ API Endpoints

### 1. Create Partner Preferences
```http
POST /api/users/:userId/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "min_age": 24,
  "max_age": 30,
  "min_height": 155,
  "max_height": 170,
  "religion_preference": [1, 2],
  "education_preference": ["Bachelor's Degree", "Master's Degree"],
  "location_preference": ["Mumbai", "Pune"],
  "marital_status_preference": ["Never Married"],
  "diet_preference": ["Vegetarian"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Partner preferences created successfully",
  "data": {
    "partner_preferences": { /* ... */ },
    "user": {
      "id": "uuid",
      "full_name": "User Name"
    }
  }
}
```

**Error (409):**
```json
{
  "success": false,
  "message": "Partner preferences already exist for this user. Use PUT /users/:userId/preferences to update."
}
```

### 2. Update Partner Preferences
```http
PUT /api/users/:userId/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "min_age": 25,
  "max_age": 32,
  "employment_type_preference": ["Government Job", "Private Job"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Partner preferences updated successfully",
  "data": {
    "partner_preferences": { /* updated fields */ }
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Partner preferences not found for this user. Use POST /users/:userId/preferences to create."
}
```

### 3. Get Partner Preferences
```http
GET /api/users/:userId/preferences
Authorization: Bearer <token>
```

**Response (200) - With Preferences:**
```json
{
  "success": true,
  "message": "Partner preferences retrieved successfully",
  "data": {
    "partner_preferences": {
      "user_id": "uuid",
      "min_age": 24,
      "max_age": 30,
      "religion_preference": [1, 2],
      /* ... all preferences */
    },
    "user": {
      "id": "uuid",
      "full_name": "User Name",
      "gender": "Male"
    }
  }
}
```

**Response (200) - No Preferences:**
```json
{
  "success": true,
  "message": "No partner preferences found for this user",
  "data": {
    "partner_preferences": {},
    "user": { /* ... */ }
  }
}
```

### 4. Calculate Match Score
```http
POST /api/users/:userId/preferences/match/:targetUserId?enhanced=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `enhanced` (boolean, optional): Use enhanced scoring with bonus attributes. Default: `false`

**Response (200) - Match Passed:**
```json
{
  "success": true,
  "message": "Match score calculated successfully",
  "data": {
    "match_result": {
      "match": true,
      "matchPercentage": 78,
      "totalScore": 62.5,
      "maxScore": 80,
      "breakdown": {
        "age": { "score": 0, "maxScore": 0, "status": "pass", "isHardFilter": true },
        "religion": { "score": 18, "maxScore": 18, "status": "match" },
        "caste": { "score": 0, "maxScore": 12, "status": "no-match" },
        "education": { "score": 12, "maxScore": 12, "status": "match" },
        "profession": { "score": 15, "maxScore": 15, "status": "match" },
        "location": { "score": 18, "maxScore": 18, "status": "match" },
        "height": { "score": 2.5, "maxScore": 5, "status": "match" }
      },
      "userAge": 27,
      "details": {
        "userReligionId": 1,
        "userCasteId": 5,
        "userEducation": "Bachelor's Degree",
        "userProfession": "Software Engineer",
        "userLocation": "Mumbai",
        "userHeight": 168
      }
    },
    "user": {
      "id": "uuid",
      "full_name": "Target User"
    }
  }
}
```

**Response (200) - Hard Filter Failed:**
```json
{
  "success": true,
  "message": "Match score calculated successfully",
  "data": {
    "match_result": {
      "match": false,
      "matchPercentage": 0,
      "totalScore": 0,
      "maxScore": 80,
      "breakdown": {
        "age": { "score": 0, "maxScore": 0, "status": "fail", "isHardFilter": true }
      },
      "failReason": "Age does not match hard filter criteria"
    }
  }
}
```

---

## 🧮 Matching Algorithm Details

### Scoring System

#### 1. **Hard Filter - Age Range**
- **Weight**: Pre-filter (not scored)
- **Logic**: If user's age is outside [min_age, max_age], match fails immediately
- **Result**: `match: false`, `matchPercentage: 0`

#### 2. **Religion Preference**
- **Weight**: 18%
- **Logic**: 
  - If `religion_preference` is empty → full score (18%)
  - If user's religion_id is in `religion_preference` array → full score (18%)
  - Otherwise → 0%

#### 3. **Caste Preference**
- **Weight**: 12%
- **Logic**: Same as religion (array matching)

#### 4. **Education Preference**
- **Weight**: 12%
- **Logic**: Matches against highest qualification from user's education_details

#### 5. **Profession Preference**
- **Weight**: 15%
- **Logic**: Matches against user's professional_details.occupation

#### 6. **Location Preference**
- **Weight**: 18%
- **Logic**: Matches against user's professional_details.work_location

#### 7. **Height Range (Soft Scoring)**
- **Weight**: 5%
- **Logic**:
  - Within range → 5%
  - Within 10cm of range → 2.5%
  - Otherwise → 0%

### Enhanced Scoring (Optional)
When `enhanced=true`, additional bonus scoring is applied:

- **Marital Status**: 5%
- **Mother Tongue**: 3%
- **Diet Preference**: 3%
- **Drinking Habit**: 2%
- **Smoking Habit**: 2%

**Total Enhanced Score**: Base (80%) + Bonus (15%) = 95% max

---

## ✅ Validation Rules

### Age Range
- Min: 18, Max: 100
- `min_age` must be < `max_age`
- No gap enforcement (can be 1 year or 50 years)

### Height Range
- Min: 120 cm, Max: 250 cm
- `min_height` must be < `max_height`

### Arrays
- All preference arrays support multiple values
- Empty arrays = "open to all"
- Religion/Caste IDs validated against database

### Enums
- Marital Status: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce", "Separated", "Annulled"]
- Diet: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan"]
- Drinking/Smoking: ["Never", "Occasionally", "Socially", "Regularly"]
- Income Range: ["Below 2 Lakhs", "2 - 5 Lakhs", ..., "Above 50 Lakhs"]

---

## 🔒 Authorization

### Create/Update Permissions
- **Users**: Can only create/update their own preferences
- **Admin**: Can create/update preferences for any user

### View Permissions
- **All authenticated users**: Can view any user's preferences (for matching purposes)
- This enables the matching algorithm to work across all users

### Resource Ownership
- Enforced via `checkOwnership` middleware
- Admin can bypass ownership checks

---

## 🧪 Testing

### Test Coverage (19 Test Cases)

**Create Tests (T2.7.1 - T2.7.5):**
- ✅ Create with valid age range
- ✅ Conflict detection for duplicates
- ✅ Invalid age range rejection
- ✅ Multiple values in arrays
- ✅ Invalid religion ID rejection

**Update Tests (T2.7.6 - T2.7.9):**
- ✅ Full update with new values
- ✅ Partial update support
- ✅ 404 for non-existent user
- ✅ Height preferences update

**Get Tests (T2.7.10 - T2.7.12):**
- ✅ Retrieve existing preferences
- ✅ Empty object for no preferences
- ✅ Other users can view (for matching)

**Matching Tests (T2.7.13 - T2.7.16):**
- ✅ Calculate match score
- ✅ Detailed category breakdown
- ✅ Enhanced scoring mode
- ✅ Hard filter age blocking

**Validation Tests (T2.7.17 - T2.7.19):**
- ✅ Unauthorized without token
- ✅ Field length validation
- ✅ Enum value validation

### Running Tests
```bash
cd Backend
npm test src/tests/partnerPreferencesTest.js
```

---

## 📊 Profile Completion Integration

Partner preferences contribute **5%** to overall profile completion:

```javascript
// In userProfileController.js - calculateProfileCompletion()
if (user.partner_preferences) {
  sections.preferences = 5; // 5% of total profile
}
```

---

## 🚀 Usage Examples

### Example 1: Create Preferences (Open to All)
```javascript
// User wants flexibility, no specific requirements
POST /api/users/123/preferences
{
  "min_age": 22,
  "max_age": 35
}
// All other preferences empty = "open to all"
// Will match with anyone in age range
```

### Example 2: Create Preferences (Specific)
```javascript
// User has specific requirements
POST /api/users/123/preferences
{
  "min_age": 25,
  "max_age": 32,
  "min_height": 160,
  "max_height": 175,
  "religion_preference": [1],           // Hindu only
  "caste_preference": [3, 5, 8],        // Specific castes
  "education_preference": ["Bachelor's Degree", "Master's Degree"],
  "location_preference": ["Mumbai", "Pune", "Bangalore"],
  "marital_status_preference": ["Never Married"],
  "diet_preference": ["Vegetarian", "Vegan"]
}
```

### Example 3: Calculate Match
```javascript
// Check how well user B matches user A's preferences
POST /api/users/A123/preferences/match/B456

// Response shows:
// - Overall match: 85%
// - Breakdown: Religion 18/18, Caste 12/12, Education 12/12, etc.
// - Details: What matched, what didn't
```

### Example 4: Enhanced Match (with Bonus)
```javascript
POST /api/users/A123/preferences/match/B456?enhanced=true

// Includes bonus scoring:
// - Base score: 80%
// - Bonus for marital status, mother tongue, diet, habits
// - Total max: 95%
```

---

## 🎨 Swagger Documentation

All endpoints are fully documented with Swagger annotations including:
- Request/response schemas
- Parameter descriptions
- Example payloads
- Error responses
- Authorization requirements

Access at: `http://localhost:3000/api-docs`

---

## 🔧 Future Enhancements

1. **Smart Matching Queue**
   - Background job to pre-calculate match scores
   - Cache match results for performance

2. **Match Recommendations**
   - Endpoint to get top N matches for a user
   - Sorted by match percentage

3. **Preference Analytics**
   - Track which preferences are most common
   - Help users optimize their preferences

4. **Flexible Matching**
   - Add "must-have" vs "nice-to-have" preference flags
   - Weight preferences differently per user

5. **Location Intelligence**
   - Match similar locations (e.g., nearby cities)
   - Distance-based scoring

---

## 📝 Notes

### Design Decisions

1. **Arrays vs Comma-Separated Strings**
   - Chose arrays for better query performance
   - Easier validation and manipulation
   - Type safety in TypeScript/frontend

2. **Religion/Caste by ID**
   - References master data tables
   - Prevents inconsistencies
   - Enables easy filtering

3. **Open Preferences = Full Score**
   - User-friendly approach
   - Encourages profile creation
   - Doesn't penalize flexibility

4. **Hard Filter on Age**
   - Industry standard
   - Most critical filter
   - Prevents wasted match calculations

5. **Soft Scoring on Height**
   - Less critical than other factors
   - Allows close matches (±10cm)
   - Only 5% weight

---

## ✨ Conclusion

Task 2.7 is fully implemented with:
- ✅ Complete CRUD operations
- ✅ Advanced weighted matching algorithm
- ✅ Comprehensive validation
- ✅ Proper authorization
- ✅ Full Swagger documentation
- ✅ Extensive test coverage
- ✅ Database migration
- ✅ Permission system integration

The system is production-ready and follows all existing patterns in the codebase.

---

**Implementation By:** GitHub Copilot  
**Date:** January 30, 2026  
**Version:** 1.0
