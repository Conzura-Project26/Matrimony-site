# Education Details CRUD - Postman Testing Guide

## 🔧 Setup Instructions

### Step 1: Create Postman Environment Variables

Create a new environment in Postman with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000` | Base API URL |
| `access_token` | `your_jwt_token_here` | JWT token from login |
| `user_id` | `your_user_uuid_here` | Your user UUID |
| `edu_id_1` | `` | Will be set after first creation |
| `edu_id_2` | `` | Will be set after second creation |

### Step 2: Get Your JWT Token

**Endpoint**: POST `{{base_url}}/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "identifier": "9876543210",
  "password": "YourPassword@123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

**Action**: 
1. Copy `access_token` value
2. Paste it in your Postman environment variable `access_token`
3. Copy `user_id` value
4. Paste it in your Postman environment variable `user_id`

---

## 📝 ENDPOINT 1: CREATE EDUCATION ENTRY

### Test 1.1: ✅ Create First Education (Bachelor's Degree)

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Bachelor of Engineering in Computer Science",
  "institution_name": "Anna University, Chennai",
  "year_of_passing": 2020
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Education entry created successfully",
  "data": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "highest_qualification": "Bachelor of Engineering in Computer Science",
    "institution_name": "Anna University, Chennai",
    "year_of_passing": 2020
  }
}
```

**Action**: Save the `id` value to `{{edu_id_1}}` environment variable

---

### Test 1.2: ✅ Create Second Education (Master's Degree)

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Master of Technology in Artificial Intelligence",
  "institution_name": "IIT Madras",
  "year_of_passing": 2022
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Education entry created successfully",
  "data": {
    "id": 2,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "highest_qualification": "Master of Technology in Artificial Intelligence",
    "institution_name": "IIT Madras",
    "year_of_passing": 2022
  }
}
```

**Action**: Save the `id` value to `{{edu_id_2}}` environment variable

---

### Test 1.3: ✅ Create Third Education (PhD)

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Doctor of Philosophy in Machine Learning",
  "institution_name": "Indian Institute of Science, Bangalore",
  "year_of_passing": 2025
}
```

**Expected Response** (201 Created)

---

### Test 1.4: ❌ Missing Required Field (institution_name)

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "MBA",
  "year_of_passing": 2023
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Required"
}
```

---

### Test 1.5: ❌ Invalid Year (Too Old)

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "High School",
  "institution_name": "ABC School",
  "year_of_passing": 2005
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Year of passing cannot be before 2012 (15 years after birth year 1997)"
}
```

**Note**: The exact message depends on your user's birth year.

---

### Test 1.6: ❌ Invalid Year (Too Future)

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Future Degree",
  "institution_name": "Future University",
  "year_of_passing": 2040
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Year of passing cannot be after 2031 (current year + 5)"
}
```

---

### Test 1.7: ❌ Duplicate Entry

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Bachelor of Engineering in Computer Science",
  "institution_name": "Anna University, Chennai",
  "year_of_passing": 2020
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Duplicate education entry. This qualification, institution, and year combination already exists."
}
```

---

### Test 1.8: ❌ Institution Name Too Short

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "MBA",
  "institution_name": "AB",
  "year_of_passing": 2021
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Institution name must be at least 3 characters"
}
```

---

### Test 1.9: ❌ Missing Authentication Token

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
```
**NO Authorization header**

**Body** (raw JSON):
```json
{
  "highest_qualification": "Test Degree",
  "institution_name": "Test University",
  "year_of_passing": 2021
}
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Access token is required"
}
```

---

### Test 1.10: ❌ Create 6th Entry (Exceeds Max Limit)

**Prerequisite**: First create 5 education entries

**Method**: `POST`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Sixth Degree",
  "institution_name": "Some University",
  "year_of_passing": 2023
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Maximum 5 education entries allowed per user"
}
```

---

## 📝 ENDPOINT 2: UPDATE EDUCATION ENTRY

### Test 2.1: ✅ Update Only Qualification (Partial Update)

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_1}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Bachelor of Technology in Computer Science"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Education entry updated successfully",
  "data": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "highest_qualification": "Bachelor of Technology in Computer Science",
    "institution_name": "Anna University, Chennai",
    "year_of_passing": 2020
  }
}
```

---

### Test 2.2: ✅ Update Only Institution (Partial Update)

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_1}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "institution_name": "Anna University - Main Campus, Chennai"
}
```

