# Task 2.2: Caste Details CRUD - Quick Reference

## 🚀 Endpoints

### 1. Create Caste Details
```http
POST /users/:userId/caste
Authorization: Bearer <token>
Content-Type: application/json

{
  "religion_id": 1,
  "caste_id": 5,
  "sub_caste_id": 12,
  "community_details": "Belongs to Kashyap Gothra"
}
```
**Response**: 201 Created

---

### 2. Update Caste Details
```http
PUT /users/:userId/caste
Authorization: Bearer <token>
Content-Type: application/json

{
  "religion_id": 2  // Changes religion → auto-clears caste
}
```
**Response**: 200 OK with special message if religion changed

---

### 3. Get Caste Details
```http
GET /users/:userId/caste
Authorization: Bearer <token>
```
**Response**: 200 OK with full hierarchy names

---

## 📋 Quick Test Cases

### ✅ Test 1: Create with Religion Only
```json
POST /users/YOUR_USER_ID/caste
{ "religion_id": 1 }
```
**Expected**: 201, profile +4% (Hindu)

### ✅ Test 2: Add Caste
```json
PUT /users/YOUR_USER_ID/caste
{ "caste_id": 5 }
```
**Expected**: 200, profile +10% total (Hindu: 4% + 6%)

### ✅ Test 3: Change Religion
```json
PUT /users/YOUR_USER_ID/caste
{ "religion_id": 2 }
```
**Expected**: 200, message: "Religion updated. Caste and sub-caste have been reset..."

### ❌ Test 4: Invalid Hierarchy
```json
PUT /users/YOUR_USER_ID/caste
{ "caste_id": 999 }  // Belongs to different religion
```
**Expected**: 400, "Selected caste does not belong to your current religion."

### ❌ Test 5: Moderator Blocked
```bash
# Login as Moderator, try to update another user
PUT /users/OTHER_USER_ID/caste
{ "religion_id": 1 }
```
**Expected**: 403 Forbidden

---

## 🔑 Key Business Rules

