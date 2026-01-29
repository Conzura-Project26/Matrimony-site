# 🎯 Task 2.1: Personal Details CRUD - Quick Reference

## 📡 API Endpoints

```
BASE_URL: http://localhost:3000
```

### 1️⃣ Create/Update Personal Details
```http
POST   /users/:userId/personal
PUT    /users/:userId/personal
```
**Auth:** Required (JWT Bearer Token)  
**Access:** Self, Admin, Moderator

**Request Body (All Optional):**
```json
{
  "height_cm": 175,              // 120-250
  "weight_kg": 70,               // 30-200
  "marital_status": "Never Married",
  "physical_status": "Normal",
  "mother_tongue": "Hindi",
  "complexion": "Fair",
  "body_type": "Athletic",
  "blood_group": "O+",
  "diet_preference": "Vegetarian",
  "drinking_habit": "Never",
  "smoking_habit": "Never",
  "about_me": "Your introduction (10-1000 chars)"
}
```

---

### 2️⃣ Get Personal Details
```http
GET    /users/:userId/personal
```
**Auth:** Required  
**Returns:** User info + Personal details + Profile completion %

---

### 3️⃣ Get Profile Completion Status
```http
GET    /users/:userId/profile-completion
```
**Auth:** Required  
**Returns:** Detailed breakdown + Next steps

---

## 🎨 Enum Values

### Marital Status
- `Never Married`
- `Divorced`
- `Widowed`
- `Awaiting Divorce`
- `Separated`
- `Annulled`

### Physical Status
- `Normal`
- `Visually Impaired`
- `Hearing Impaired`
- `Mobility Impaired`
- `Other`

### Complexion
- `Very Fair`
- `Fair`
- `Wheatish`
- `Wheatish Brown`
- `Dark`

### Body Type
- `Slim`
- `Average`
- `Athletic`
- `Heavy`

### Blood Group
- `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

### Diet Preference
- `Vegetarian`
- `Non-Vegetarian`
- `Eggetarian`
- `Vegan`

### Drinking Habit / Smoking Habit
- `Never`
- `Occasionally`
- `Socially`
- `Regularly`

---

## 🔐 Authorization Matrix

| Action | Self | Admin | Moderator | Other Users |
|--------|------|-------|-----------|-------------|
| Create/Update Own Details | ✅ | ✅ | ✅ | ❌ |
| Create/Update Other's Details | ❌ | ✅ | ✅ | ❌ |
| View Own Details | ✅ | ✅ | ✅ | ❌ |
| View Other's Details | Limited | ✅ | ✅ | Limited |
| View Completion Status | ✅ | ✅ | ✅ | ❌ |

---

## ✅ Validation Rules

| Field | Type | Min | Max | Required |
|-------|------|-----|-----|----------|
| height_cm | Integer | 120 | 250 | ❌ |
| weight_kg | Integer | 30 | 200 | ❌ |
| mother_tongue | String | 2 chars | 50 chars | ❌ |
| about_me | String | 10 chars | 1000 chars | ❌ |
| All Enums | String | - | - | ❌ |

**Note:** At least 1 field required for update operations

---

## 📊 Profile Completion Weights

| Section | Weight | Status |
|---------|--------|--------|
| Basic Info | 20% | ✅ Auto (from User model) |
| Personal Details | 20% | ✅ Task 2.1 |
| Caste Details | 10% | ⏳ Task 2.2 |
| Education Details | 10% | ⏳ Task 2.3 |
| Professional Details | 10% | ⏳ Task 2.4 |
| Family Details | 10% | ⏳ Task 2.5 |
| Horoscope Details | 5% | ⏳ Task 2.6 |
| Photos | 10% | ⏳ Task 2.8 |
| Partner Preferences | 5% | ⏳ Task 2.7 |
| **TOTAL** | **100%** | |

---

## 🧪 Quick Test Commands

### Using cURL:

**1. Create Personal Details:**
```bash
curl -X POST http://localhost:3000/users/YOUR_USER_ID/personal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height_cm": 175,
    "weight_kg": 70,
    "marital_status": "Never Married",
    "mother_tongue": "Hindi"
  }'
```

**2. Get Personal Details:**
```bash
curl -X GET http://localhost:3000/users/YOUR_USER_ID/personal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. Get Profile Completion:**
```bash
curl -X GET http://localhost:3000/users/YOUR_USER_ID/profile-completion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 Swagger Documentation

**Access:** http://localhost:3000/api-docs

Navigate to **"User Profile"** section to:
- View detailed API documentation
- See request/response schemas
- Try endpoints interactively
- View example requests

---

## 🐛 Common Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Validation error | Invalid field value or format |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | No permission to access resource |
| 404 | User not found | Invalid user ID |
| 500 | Internal server error | Server-side issue |

---

## 📝 Example Response

```json
{
  "success": true,
  "data": {
    "user_info": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "gender": "Male",
      "date_of_birth": "1995-05-15",
      "age": 30,
      "mobile_number": "+919876543210",
      "email": "john@example.com",
      "profile_created_by": "Self",
      "is_mobile_verified": true,
      "is_email_verified": true,
      "is_profile_verified": false,
      "is_active": true
    },
    "personal_details": {
      "height_cm": 175,
      "height_display": "5 ft 9 in (175 cm)",
      "weight_kg": 70,
      "marital_status": "Never Married",
      "physical_status": "Normal",
      "mother_tongue": "Hindi",
      "complexion": "Fair",
      "body_type": "Athletic",
      "blood_group": "O+",
      "diet_preference": "Vegetarian",
      "drinking_habit": "Never",
      "smoking_habit": "Never",
      "about_me": "Software engineer passionate about technology...",
      "created_at": "2026-01-29T10:30:00.000Z",
      "updated_at": "2026-01-29T10:30:00.000Z"
    },
    "profile_completion": {
      "percentage": 45,
      "status": "In Progress"
    }
  }
}
```

---

## 🎉 Implementation Status

✅ **FULLY COMPLETE & PRODUCTION READY**

- ✅ Database schema updated
- ✅ Migration applied successfully
- ✅ Validation schemas created
- ✅ Controller with CRUD operations
- ✅ Routes with Swagger docs
- ✅ Authorization & RBAC
- ✅ Audit logging
- ✅ Profile completion tracking
- ✅ Error handling
- ✅ Security features
- ✅ Server running successfully

**Status:** Ready for Testing → QA → Production

---

## 📞 Support

For issues or questions:
1. Check Swagger docs: `/api-docs`
2. Review error logs: `Backend/logs/`
3. Check audit logs: `SELECT * FROM audit_logs;`
4. Review implementation: `TASK_2.1_PERSONAL_DETAILS_IMPLEMENTATION.md`