**Expected Response** (200 OK)

---

### Test 2.3: ✅ Update Only Year (Partial Update)

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_1}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "year_of_passing": 2021
}
```

**Expected Response** (200 OK)

---

### Test 2.4: ✅ Update All Fields

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_1}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "B.Tech Computer Science & Engineering",
  "institution_name": "Anna University, Chennai - Main Campus",
  "year_of_passing": 2020
}
```

**Expected Response** (200 OK)

---

### Test 2.5: ❌ Update with Empty Body

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_1}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "At least one field is required to update education details"
}
```

---

### Test 2.6: ❌ Update to Create Duplicate

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_2}}`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Bachelor of Engineering in Computer Science",
  "institution_name": "Anna University, Chennai",
  "year_of_passing": 2020
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Duplicate education entry. This qualification, institution, and year combination already exists."
}
```

---

### Test 2.7: ❌ Update Non-Existent Entry

**Method**: `PUT`  
**URL**: `{{base_url}}/users/{{user_id}}/education/99999`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Body** (raw JSON):
```json
{
  "highest_qualification": "Test"
}
```

**Expected Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Education entry not found"
}
```

---

## 📝 ENDPOINT 3: DELETE EDUCATION ENTRY

### Test 3.1: ✅ Delete Education Entry

**Method**: `DELETE`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_2}}`

**Headers**:
```
Authorization: Bearer {{access_token}}
```

**No Body Required**

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Education entry deleted successfully"
}
```

---

### Test 3.2: ❌ Delete Non-Existent Entry

**Method**: `DELETE`  
**URL**: `{{base_url}}/users/{{user_id}}/education/99999`

**Headers**:
```
Authorization: Bearer {{access_token}}
```

**Expected Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Education entry not found"
}
```

---

### Test 3.3: ❌ Delete Without Authentication

**Method**: `DELETE`  
**URL**: `{{base_url}}/users/{{user_id}}/education/{{edu_id_1}}`

**Headers**: *None*

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Access token is required"
}
```

---

## 📝 ENDPOINT 4: GET ALL EDUCATION ENTRIES

### Test 4.1: ✅ Get All Education Entries (Public Access)

**Method**: `GET`  
**URL**: `{{base_url}}/users/{{user_id}}/education`

**Headers**: *None (No authentication required)*