1. **Religion Change** → Auto-clears caste and sub-caste
2. **Caste Update** → Must belong to current religion
3. **Hindu (religion_id=1)** → Religion 4% + Caste 6% = 10%
4. **Other Religions** → Religion 10%
5. **Active Status** → All selections must be active
6. **POST** → Create only (error if exists)
7. **PUT** → Update only (error if doesn't exist)
8. **Authorization** → Self or Admin only (NOT Moderator)

---

## 📊 Profile Completion

| Scenario | Religion | Caste | Total |
|----------|----------|-------|-------|
| Hindu - Religion only | 4% | 0% | 4% |
| Hindu - Religion + Caste | 4% | 6% | 10% |
| Muslim/Christian/etc. | 10% | N/A | 10% |

---

## 🛠️ Validation Rules

| Field | Required | Constraints |
|-------|----------|-------------|
| `religion_id` | No | Must exist, is_active=true |
| `caste_id` | No | Must belong to religion, is_active=true |
| `sub_caste_id` | No | Must belong to caste, is_active=true |
| `community_details` | No | 10-500 characters |

**At least 1 field required in request body**

---

## 🔒 Authorization Matrix

| Role | Self | Other Users |
|------|------|-------------|
| User | ✅ Create/Update | ❌ Forbidden |
| Admin | ✅ | ✅ |
| Moderator | ✅ (Self) | ❌ Forbidden |

---

## 📝 Error Messages

| Code | Message |
|------|---------|
| 400 | Caste details already exist. Use PUT to update. |
| 400 | Caste details do not exist. Use POST to create first. |
| 400 | Selected caste does not belong to your current religion. |
| 400 | Selected religion is no longer active. Please choose another. |
| 400 | Selected caste is no longer active. Please choose another. |
| 403 | Forbidden. You don't have permission to modify this user's details. |
| 404 | User not found |

---

## 🎯 Postman Collection Snippets

### Environment Variables
```
BASE_URL = http://localhost:3000
TOKEN = <your_jwt_token>
USER_ID = <your_user_id>
```

### Request Examples

**1. Create - Religion Only**
```
POST {{BASE_URL}}/users/{{USER_ID}}/caste
Headers: Authorization: Bearer {{TOKEN}}
Body:
{
  "religion_id": 1
}
```

**2. Update - Add Caste**
```
PUT {{BASE_URL}}/users/{{USER_ID}}/caste
Headers: Authorization: Bearer {{TOKEN}}
Body:
{
  "caste_id": 5
}
```

**3. Get Details**
```
GET {{BASE_URL}}/users/{{USER_ID}}/caste
Headers: Authorization: Bearer {{TOKEN}}
```

**4. Religion Change Test**
```
PUT {{BASE_URL}}/users/{{USER_ID}}/caste
Headers: Authorization: Bearer {{TOKEN}}
Body:
{
  "religion_id": 2,
  "caste_id": 10  // This will be IGNORED
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Caste does not belong to religion"
**Cause**: Trying to update caste without matching religion  
**Solution**: Check which religion user currently has, select caste from that religion

### Issue 2: "Religion is no longer active"
**Cause**: Selected religion has `is_active = false`  
**Solution**: Select a different active religion

### Issue 3: 403 Forbidden
**Cause**: Moderator trying to update another user  
**Solution**: Login as Admin or the target user

### Issue 4: "Caste details already exist"
**Cause**: Using POST when details exist  
**Solution**: Use PUT instead

---

## 📦 Response Examples

### Success - Create
```json
{
  "success": true,
  "message": "Caste details created successfully",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "religion_id": 1,
    "religion_name": "Hinduism",
    "caste_id": 5,
    "caste_name": "Brahmin",
    "sub_caste_id": 12,
    "sub_caste_name": "Iyer",
    "community_details": "Belongs to Kashyap Gothra",
    "created_at": "2025-01-29T10:30:00.000Z",
    "updated_at": "2025-01-29T10:30:00.000Z"
  }
}
```

### Success - Religion Change
```json
{
  "success": true,
  "message": "Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion.",
  "data": {
    "religion_id": 2,
    "religion_name": "Islam",
    "caste_id": null,
    "caste_name": null,
    "sub_caste_id": null,
    "sub_caste_name": null
  }
}
```

### Success - Get Details
```json
{
  "success": true,
  "data": {
    "user_info": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "Rajesh",
      "last_name": "Kumar",
      "gender": "MALE"
    },
    "caste_details": {
      "religion_id": 1,
      "religion_name": "Hinduism",
      "caste_id": 5,
      "caste_name": "Brahmin",
      "sub_caste_id": 12,
      "sub_caste_name": "Iyer",
      "community_details": "Belongs to Kashyap Gothra"
    },
    "profile_completion": {
      "percentage": 40,
      "status": "incomplete"
    }
  }
}
```

### Error - Invalid Hierarchy
```json
{
  "success": false,
  "message": "Selected caste does not belong to your current religion."
}
```

### Error - Forbidden
```json
{
  "success": false,
  "message": "Forbidden. You don't have permission to modify this user's details."
}
```

---

## ✅ Testing Checklist

- [ ] Create caste details with religion only
- [ ] Create caste details with full hierarchy
- [ ] Update caste (add caste to existing religion)
- [ ] Change religion (verify auto-clear)
- [ ] Try invalid hierarchy (caste from different religion)
- [ ] Try inactive religion
- [ ] Get caste details (verify names returned)
- [ ] Test as different user (verify 403)
- [ ] Test as Admin on another user (verify success)
- [ ] Test as Moderator on another user (verify 403)
- [ ] Test POST twice (verify "already exists" error)
- [ ] Test PUT without creating first (verify "doesn't exist" error)
- [ ] Verify Hindu profile completion (4% + 6%)
- [ ] Verify Muslim profile completion (10%)
- [ ] Check audit logs (create and update actions)

---

## 🎓 Next Tasks

After Task 2.2, implement:
- **Task 2.3**: Education Details CRUD
- **Task 2.4**: Professional Details CRUD
- **Task 2.5**: Family Details CRUD
- **Task 2.6**: Horoscope Details CRUD
- **Task 2.7**: Photo Management
- **Task 2.8**: Partner Preferences CRUD

---

## 📚 Documentation Files

- **Full Implementation**: `TASK_2.2_CASTE_DETAILS_IMPLEMENTATION.md`
- **Quick Reference**: `TASK_2.2_QUICK_REFERENCE.md` (This file)
- **API Docs**: http://localhost:3000/api-docs (Swagger UI)
