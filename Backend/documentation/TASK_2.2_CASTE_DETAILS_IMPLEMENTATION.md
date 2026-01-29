# Task 2.2: Caste Details CRUD - Implementation Guide

## Overview

Task 2.2 implements comprehensive caste details management with hierarchical validation (Religion → Caste → Sub-caste), religion change auto-clear logic, Hindu religion special profile completion calculation, and strict RBAC.

**Implementation Date**: January 29, 2025  
**Status**: ✅ Complete (Controller + Routes + Validation + Documentation)

---

## Features Implemented

### 1. **Religion-Caste-Sub-caste Hierarchy**
- Three-level hierarchy with strict relational validation
- Caste must belong to selected religion
- Sub-caste must belong to selected caste
- Active status validation at all levels

### 2. **Religion Change Auto-Clear Logic**
- When `religion_id` is updated: Auto-clears `caste_id` and `sub_caste_id` to NULL
- Ignores any provided caste/sub-caste in the same request
- Returns special message: "Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion."

### 3. **Hindu Religion Special Case**
- **Hindu (religion_id = 1)**:
  - Religion only: 4% profile completion
  - Religion + Caste: 10% profile completion (4% + 6%)
- **Other Religions**: Religion filled = 10% profile completion

### 4. **Active Status Validation**
- All selections (religion, caste, sub-caste) must have `is_active = true`
- Specific error messages: "Selected religion is no longer active. Please choose another."

### 5. **Strict POST/PUT Separation**
- **POST**: Create only - Returns error if details already exist
- **PUT**: Update only - Returns error if details don't exist

### 6. **Flexible Field Requirements**
- All fields optional (can create with religion only)
- Can update individual fields (e.g., caste only)
- Validates hierarchy for any combination

---

## Database Schema

```prisma
model UserCasteDetails {
  user_id           String     @id @db.Uuid
  user              User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  religion_id       Int?
  religion          Religion?  @relation(fields: [religion_id], references: [id])
  caste_id          Int?
  caste             Caste?     @relation(fields: [caste_id], references: [id])
  sub_caste_id      Int?
  sub_caste         SubCaste?  @relation(fields: [sub_caste_id], references: [id])
  community_details String?    @db.Text
  created_at        DateTime   @default(now())
  updated_at        DateTime   @updatedAt

  @@map("user_caste_details")
}
```

**Key Relationships**:
- `user_id` → One-to-one with User (Cascade delete)
- `religion_id` → References Religion.id
- `caste_id` → References Caste.id (must have `religion_id` matching caste's religion)
- `sub_caste_id` → References SubCaste.id (must have `caste_id` matching sub-caste's caste)

---

## API Endpoints

### 1. Create Caste Details

**Endpoint**: `POST /users/:userId/caste`  
**Authentication**: Required (JWT)  
**Authorization**: Self or Admin

**Request Body**:
```json
{
  "religion_id": 1,
  "caste_id": 5,
  "sub_caste_id": 12,
  "community_details": "Belongs to Kashyap Gothra, follows traditional customs"
}
```

**Success Response (201)**:
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
    "community_details": "Belongs to Kashyap Gothra, follows traditional customs",
    "created_at": "2025-01-29T10:30:00.000Z",
    "updated_at": "2025-01-29T10:30:00.000Z"
  }
}
```

**Error Responses**:
- **400**: `Caste details already exist. Use PUT to update.`
- **400**: `Selected caste does not belong to your current religion.`
- **400**: `Selected religion is no longer active. Please choose another.`
- **403**: `Forbidden. You don't have permission to modify this user's details.`
- **404**: `User not found` or `Selected religion/caste/sub-caste not found`

---

### 2. Update Caste Details

**Endpoint**: `PUT /users/:userId/caste`  
**Authentication**: Required (JWT)  
**Authorization**: Self or Admin

**Request Body Examples**:

**Example 1: Change Religion (Auto-clears caste)**:
```json
{
  "religion_id": 3
}
```

**Response**:
```json
{
  "success": true,
  "message": "Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion.",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "religion_id": 3,
    "religion_name": "Islam",
    "caste_id": null,
    "caste_name": null,
    "sub_caste_id": null,
    "sub_caste_name": null,
    "community_details": "Belongs to Kashyap Gothra, follows traditional customs",
    "updated_at": "2025-01-29T10:35:00.000Z"
  }
}
```

**Example 2: Update Caste Only**:
```json
{
  "caste_id": 10
}
```

**Example 3: Add Sub-caste**:
```json
{
  "sub_caste_id": 25
}
```

**Error Responses**:
- **400**: `Caste details do not exist. Use POST to create first.`
- **400**: `Selected caste does not belong to your current religion.`
- **400**: `Selected sub-caste does not belong to your current caste.`
- **403**: Forbidden (Moderator trying to update another user)

---

### 3. Get Caste Details

**Endpoint**: `GET /users/:userId/caste`  
**Authentication**: Required (JWT)  
**Authorization**: Any authenticated user

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user_info": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "Rajesh",
      "last_name": "Kumar",
      "gender": "MALE",
      "date_of_birth": "1990-05-15"
    },
    "caste_details": {
      "religion_id": 1,
      "religion_name": "Hinduism",
      "caste_id": 5,
      "caste_name": "Brahmin",
      "sub_caste_id": 12,
      "sub_caste_name": "Iyer",
      "community_details": "Belongs to Kashyap Gothra, follows traditional customs"
    },
    "profile_completion": {
      "percentage": 40,
      "status": "incomplete",
      "breakdown": {
        "basic_info": { "completed": 20, "total": 20 },
        "personal_details": { "completed": 20, "total": 20 },
        "caste_details": { "completed": 10, "total": 10 }
      }
    }
  }
}
```