**No Body Required**

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 2,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "highest_qualification": "Master of Technology in Artificial Intelligence",
      "institution_name": "IIT Madras",
      "year_of_passing": 2022
    },
    {
      "id": 1,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "highest_qualification": "Bachelor of Engineering in Computer Science",
      "institution_name": "Anna University, Chennai",
      "year_of_passing": 2020
    }
  ]
}
```

**Note**: Entries are sorted by `year_of_passing` DESC (most recent first)

---

### Test 4.2: ✅ Get Education for User with No Entries

**Method**: `GET`  
**URL**: `{{base_url}}/users/NEW_USER_ID_WITH_NO_EDUCATION/education`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

---

### Test 4.3: ❌ Get Education for Non-Existent User

**Method**: `GET`  
**URL**: `{{base_url}}/users/00000000-0000-0000-0000-000000000000/education`

**Expected Response** (404 Not Found):
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 📝 BONUS: PROFILE COMPLETION CHECK

### Test 5.1: Check Profile Completion with Education

**Method**: `GET`  
**URL**: `{{base_url}}/users/{{user_id}}/profile-completion`

**Headers**:
```
Authorization: Bearer {{access_token}}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "percentage": 47,
    "sections": {
      "basic": 20,
      "personal": 15,
      "caste": 6,
      "education": 10,
      "professional": 0,
      "family": 0,
      "horoscope": 0,
      "photos": 0,
      "preferences": 0
    },
    "status": "In Progress",
    "next_steps": [
      "Add professional details",
      "Upload at least one photo",
      "Add family details"
    ]
  }
}
```

**Education Scoring**:
- No education: 0%
- 1 full entry: 7%
- 2+ full entries: 10%

---

## 🎯 TESTING FLOW RECOMMENDATION

### Step-by-Step Testing Order:

1. **Setup** (5 minutes)
   - [ ] Create Postman environment
   - [ ] Login and get JWT token
   - [ ] Set environment variables

2. **CREATE Tests** (10 minutes)
   - [ ] Test 1.1: Create first education (save ID)
   - [ ] Test 1.2: Create second education (save ID)
   - [ ] Test 1.3: Create third education
   - [ ] Test 1.4: Missing field validation
   - [ ] Test 1.5: Invalid year (too old)
   - [ ] Test 1.6: Invalid year (too future)
   - [ ] Test 1.7: Duplicate prevention
   - [ ] Test 1.8: Institution name validation
   - [ ] Test 1.9: No auth error
   - [ ] Test 1.10: Max 5 entries (create 2 more first)

3. **GET Tests** (3 minutes)
   - [ ] Test 4.1: Get all entries (verify sorting)
   - [ ] Test 4.2: Empty array for new user
   - [ ] Test 4.3: Non-existent user error

4. **UPDATE Tests** (10 minutes)
   - [ ] Test 2.1: Partial update (qualification only)
   - [ ] Test 2.2: Partial update (institution only)
   - [ ] Test 2.3: Partial update (year only)
   - [ ] Test 2.4: Full update (all fields)
   - [ ] Test 2.5: Empty body error
   - [ ] Test 2.6: Duplicate prevention on update
   - [ ] Test 2.7: Non-existent entry error

5. **DELETE Tests** (5 minutes)
   - [ ] Test 3.1: Delete entry
   - [ ] Test 3.2: Non-existent entry error
   - [ ] Test 3.3: No auth error

6. **Profile Completion** (2 minutes)
   - [ ] Test 5.1: Verify education scoring

---

## 📊 EXPECTED RESULTS SUMMARY

| Test Type | Total Tests | Expected Pass | Expected Fail |
|-----------|-------------|---------------|---------------|
| CREATE | 10 | 3 | 7 |
| UPDATE | 7 | 4 | 3 |
| DELETE | 3 | 1 | 2 |
| GET | 3 | 2 | 1 |
| **TOTAL** | **23** | **10** | **13** |

---

## 🔍 VERIFICATION CHECKLIST

After testing, verify:

- [ ] All 3 education entries created successfully
- [ ] Entries sorted by year DESC in GET response
- [ ] Duplicate entries prevented
- [ ] Max 5 entries enforced
- [ ] Partial updates working
- [ ] Year validation working (birth+15 to current+5)
- [ ] Institution name min 3 chars enforced
- [ ] Authentication required for CREATE/UPDATE/DELETE
- [ ] No authentication required for GET
- [ ] Profile completion shows 10% for education
- [ ] Audit logs created (check database)
- [ ] Error messages are clear and helpful

---

## 📝 POSTMAN COLLECTION IMPORT (Optional)

You can create a Postman collection by:

1. Click **New** → **Collection**
2. Name it "SarvVivah - Education CRUD"
3. Add each request from this guide
4. Save the collection
5. Export and share with team

---

## 🐛 TROUBLESHOOTING

**Issue**: 401 Unauthorized  
**Solution**: Check if `access_token` is set correctly in environment variables

**Issue**: 404 User not found  
**Solution**: Verify `user_id` is correct in environment variables

**Issue**: Year validation error  
**Solution**: Calculate allowed year range based on your user's birth year

**Issue**: Duplicate entry error (unexpected)  
**Solution**: Check if entry already exists with same qualification + institution + year

**Issue**: Server not running  
**Solution**: Run `npm run dev` in Backend directory

---

## ✅ SUCCESS CRITERIA

Your testing is complete when:
- ✅ All CREATE validations work
- ✅ Partial updates successful
- ✅ GET returns sorted entries
- ✅ DELETE removes entries
- ✅ Duplicate prevention works
- ✅ Max 5 entries enforced
- ✅ Profile completion updated correctly
- ✅ All error scenarios handled gracefully

---

**Happy Testing! 🚀**

For issues, check:
- Server logs in terminal
- Postman console (View → Show Postman Console)
- Network tab in Postman
- Response body for detailed error messages
