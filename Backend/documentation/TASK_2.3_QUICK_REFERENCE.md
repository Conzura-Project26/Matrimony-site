# Task 2.3: Education Details - Quick Reference

## 🚀 Quick Start

### **Endpoints**
```
POST   /users/:userId/education          ← Create (Auth: Self/Admin)
PUT    /users/:userId/education/:eduId   ← Update (Auth: Self/Admin)
DELETE /users/:userId/education/:eduId   ← Delete (Auth: Self/Admin)
GET    /users/:userId/education          ← Get All (Public)
```

---

## 📝 API Examples

### **1. Create Education**
```bash
curl -X POST http://localhost:3000/users/{userId}/education \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "highest_qualification": "Bachelor of Engineering",
    "institution_name": "Anna University",
    "year_of_passing": 2020
  }'
```

**Response** (201):
```json
{
  "success": true,
  "message": "Education entry created successfully",
  "data": {
    "id": 1,
    "user_id": "uuid",
    "highest_qualification": "Bachelor of Engineering",
    "institution_name": "Anna University",
    "year_of_passing": 2020
  }
}
```

---

### **2. Update Education (Partial)**
```bash
curl -X PUT http://localhost:3000/users/{userId}/education/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "highest_qualification": "B.Tech Computer Science"
  }'
```

**Response** (200):
```json
{
  "success": true,
  "message": "Education entry updated successfully",
  "data": { ... }
}
```

---

### **3. Delete Education**
```bash
curl -X DELETE http://localhost:3000/users/{userId}/education/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response** (200):
```json
{
  "success": true,
  "message": "Education entry deleted successfully"
}
```

---

### **4. Get All Education**
```bash
curl -X GET http://localhost:3000/users/{userId}/education
```

**Response** (200):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 2,
      "highest_qualification": "Master's...",
      "year_of_passing": 2022
    },
    {
      "id": 1,
      "highest_qualification": "Bachelor's...",
      "year_of_passing": 2020
    }
  ]
}
```

---

## ⚙️ Validation Rules

| Field | Create | Update | Constraints |
|-------|--------|--------|-------------|
| highest_qualification | Required | Optional | 2-150 chars |
| institution_name | Required | Optional | 3-200 chars |
| year_of_passing | Required | Optional | birth+15 to current+5 |

**Max Entries**: 5 per user  
**Duplicate Check**: qualification + institution + year

---

## 🔒 Authorization

| Endpoint | Self | Admin | Moderator | Public |
|----------|------|-------|-----------|--------|
| POST     | ✅   | ✅    | ❌        | ❌     |
| PUT      | ✅   | ✅    | ❌        | ❌     |
| DELETE   | ✅   | ✅    | ❌        | ❌     |
| GET      | ✅   | ✅    | ✅        | ✅     |

---

## 📊 Profile Completion

| Scenario | Completion % |
|----------|-------------|
| No education | 0% |
| 1 full entry | 7% |
| 2+ full entries | 10% |

---

## ❌ Common Errors

**400 - Validation Error**
```json
{
  "success": false,
  "message": "Institution name must be at least 3 characters"
}
```

**400 - Max Limit**
```json
{
  "success": false,
  "message": "Maximum 5 education entries allowed per user"
}
```

**400 - Duplicate**
```json
{
  "success": false,
  "message": "Duplicate education entry. This qualification, institution, and year combination already exists."
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**403 - Forbidden**
```json
{
  "success": false,
  "message": "You do not have permission to modify this user's education details"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Education entry not found"
}
```

---

## 🧪 Testing

**Swagger UI**: http://localhost:3000/api-docs  
**Test Guide**: `node src/tests/educationDetailsTest.js`

---

## 📂 Files Modified

```
✅ src/utils/validation.js                  (Added schemas)
✅ src/controllers/userProfileController.js (Added 4 methods)
✅ src/routes/userProfile.js                (Added 4 routes)
✅ src/tests/educationDetailsTest.js        (Created tests)
```

---

## 💡 Tips

1. **Year Calculation**: User born 1995 → min: 2010, max: 2031
2. **Sorting**: GET returns DESC by year (most recent first)
3. **Partial Updates**: Only send fields you want to change
4. **Public Access**: GET doesn't need authentication
5. **Duplicate Prevention**: All 3 fields must match to be duplicate

---

## 🔧 Constants

```javascript
MAX_EDUCATION_ENTRIES = 5
MIN_YEAR = user.birth_year + 15
MAX_YEAR = current_year + 5
```

---

**Status**: ✅ Production Ready  
**Documentation**: [TASK_2.3_EDUCATION_DETAILS_IMPLEMENTATION.md](./TASK_2.3_EDUCATION_DETAILS_IMPLEMENTATION.md)