**When No Caste Details**:
```json
{
  "success": true,
  "data": {
    "user_info": { ... },
    "caste_details": null,
    "profile_completion": { "percentage": 30, ... }
  }
}
```

---

## Validation Rules

### Field Constraints

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `religion_id` | Integer | No | Must exist in religions table, `is_active = true` |
| `caste_id` | Integer | No | Must exist in castes table, belong to religion, `is_active = true` |
| `sub_caste_id` | Integer | No | Must exist in sub_castes table, belong to caste, `is_active = true` |
| `community_details` | String | No | 10-500 characters |

### Business Rules

1. **At Least One Field Required**: Cannot send empty body
2. **Hierarchical Validation**:
   - If `caste_id` provided: Must have `religion_id` (from DB or request)
   - Caste must have `religion_id` matching user's religion
   - If `sub_caste_id` provided: Must have `caste_id` (from DB or request)
   - Sub-caste must have `caste_id` matching user's caste
3. **Active Status**: All selections must have `is_active = true`
4. **Religion Change**: If `religion_id` changes → Auto-clear `caste_id` and `sub_caste_id`

---

## Profile Completion Logic

### Caste Section Weights

**Hindu Religion (religion_id = 1)**:
- Religion field filled: **4%**
- Caste field filled: **6%**
- **Total**: 10%

**Other Religions**:
- Religion field filled: **10%**
- Caste field: Not counted
- **Total**: 10%

### Calculation Algorithm

```javascript
// Caste Details Section (10% total)
let casteScore = 0;
const casteDetails = user.UserCasteDetails;

if (casteDetails) {
  const isHindu = casteDetails.religion_id === 1;
  
  if (isHindu) {
    // Hindu: Split scoring
    if (casteDetails.religion_id) casteScore += 4;  // Religion = 4%
    if (casteDetails.caste_id) casteScore += 6;     // Caste = 6%
  } else {
    // Other religions: Religion only
    if (casteDetails.religion_id) casteScore += 10; // Religion = 10%
  }
}
```

**Examples**:
- Hindu with religion only: 4%
- Hindu with religion + caste: 10%
- Muslim with religion: 10%
- Christian with religion: 10%

---

## Authorization Rules

### Permission Matrix

| Role | Self | Other Users |
|------|------|-------------|
| **User** | ✅ Create/Update | ❌ Forbidden |
| **Admin** | ✅ Create/Update | ✅ Create/Update |
| **Moderator** | ✅ Create/Update (Self) | ❌ Forbidden |

**Implementation**:
```javascript
async canModifyPersonalDetails(requestingUserId, targetUserId, userRole) {
  if (requestingUserId === targetUserId) return true;    // Self
  if (userRole === 'ADMIN') return true;                 // Admin
  return false;                                           // Moderator/User blocked
}
```

---

## Special Business Logic

### 1. Religion Change Flow

**Scenario**: User changes from Hinduism to Islam

**Request**:
```json
PUT /users/550e8400-e29b-41d4-a716-446655440000/caste
{
  "religion_id": 2,
  "caste_id": 15  // This will be IGNORED
}
```

**Backend Logic**:
```javascript
// Check if religion changed
const existingReligion = existingCasteDetails.religion_id;
const newReligion = validatedData.religion_id;

if (newReligion && newReligion !== existingReligion) {
  // Religion changed → Auto-clear caste and sub-caste
  validatedData.caste_id = null;
  validatedData.sub_caste_id = null;
  
  const updated = await prisma.userCasteDetails.update({
    where: { user_id: userId },
    data: validatedData
  });
  
  return {
    message: "Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion.",
    data: updated
  };
}
```

**Response**:
```json
{
  "success": true,
  "message": "Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion.",
  "data": {
    "religion_id": 2,
    "caste_id": null,
    "sub_caste_id": null
  }
}
```

### 2. Caste Update Validation

**Scenario**: User updates caste without changing religion

**Request**:
```json
PUT /users/550e8400-e29b-41d4-a716-446655440000/caste
{
  "caste_id": 8
}
```

**Backend Logic**:
```javascript
// Fetch current religion from DB
const existingCasteDetails = await prisma.userCasteDetails.findUnique({
  where: { user_id: userId }
});

// Validate caste belongs to current religion
const caste = await prisma.caste.findUnique({
  where: { id: validatedData.caste_id }
});

if (caste.religion_id !== existingCasteDetails.religion_id) {
  throw new ValidationError('Selected caste does not belong to your current religion.');
}
```

### 3. Active Status Validation

**Implementation**:
```javascript
async validateCasteHierarchy(data, existingData) {
  // Validate religion is active
  if (data.religion_id) {
    const religion = await prisma.religion.findUnique({
      where: { id: data.religion_id }
    });
    if (!religion || !religion.is_active) {
      throw new ValidationError('Selected religion is no longer active. Please choose another.');
    }
  }
  
  // Similar validation for caste and sub-caste
}
```

---

## Testing Guide

### Test Case 1: Create with Religion Only
```bash
POST /users/550e8400-e29b-41d4-a716-446655440000/caste
Content-Type: application/json
Authorization: Bearer <token>

{
  "religion_id": 1
}
```

**Expected**: 201 Created, profile_completion increases by 4%

---

### Test Case 2: Create Complete Hierarchy
```bash
POST /users/550e8400-e29b-41d4-a716-446655440000/caste

{
  "religion_id": 1,
  "caste_id": 5,
  "sub_caste_id": 12,
  "community_details": "Belongs to Kashyap Gothra"
}
```

**Expected**: 201 Created, profile_completion increases by 10% (Hindu)

---

### Test Case 3: Religion Change Auto-Clear
**Step 1**: Create with Hindu + Brahmin
```json
POST /users/550e8400-e29b-41d4-a716-446655440000/caste
{ "religion_id": 1, "caste_id": 5 }
```

**Step 2**: Change to Islam
```json
PUT /users/550e8400-e29b-41d4-a716-446655440000/caste
{ "religion_id": 2 }
```

**Expected**: 
- Response message: "Religion updated. Caste and sub-caste have been reset..."
- `caste_id` = null
- `sub_caste_id` = null

---

### Test Case 4: Invalid Hierarchy
```bash
PUT /users/550e8400-e29b-41d4-a716-446655440000/caste

{
  "caste_id": 25  # This caste belongs to Islam, but user has Hinduism
}
```

**Expected**: 400 Bad Request - "Selected caste does not belong to your current religion."

---

### Test Case 5: Inactive Religion
```bash
POST /users/550e8400-e29b-41d4-a716-446655440000/caste

{
  "religion_id": 99  # Assuming this religion has is_active = false
}
```

**Expected**: 400 Bad Request - "Selected religion is no longer active. Please choose another."

---

### Test Case 6: Authorization - Moderator Blocked
**Setup**: Login as Moderator, try to update another user's caste

```bash
PUT /users/OTHER_USER_ID/caste
Authorization: Bearer <moderator_token>

{
  "religion_id": 1
}
```

**Expected**: 403 Forbidden - "You don't have permission to modify this user's details."

---

### Test Case 7: Strict POST
**Setup**: Create caste details, then try POST again

```bash
POST /users/550e8400-e29b-41d4-a716-446655440000/caste
{ "religion_id": 1 }

# Try POST again
POST /users/550e8400-e29b-41d4-a716-446655440000/caste
{ "caste_id": 5 }
```

**Expected**: 400 Bad Request - "Caste details already exist. Use PUT to update."

---

### Test Case 8: Strict PUT
**Setup**: Try PUT without creating first

```bash
PUT /users/NEW_USER_ID/caste
{ "religion_id": 1 }
```

**Expected**: 400 Bad Request - "Caste details do not exist. Use POST to create first."

---

### Test Case 9: Profile Completion (Hindu vs Others)

**Hindu User**:
```bash
POST /users/550e8400-e29b-41d4-a716-446655440000/caste
{ "religion_id": 1 }  # Only religion

GET /users/550e8400-e29b-41d4-a716-446655440000/caste
# Expected: caste_details.percentage includes +4%

PUT /users/550e8400-e29b-41d4-a716-446655440000/caste
{ "caste_id": 5 }  # Add caste

GET /users/550e8400-e29b-41d4-a716-446655440000/caste
# Expected: caste_details.percentage includes +10% (4+6)
```

**Muslim User**:
```bash
POST /users/ANOTHER_USER_ID/caste
{ "religion_id": 2 }  # Islam

GET /users/ANOTHER_USER_ID/caste
# Expected: caste_details.percentage includes +10%
```

---

## Audit Logging

All create/update operations are logged to `audit_logs` table:

```javascript
await createAuditLog(userId, req.user.id, 'CREATE_CASTE_DETAILS', req.ip);
await createAuditLog(userId, req.user.id, 'UPDATE_CASTE_DETAILS', req.ip);
```

**Audit Log Entry**:
```json
{
  "id": 12345,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "actor_id": "admin-user-id",
  "action": "UPDATE_CASTE_DETAILS",
  "ip_address": "192.168.1.1",
  "timestamp": "2025-01-29T10:30:00.000Z"
}
```

---

## Error Handling

### Standard Error Format
```json
{
  "success": false,
  "message": "Selected caste does not belong to your current religion.",
  "errors": [
    {
      "field": "caste_id",
      "message": "Invalid hierarchy"
    }
  ]
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Validation error, details exist/don't exist, hierarchy error |
| 401 | Missing or invalid JWT token |
| 403 | Forbidden (Moderator trying to update another user) |
| 404 | User not found, religion/caste/sub-caste not found |
| 500 | Internal server error |

---

## File Structure

```
Backend/
├── prisma/
│   └── schema.prisma                    # UserCasteDetails model
├── src/
│   ├── controllers/
│   │   └── userProfileController.js     # 5 new methods: create, update, get, validate hierarchy, validate religion
│   ├── routes/
│   │   └── userProfile.js               # 3 new routes: POST, PUT, GET /users/:userId/caste
│   └── utils/
│       └── validation.js                 # casteDetailsSchema with Zod
└── documentation/
    └── TASK_2.2_CASTE_DETAILS_IMPLEMENTATION.md  # This file
```

---

## Controller Methods

### 1. `createCasteDetails(req, res)`
- Validates request body
- Checks if caste details already exist
- Validates hierarchical relationships
- Checks active status
- Creates caste details
- Logs audit trail
- Returns 201 with full data including names

### 2. `updateCasteDetails(req, res)`
- Validates request body
- Checks if caste details exist
- **Special**: Detects religion change → Auto-clears caste/sub-caste
- Validates hierarchy (caste belongs to religion)
- Checks active status
- Updates caste details
- Logs audit trail
- Returns 200 with special message if religion changed

### 3. `getCasteDetails(req, res)`
- Fetches user info
- Fetches caste details with relations (religion, caste, sub-caste)
- Calculates profile completion
- Returns 200 with full hierarchy names

### 4. `validateCasteHierarchy(data, existingData)`
- Validates religion exists and is_active
- Validates caste belongs to religion and is_active
- Validates sub-caste belongs to caste and is_active
- Throws ValidationError with specific messages

### 5. `validateReligionExists(religionId)`
- Validates religion exists
- Validates religion is_active
- Throws NotFoundError or ValidationError

---

## Next Steps

After completing Task 2.2, proceed to:

1. **Task 2.3**: Education Details CRUD
   - Fields: education_level, field_of_study, institution_name, year_of_passing
   - Validation: year_of_passing (1950-2030)
   - Profile completion: 10%

2. **Task 2.4**: Professional Details CRUD
   - Fields: employment_type, occupation, company_name, annual_income
   - Validation: income range enum
   - Profile completion: 10%

---

## Summary

✅ **Completed**:
- Hierarchical validation (Religion → Caste → Sub-caste)
- Religion change auto-clear logic
- Hindu special profile completion (4% + 6%)
- Active status validation
- Strict POST/PUT separation
- Authorization (Self + Admin only)
- Audit logging
- Comprehensive Swagger documentation
- 3 endpoints with full CRUD operations
- Error handling with specific messages

**Total Lines of Code**: ~600 (Controller: ~350, Routes: ~250)

**Ready for Testing**: ✅ Yes
